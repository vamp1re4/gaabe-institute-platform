/**
 * Web-standard API core. A deployment adapter (for example a Worker) supplies
 * secrets and forwards Requests; secrets never enter a browser bundle.
 */
export interface ApiEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  CONTACT_RECIPIENT?: string;
  /** Comma-separated, exact browser origins allowed to make cross-origin API calls. */
  ALLOWED_ORIGINS?: string;
}

export interface ApiDependencies {
  env: ApiEnv;
  fetch?: typeof fetch;
  now?: () => number;
}

type ContactPayload = { name: string; email: string; message: string };

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff' };
const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-frame-options': 'DENY',
};

class FixedWindowRateLimiter {
  private readonly records = new Map<string, { start: number; count: number }>();
  constructor(private readonly limit: number, private readonly windowMs: number, private readonly now: () => number) {}

  take(key: string) {
    const now = this.now();
    const prior = this.records.get(key);
    const record = !prior || now - prior.start >= this.windowMs ? { start: now, count: 0 } : prior;
    record.count += 1;
    this.records.set(key, record);
    return { allowed: record.count <= this.limit, retryAfter: Math.max(1, Math.ceil((this.windowMs - (now - record.start)) / 1000)) };
  }
}

function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...SECURITY_HEADERS, ...headers } });
}

function allowedOrigins(env: ApiEnv) {
  return new Set((env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean));
}

function cors(request: Request, origins: Set<string>): Record<string, string> | null {
  const origin = request.headers.get('origin');
  if (!origin) return {};
  return origins.has(origin) ? { 'access-control-allow-origin': origin, vary: 'origin' } : null;
}

function contactPayload(value: unknown): ContactPayload | null {
  if (!value || typeof value !== 'object') return null;
  const { name, email, message } = value as Record<string, unknown>;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') return null;
  const normalized = { name: name.trim(), email: email.trim().toLowerCase(), message: message.trim() };
  if (!normalized.name || normalized.name.length > 100) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) || normalized.email.length > 254) return null;
  if (!normalized.message || normalized.message.length > 5_000) return null;
  return normalized;
}

function mailConfigured(env: ApiEnv): env is Required<Pick<ApiEnv, 'RESEND_API_KEY' | 'RESEND_FROM' | 'CONTACT_RECIPIENT'>> {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM && env.CONTACT_RECIPIENT);
}

async function sendContact(fetcher: typeof fetch, env: Required<Pick<ApiEnv, 'RESEND_API_KEY' | 'RESEND_FROM' | 'CONTACT_RECIPIENT'>>, contact: ContactPayload) {
  return fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [env.CONTACT_RECIPIENT],
      reply_to: contact.email,
      subject: `Gaabe Institute contact request from ${contact.name}`,
      text: `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`,
    }),
  });
}

export function createApi({ env, fetch: fetcher = fetch, now = Date.now }: ApiDependencies) {
  const origins = allowedOrigins(env);
  const contactRateLimit = new FixedWindowRateLimiter(5, 60_000, now);

  return async function handle(request: Request): Promise<Response> {
    const requestCors = cors(request, origins);
    if (requestCors === null) return response({ error: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...requestCors, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' } });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return response({ status: 'ok', email: mailConfigured(env) ? 'configured' : 'not_configured' }, 200, requestCors);
    }
    if (request.method !== 'POST' || url.pathname !== '/api/contact') return response({ error: 'not_found' }, 404, requestCors);

    const client = request.headers.get('cf-connecting-ip') ?? 'anonymous';
    const rate = contactRateLimit.take(client);
    if (!rate.allowed) return response({ error: 'rate_limited' }, 429, { ...requestCors, 'retry-after': String(rate.retryAfter) });
    if (!mailConfigured(env)) return response({ error: 'service_not_configured' }, 503, requestCors);

    let value: unknown;
    try { value = await request.json(); } catch { return response({ error: 'invalid_json' }, 400, requestCors); }
    const contact = contactPayload(value);
    if (!contact) return response({ error: 'invalid_contact_request' }, 400, requestCors);

    try {
      const sent = await sendContact(fetcher, env, contact);
      if (!sent.ok) return response({ error: 'email_unavailable' }, 502, requestCors);
      return response({ ok: true }, 202, requestCors);
    } catch {
      return response({ error: 'email_unavailable' }, 502, requestCors);
    }
  };
}

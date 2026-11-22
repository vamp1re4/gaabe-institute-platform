/**
 * Internal email delivery boundary. It is intentionally not a browser API,
 * has no public route, and is not deployed until owner-approved secrets exist.
 */
export type EmailWorkerSecrets = {
  RESEND_API_KEY: string;
  EMAIL_JOB_TOKEN: string;
  EMAIL_FROM: string;
};

type EmailJob = {
  type: 'welcome' | 'class_reminder';
  to: string;
  language: 'en' | 'dv';
  studentName: string;
  classTitle?: string;
  classTime?: string;
};

const MAX_BODY_BYTES = 8_192;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,200}$/;
const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: {
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  },
});
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));

function cleanText(value: unknown, maximum: number) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  return result && result.length <= maximum && !/[\r\n]/.test(result) ? result : null;
}

function validateJob(value: unknown): EmailJob | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const studentName = cleanText(source.studentName, 120);
  const to = typeof source.to === 'string' ? source.to.trim().toLowerCase() : '';
  if (!studentName || !EMAIL.test(to) || to.length > 254 || (source.language !== 'en' && source.language !== 'dv')) return null;
  if (source.type === 'welcome') return { type: 'welcome', to, language: source.language, studentName };
  const classTitle = cleanText(source.classTitle, 200);
  const classTime = cleanText(source.classTime, 100);
  if (source.type !== 'class_reminder' || !classTitle || !classTime) return null;
  return { type: 'class_reminder', to, language: source.language, studentName, classTitle, classTime };
}

async function constantTimeEquals(supplied: string, expected: string) {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual?: (a: ArrayBuffer, b: ArrayBuffer) => boolean };
  if (subtle.timingSafeEqual) return subtle.timingSafeEqual(left, right);
  // Local test runtimes may not provide the Workers method. Hashes are always
  // the same length, and this loop has no early exit.
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index]! ^ b[index]!;
  return difference === 0;
}

async function boundedJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new RangeError('too_large');
  if (!request.body) throw new SyntaxError('missing_body');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > MAX_BODY_BYTES) throw new RangeError('too_large');
    parts.push(next.value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder().decode(body));
}

function render(job: EmailJob) {
  const dv = job.language === 'dv';
  const subject = job.type === 'welcome'
    ? (dv ? 'ގާބޭ އިންސްޓިޓިއުޓަށް މަރުޙަބާ' : 'Welcome to Gaabe Institute')
    : (dv ? 'ކްލާސް ހަނދާންކުރުން' : 'Class reminder from Gaabe Institute');
  const text = job.type === 'welcome'
    ? (dv ? `މަރުޙަބާ، ${job.studentName}. ގާބޭ އިންސްޓިޓިއުޓަށް މަރުޙަބާ.` : `Welcome, ${job.studentName}. Thanks for joining Gaabe Institute.`)
    : (dv ? `${job.studentName}، ކްލާސް ހަނދާންކުރުން: ${job.classTitle} — ${job.classTime}` : `Hello ${job.studentName}, a reminder: ${job.classTitle} — ${job.classTime}`);
  const safeSubject = escapeHtml(subject);
  return {
    subject,
    text,
    html: `<!doctype html><html lang="${job.language}" dir="${dv ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${safeSubject}</title></head><body><div lang="${job.language}" dir="${dv ? 'rtl' : 'ltr'}"><h1>${safeSubject}</h1><p>${escapeHtml(text)}</p></div></body></html>`,
  };
}

async function send(fetcher: typeof fetch, env: EmailWorkerSecrets, job: EmailJob, idempotencyKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [job.to], ...render(job) }),
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function createEmailWorker(fetcher: typeof fetch = fetch) {
  return {
    async fetch(request: Request, env: EmailWorkerSecrets): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname !== '/internal/email/send') return json({ error: 'not_found' }, 404);
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      const authorization = request.headers.get('authorization');
      const supplied = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!supplied || !env.EMAIL_JOB_TOKEN || !await constantTimeEquals(supplied, env.EMAIL_JOB_TOKEN)) return json({ error: 'unauthorized' }, 401);
      const idempotencyKey = request.headers.get('idempotency-key') ?? '';
      if (!IDEMPOTENCY_KEY.test(idempotencyKey)) return json({ error: 'idempotency_key_required' }, 400);
      let job: EmailJob | null;
      try { job = validateJob(await boundedJson(request)); } catch (error) { return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_json' }, error instanceof RangeError ? 413 : 400); }
      if (!job) return json({ error: 'invalid_job' }, 400);
      try {
        const provider = await send(fetcher, env, job, idempotencyKey);
        if (!provider.ok) {
          console.error(JSON.stringify({ event: 'email_provider_failure', status: provider.status, type: job.type }));
          return json({ error: 'delivery_provider_error' }, 502);
        }
        const result = await provider.json() as { id?: string };
        console.log(JSON.stringify({ event: 'email_accepted', id: result.id ?? null, type: job.type }));
        return json({ id: result.id ?? null, status: 'accepted' }, 202);
      } catch {
        console.error(JSON.stringify({ event: 'email_provider_unavailable', type: job.type }));
        return json({ error: 'delivery_provider_unavailable' }, 502);
      }
    },
  } satisfies ExportedHandler<EmailWorkerSecrets>;
}

export default createEmailWorker();

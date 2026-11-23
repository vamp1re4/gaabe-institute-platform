/**
 * Internal email delivery boundary. It is intentionally not a browser API,
 * has no public route for sending, and is not deployed until owner-approved
 * secrets exist. The webhook route is the one inbound endpoint the Resend
 * dashboard calls; every other caller must present EMAIL_JOB_TOKEN.
 */
export type EmailWorkerSecrets = {
  RESEND_API_KEY: string;
  EMAIL_JOB_TOKEN: string;
  EMAIL_FROM: string;
  /** Resend's webhook signing secret (the "whsec_..." value shown when a webhook is created). */
  RESEND_WEBHOOK_SECRET?: string;
  /** KV namespace storing suppressed recipients. Key: lowercased email. Value: JSON { reason, at }. */
  SUPPRESSIONS?: KVNamespace;
};

type EmailJob = {
  type: 'welcome' | 'verification' | 'enrollment' | 'class_reminder';
  to: string;
  language: 'en' | 'dv';
  studentName: string;
  classTitle?: string;
  classTime?: string;
  courseTitle?: string;
  verificationUrl?: string;
};

const MAX_BODY_BYTES = 8_192;
const MAX_WEBHOOK_BYTES = 65_536;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{16,200}$/;
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
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

function cleanUrl(value: unknown, maximum: number) {
  const text = cleanText(value, maximum);
  if (!text) return null;
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'https:' ? text : null;
  } catch {
    return null;
  }
}

function validateJob(value: unknown): EmailJob | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const studentName = cleanText(source.studentName, 120);
  const to = typeof source.to === 'string' ? source.to.trim().toLowerCase() : '';
  if (!studentName || !EMAIL.test(to) || to.length > 254 || (source.language !== 'en' && source.language !== 'dv')) return null;
  const language = source.language;
  if (source.type === 'welcome') return { type: 'welcome', to, language, studentName };
  if (source.type === 'verification') {
    const verificationUrl = cleanUrl(source.verificationUrl, 2048);
    if (!verificationUrl) return null;
    return { type: 'verification', to, language, studentName, verificationUrl };
  }
  if (source.type === 'enrollment') {
    const courseTitle = cleanText(source.courseTitle, 200);
    if (!courseTitle) return null;
    return { type: 'enrollment', to, language, studentName, courseTitle };
  }
  const classTitle = cleanText(source.classTitle, 200);
  const classTime = cleanText(source.classTime, 100);
  if (source.type !== 'class_reminder' || !classTitle || !classTime) return null;
  return { type: 'class_reminder', to, language, studentName, classTitle, classTime };
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

async function readBounded(request: Request, limit: number): Promise<string> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) throw new RangeError('too_large');
  if (!request.body) throw new SyntaxError('missing_body');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > limit) throw new RangeError('too_large');
    parts.push(next.value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
  return new TextDecoder().decode(body);
}

function render(job: EmailJob) {
  const dv = job.language === 'dv';
  const subjects: Record<EmailJob['type'], [string, string]> = {
    welcome: ['Welcome to Gaabe Institute', 'ގާބޭ އިންސްޓިޓިއުޓަށް މަރުޙަބާ'],
    verification: ['Confirm your Gaabe Institute email', 'އީމެއިލް ޔަގީންކުރައްވާ'],
    enrollment: ['You are enrolled', 'ކޯހުގައި ބައިވެރިވެވިއްޖެ'],
    class_reminder: ['Class reminder from Gaabe Institute', 'ކްލާސް ހަނދާންކުރުން'],
  };
  const subject = dv ? subjects[job.type][1] : subjects[job.type][0];
  const text = job.type === 'welcome'
    ? (dv ? `މަރުޙަބާ، ${job.studentName}. ގާބޭ އިންސްޓިޓިއުޓަށް މަރުޙަބާ.` : `Welcome, ${job.studentName}. Thanks for joining Gaabe Institute.`)
    : job.type === 'verification'
    ? (dv ? `${job.studentName}، ތިރީގައިވާ ލިންކް ބޭނުންކުރައްވައި އީމެއިލް ޔަގީންކުރައްވާ: ${job.verificationUrl}` : `Hi ${job.studentName}, confirm your email using this link: ${job.verificationUrl}`)
    : job.type === 'enrollment'
    ? (dv ? `${job.studentName}، ތިޔަބޭފުޅާ "${job.courseTitle}" ކޯހުގައި ބައިވެރިވެވިއްޖެ.` : `Hi ${job.studentName}, you are now enrolled in ${job.courseTitle}.`)
    : (dv ? `${job.studentName}، ކްލާސް ހަނދާންކުރުން: ${job.classTitle} — ${job.classTime}` : `Hello ${job.studentName}, a reminder: ${job.classTitle} — ${job.classTime}`);
  const safeSubject = escapeHtml(subject);
  const bodyHtml = job.type === 'verification'
    ? `${escapeHtml(text.split(job.verificationUrl!)[0] ?? '')}<a href="${escapeHtml(job.verificationUrl!)}">${dv ? 'ލިންކް' : 'Confirm email'}</a>`
    : escapeHtml(text);
  return {
    subject,
    text,
    html: `<!doctype html><html lang="${job.language}" dir="${dv ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${safeSubject}</title></head><body><div lang="${job.language}" dir="${dv ? 'rtl' : 'ltr'}"><h1>${safeSubject}</h1><p>${bodyHtml}</p></div></body></html>`,
  };
}

async function isSuppressed(env: EmailWorkerSecrets, email: string) {
  if (!env.SUPPRESSIONS) return false;
  return (await env.SUPPRESSIONS.get(email)) !== null;
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

// --- Resend webhook (Svix-format signature) -------------------------------

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function verifyWebhookSignature(secret: string, id: string, timestamp: string, body: string, signatureHeader: string) {
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS) return false;
  const secretBytes = base64ToBytes(secret.startsWith('whsec_') ? secret.slice(6) : secret);
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = `${id}.${timestamp}.${body}`;
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  const candidates = signatureHeader.split(' ').map((entry) => entry.split(',')[1]).filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    if (await constantTimeEquals(candidate, expected)) return true;
  }
  return false;
}

type ResendWebhookEvent = { type?: string; data?: { to?: string[] | string; email_id?: string } };

function recipientsOf(event: ResendWebhookEvent): string[] {
  const to = event.data?.to;
  if (!to) return [];
  return (Array.isArray(to) ? to : [to]).filter((value): value is string => typeof value === 'string').map((value) => value.toLowerCase());
}

async function handleWebhook(request: Request, env: EmailWorkerSecrets): Promise<Response> {
  if (!env.RESEND_WEBHOOK_SECRET) return json({ error: 'webhook_not_configured' }, 503);
  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signature = request.headers.get('svix-signature');
  if (!id || !timestamp || !signature) return json({ error: 'missing_signature' }, 400);
  let body: string;
  try { body = await readBounded(request, MAX_WEBHOOK_BYTES); } catch (error) { return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_body' }, error instanceof RangeError ? 413 : 400); }
  if (!await verifyWebhookSignature(env.RESEND_WEBHOOK_SECRET, id, timestamp, body, signature)) return json({ error: 'invalid_signature' }, 401);
  let event: ResendWebhookEvent;
  try { event = JSON.parse(body); } catch { return json({ error: 'invalid_json' }, 400); }
  const suppressingEvents = new Set(['email.bounced', 'email.complained']);
  if (event.type && suppressingEvents.has(event.type) && env.SUPPRESSIONS) {
    const reason = event.type === 'email.complained' ? 'complaint' : 'bounce';
    for (const recipient of recipientsOf(event)) {
      await env.SUPPRESSIONS.put(recipient, JSON.stringify({ reason, at: new Date().toISOString() }));
    }
  }
  console.log(JSON.stringify({ event: 'email_webhook_received', type: event.type ?? 'unknown' }));
  return json({ status: 'accepted' }, 200);
}

export function createEmailWorker(fetcher: typeof fetch = fetch) {
  return {
    async fetch(request: Request, env: EmailWorkerSecrets): Promise<Response> {
      const url = new URL(request.url);

      if (url.pathname === '/internal/email/webhook') {
        if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
        return handleWebhook(request, env);
      }

      if (url.pathname !== '/internal/email/send') return json({ error: 'not_found' }, 404);
      if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
      const authorization = request.headers.get('authorization');
      const supplied = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!supplied || !env.EMAIL_JOB_TOKEN || !await constantTimeEquals(supplied, env.EMAIL_JOB_TOKEN)) return json({ error: 'unauthorized' }, 401);
      const idempotencyKey = request.headers.get('idempotency-key') ?? '';
      if (!IDEMPOTENCY_KEY.test(idempotencyKey)) return json({ error: 'idempotency_key_required' }, 400);
      let job: EmailJob | null;
      try { job = validateJob(JSON.parse(await readBounded(request, MAX_BODY_BYTES))); } catch (error) { return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_json' }, error instanceof RangeError ? 413 : 400); }
      if (!job) return json({ error: 'invalid_job' }, 400);
      if (await isSuppressed(env, job.to)) {
        console.log(JSON.stringify({ event: 'email_suppressed', type: job.type }));
        return json({ error: 'recipient_suppressed' }, 403);
      }
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

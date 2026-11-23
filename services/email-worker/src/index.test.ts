import { describe, expect, it, vi } from 'vitest';
import { createEmailWorker, type EmailWorkerSecrets } from './index';

const env: EmailWorkerSecrets = { RESEND_API_KEY: 're_test', EMAIL_JOB_TOKEN: 'long-unpredictable-test-token', EMAIL_FROM: 'Gaabe Institute <noreply@mail.techtasks.store>' };
const payload = { type: 'welcome', to: 'student@example.test', language: 'en', studentName: 'Amina' };
const request = (body = payload, headers: HeadersInit = {}) => new Request('https://email.example.test/internal/email/send', { method: 'POST', headers: { authorization: `Bearer ${env.EMAIL_JOB_TOKEN}`, 'idempotency-key': 'welcome-student-0001', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

describe('email worker', () => {
  it('rejects unauthorised and malformed requests before sending', async () => {
    const fetcher = vi.fn();
    const worker = createEmailWorker(fetcher);
    expect((await worker.fetch(request(payload, { authorization: 'Bearer wrong' }), env)).status).toBe(401);
    expect((await worker.fetch(request({ ...payload, to: 'not-an-email' }), env)).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('requires an idempotency key and forwards it to Resend', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }));
    const worker = createEmailWorker(fetcher);
    expect((await worker.fetch(request(payload, { 'idempotency-key': 'short' }), env)).status).toBe(400);
    const response = await worker.fetch(request(), env);
    expect(response.status).toBe(202);
    expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ headers: expect.objectContaining({ 'idempotency-key': 'welcome-student-0001' }) }));
  });

  it('renders accessible Dhivehi HTML and escapes student data', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email_2' }), { status: 200 }));
    const worker = createEmailWorker(fetcher);
    await worker.fetch(request({ ...payload, language: 'dv', studentName: '<Amina>' }), env);
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body.html).toContain('<html lang="dv" dir="rtl">');
    expect(body.html).toContain('<div lang="dv" dir="rtl">');
    expect(body.html).toContain('&lt;Amina&gt;');
  });

  it('does not disclose provider details when Resend fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('provider details', { status: 401 }));
    const worker = createEmailWorker(fetcher);
    const response = await worker.fetch(request(), env);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'delivery_provider_error' });
  });

  it('renders verification and enrollment jobs and rejects an insecure verification link', async () => {
    // A fresh Response per call: a mocked Response body can only be read once,
    // and the worker calls provider.json() on every accepted send.
    const fetcher = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ id: 'email_3' }), { status: 200 }));
    const worker = createEmailWorker(fetcher);
    const verification = await worker.fetch(request({ type: 'verification', to: 'student@example.test', language: 'en', studentName: 'Amina', verificationUrl: 'https://clientdemo.techtasks.store/verify?t=abc' }), env);
    expect(verification.status).toBe(202);
    const sentBody = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(sentBody.html).toContain('href="https://clientdemo.techtasks.store/verify?t=abc"');

    const enrollment = await worker.fetch(request({ type: 'enrollment', to: 'student@example.test', language: 'en', studentName: 'Amina', courseTitle: 'Tajweed Basics' }), env);
    expect(enrollment.status).toBe(202);

    const insecure = await worker.fetch(request({ type: 'verification', to: 'student@example.test', language: 'en', studentName: 'Amina', verificationUrl: 'http://not-https.test/verify' }), env);
    expect(insecure.status).toBe(400);
  });

  it('blocks sending to a suppressed recipient without calling Resend', async () => {
    const fetcher = vi.fn();
    const suppressions = new Map<string, string>([['student@example.test', JSON.stringify({ reason: 'bounce', at: 'now' })]]);
    const SUPPRESSIONS = { get: vi.fn(async (key: string) => suppressions.get(key) ?? null), put: vi.fn(async (key: string, value: string) => { suppressions.set(key, value); }) } as unknown as EmailWorkerSecrets['SUPPRESSIONS'];
    const worker = createEmailWorker(fetcher);
    const response = await worker.fetch(request(), { ...env, SUPPRESSIONS });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'recipient_suppressed' });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('email webhook', () => {
  const WEBHOOK_SECRET = 'whsec_dGVzdC1zaWduaW5nLXNlY3JldC1iYXNlNjQ=';

  async function sign(id: string, timestamp: string, body: string) {
    const raw = atob(WEBHOOK_SECRET.slice(6));
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
    return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
  }

  function webhookRequest(body: string, headers: HeadersInit) {
    return new Request('https://email.example.test/internal/email/webhook', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
  }

  it('rejects a webhook with a missing or invalid signature', async () => {
    const worker = createEmailWorker(vi.fn());
    const webhookEnv = { ...env, RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET };
    const noSignature = await worker.fetch(webhookRequest('{}', {}), webhookEnv);
    expect(noSignature.status).toBe(400);
    const wrongSignature = await worker.fetch(webhookRequest('{}', { 'svix-id': 'msg_1', 'svix-timestamp': String(Math.floor(Date.now() / 1000)), 'svix-signature': 'v1,wrong' }), webhookEnv);
    expect(wrongSignature.status).toBe(401);
  });

  it('accepts a correctly signed bounce event and records the suppression', async () => {
    const suppressions = new Map<string, string>();
    const SUPPRESSIONS = { get: vi.fn(async (key: string) => suppressions.get(key) ?? null), put: vi.fn(async (key: string, value: string) => { suppressions.set(key, value); }) } as unknown as EmailWorkerSecrets['SUPPRESSIONS'];
    const worker = createEmailWorker(vi.fn());
    const body = JSON.stringify({ type: 'email.bounced', data: { to: ['bounced@example.test'] } });
    const id = 'msg_2';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await sign(id, timestamp, body);
    const response = await worker.fetch(webhookRequest(body, { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': signature }), { ...env, RESEND_WEBHOOK_SECRET: WEBHOOK_SECRET, SUPPRESSIONS });
    expect(response.status).toBe(200);
    expect(suppressions.has('bounced@example.test')).toBe(true);
  });
});

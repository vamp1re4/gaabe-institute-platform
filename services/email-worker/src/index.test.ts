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
});

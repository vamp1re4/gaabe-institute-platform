import { describe, expect, it, vi } from 'vitest';
import { createApi } from './server';

const configured = { RESEND_API_KEY: 're_test', RESEND_FROM: 'Gaabe <noreply@example.test>', CONTACT_RECIPIENT: 'team@example.test', ALLOWED_ORIGINS: 'https://clientdemo.techtasks.store' };
const contact = { name: 'Amina', email: 'amina@example.test', message: 'Please contact me.' };

describe('API foundation', () => {
  it('reports unconfigured email honestly without leaking secrets', async () => {
    const response = await createApi({ env: {} })(new Request('https://api.example.test/api/health'));
    expect(await response.json()).toEqual({ status: 'ok', email: 'not_configured' });
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
  });

  it('only permits exact configured origins', async () => {
    const api = createApi({ env: configured });
    const denied = await api(new Request('https://api.example.test/api/contact', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify(contact) }));
    expect(denied.status).toBe(403);
    const preflight = await api(new Request('https://api.example.test/api/contact', { method: 'OPTIONS', headers: { origin: 'https://clientdemo.techtasks.store' } }));
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://clientdemo.techtasks.store');
  });

  it('validates contact input and sends through Resend only on the server', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }));
    const api = createApi({ env: configured, fetch: fetcher });
    const result = await api(new Request('https://api.example.test/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.1' }, body: JSON.stringify(contact) }));
    expect(result.status).toBe(202);
    expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ method: 'POST' }));
    expect(String(fetcher.mock.calls[0]?.[1]?.body)).not.toContain('re_test');
  });

  it('rate limits repeated contact requests', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const api = createApi({ env: configured, fetch: fetcher, now: () => 1_000 });
    const request = () => new Request('https://api.example.test/api/contact', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.2' }, body: JSON.stringify(contact) });
    for (let index = 0; index < 5; index += 1) expect((await api(request())).status).toBe(202);
    expect((await api(request())).status).toBe(429);
  });
});

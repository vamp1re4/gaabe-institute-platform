import { describe, expect, it, vi } from 'vitest';
import { createPaymentWorker, type PaymentWorkerEnv } from './index';

const env: PaymentWorkerEnv = {
  STRIPE_SECRET_KEY: 'rk_test_worker_key',
  STRIPE_WEBHOOK_SECRET: 'whsec_example_secret',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-only',
  ALLOWED_ORIGIN: 'https://clientdemo.techtasks.store',
  CHECKOUT_SUCCESS_URL: 'https://clientdemo.techtasks.store/payment/success?session_id={CHECKOUT_SESSION_ID}',
  CHECKOUT_CANCEL_URL: 'https://clientdemo.techtasks.store/pricing',
  STRIPE_STANDARD_PRICE_ID: 'price_standard',
  STRIPE_PREMIUM_PRICE_ID: 'price_premium',
};

async function signature(timestamp: number, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`)))].map((part) => part.toString(16).padStart(2, '0')).join('');
}

describe('payments worker', () => {
  it('does not present a configured service as ready without its database secret', async () => {
    const worker = createPaymentWorker();
    const response = await worker.fetch(new Request('https://payments.example.test/health'), { ...env, SUPABASE_SERVICE_ROLE_KEY: '' });
    expect(await response.json()).toEqual({ service: 'gaabe-payments', mode: 'test', ready: false, configuration: { stripeTestKey: true, stripeWebhookSecret: true, supabaseServiceRole: false } });
  });

  it('rejects arbitrary plans before it calls either provider', async () => {
    const fetcher = vi.fn();
    const worker = createPaymentWorker(fetcher);
    const response = await worker.fetch(new Request('https://payments.example.test/v1/checkout', {
      method: 'POST', headers: { origin: env.ALLOWED_ORIGIN, authorization: 'Bearer firebase-token', 'content-type': 'application/json', 'idempotency-key': 'checkout-request-0001' }, body: JSON.stringify({ plan: 'free' }),
    }), env);
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('creates Checkout with a server allowlisted price after verifying the learner', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{ firebase_uid: 'firebase-user-1' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.test/c/pay/cs_test_1', livemode: false }), { status: 200 }));
    const worker = createPaymentWorker(fetcher);
    const response = await worker.fetch(new Request('https://payments.example.test/v1/checkout', {
      method: 'POST', headers: { origin: env.ALLOWED_ORIGIN, authorization: 'Bearer firebase-token', 'content-type': 'application/json', 'idempotency-key': 'checkout-request-0002' }, body: JSON.stringify({ plan: 'standard' }),
    }), env);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ checkoutUrl: 'https://checkout.stripe.test/c/pay/cs_test_1' });
    expect(String(fetcher.mock.calls[2]?.[1]?.body)).toContain('line_items%5B0%5D%5Bprice%5D=price_standard');
  });

  it('rejects a webhook whose signed bytes were modified', async () => {
    const worker = createPaymentWorker(vi.fn());
    const body = JSON.stringify({ id: 'evt_test_1', type: 'checkout.session.completed', livemode: false });
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await worker.fetch(new Request('https://payments.example.test/webhook/stripe', {
      method: 'POST', headers: { 'stripe-signature': `t=${timestamp},v1=${await signature(timestamp, `${body}x`)}` }, body,
    }), env);
    expect(response.status).toBe(400);
  });
});

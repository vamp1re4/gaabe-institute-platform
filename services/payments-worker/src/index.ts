/**
 * Test-mode Stripe boundary for Gaabe Institute.
 *
 * It accepts authenticated checkout requests from the learner portal and only
 * accepts Stripe-signed, test-mode webhooks. Browser redirects never grant
 * access; the database ledger is updated by the webhook path only.
 */
export interface PaymentWorkerEnv {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ALLOWED_ORIGIN: string;
  CHECKOUT_SUCCESS_URL: string;
  CHECKOUT_CANCEL_URL: string;
  STRIPE_STANDARD_PRICE_ID: string;
  STRIPE_PREMIUM_PRICE_ID: string;
}

type PlanCode = 'standard' | 'premium';
type SubscriptionPayload = {
  id: string;
  customer: string;
  metadata?: Record<string, string>;
  status: string;
  current_period_end?: number;
  items?: { data?: Array<{ price?: { id?: string } }> };
};

const MAX_BODY_BYTES = 1_048_576;
const EVENT_TYPES = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'charge.refunded',
]);
const ACTIVE_SUBSCRIPTION_STATES = new Set(['active', 'trialing', 'past_due', 'incomplete']);
const SUBSCRIPTION_STATES = new Set(['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused']);
const headers = {
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};

function json(body: unknown, status = 200, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8', ...extra } });
}

function cors(request: Request, env: PaymentWorkerEnv) {
  const origin = request.headers.get('origin');
  if (!origin) return {} as Record<string, string>;
  return origin === env.ALLOWED_ORIGIN ? { 'access-control-allow-origin': origin, vary: 'origin' } as Record<string, string> : null;
}

function authHeader(request: Request) {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') && value.length > 7 ? value : null;
}

async function boundedText(request: Request) {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new RangeError('too_large');
  if (!request.body) throw new SyntaxError('missing_body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new RangeError('too_large'); }
    chunks.push(next.value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(output);
}

async function timingSafeHmacMatches(secret: string, timestamp: string, body: string, signature: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`)));
  const supplied = Uint8Array.from(signature.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
  if (expected.length !== supplied.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index]! ^ supplied[index]!;
  return difference === 0;
}

function parseStripeSignature(value: string) {
  const parts = value.split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([name]) => name === 't')?.[1];
  const signatures = parts.filter(([name]) => name === 'v1').map(([, signature]) => signature).filter((signature): signature is string => Boolean(signature));
  return { timestamp, signatures };
}

async function verifiedProfile(fetcher: typeof fetch, env: PaymentWorkerEnv, authorization: string) {
  const response = await fetcher(`${env.SUPABASE_URL}/rest/v1/profiles?select=firebase_uid`, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization } });
  if (!response.ok) return null;
  const rows = await response.json() as Array<{ firebase_uid?: string }>;
  return typeof rows[0]?.firebase_uid === 'string' ? rows[0].firebase_uid : null;
}

async function serviceRequest(fetcher: typeof fetch, env: PaymentWorkerEnv, path: string, init: RequestInit = {}) {
  return fetcher(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, ...(init.headers ?? {}) },
  });
}

function planPrice(env: PaymentWorkerEnv, code: unknown) {
  if (code === 'standard') return { code, priceId: env.STRIPE_STANDARD_PRICE_ID };
  if (code === 'premium') return { code, priceId: env.STRIPE_PREMIUM_PRICE_ID };
  return null;
}

function validIdempotencyKey(value: string | null) {
  return Boolean(value && /^[A-Za-z0-9._:-]{16,200}$/.test(value));
}

async function createCheckout(fetcher: typeof fetch, env: PaymentWorkerEnv, request: Request, authorization: string, requestCors: HeadersInit) {
  let body: { plan?: unknown };
  try { body = JSON.parse(await boundedText(request)) as { plan?: unknown }; } catch (error) { return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_json' }, error instanceof RangeError ? 413 : 400, requestCors); }
  const plan = planPrice(env, body.plan);
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!plan || !validIdempotencyKey(idempotencyKey)) return json({ error: 'invalid_checkout_request' }, 400, requestCors);
  const learnerUid = await verifiedProfile(fetcher, env, authorization);
  if (!learnerUid) return json({ error: 'unauthorized' }, 401, requestCors);

  const existing = await serviceRequest(fetcher, env, `gaabe_stripe_test_subscriptions?learner_uid=eq.${encodeURIComponent(learnerUid)}&status=in.(${[...ACTIVE_SUBSCRIPTION_STATES].join(',')})&select=stripe_subscription_id&limit=1`);
  if (!existing.ok) return json({ error: 'subscription_lookup_failed' }, 503, requestCors);
  const rows = await existing.json() as unknown[];
  if (rows.length) return json({ error: 'subscription_already_active' }, 409, requestCors);

  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('line_items[0][price]', plan.priceId);
  form.set('line_items[0][quantity]', '1');
  form.set('success_url', env.CHECKOUT_SUCCESS_URL);
  form.set('cancel_url', env.CHECKOUT_CANCEL_URL);
  form.set('client_reference_id', learnerUid);
  form.set('metadata[plan_code]', plan.code);
  form.set('subscription_data[metadata][learner_uid]', learnerUid);
  form.set('subscription_data[metadata][plan_code]', plan.code);
  const response = await fetcher('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded', 'idempotency-key': idempotencyKey! },
    body: form,
  });
  if (!response.ok) { console.error(JSON.stringify({ event: 'stripe_checkout_error', status: response.status })); return json({ error: 'checkout_unavailable' }, 502, requestCors); }
  const session = await response.json() as { id?: string; url?: string; livemode?: boolean };
  if (!session.id || !session.url || session.livemode !== false) return json({ error: 'checkout_unavailable' }, 502, requestCors);
  return json({ checkoutUrl: session.url }, 201, requestCors);
}

async function fetchSubscription(fetcher: typeof fetch, env: PaymentWorkerEnv, subscriptionId: string): Promise<SubscriptionPayload | null> {
  const response = await fetcher(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, { headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
  if (!response.ok) return null;
  return response.json() as Promise<SubscriptionPayload>;
}

async function processWebhook(fetcher: typeof fetch, env: PaymentWorkerEnv, request: Request) {
  const signature = parseStripeSignature(request.headers.get('stripe-signature') ?? '');
  if (!signature.timestamp || !/^\d+$/.test(signature.timestamp) || Math.abs((Date.now() / 1000) - Number(signature.timestamp)) > 300) return json({ error: 'invalid_signature' }, 400);
  let raw: string;
  try { raw = await boundedText(request); } catch (error) { return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_body' }, error instanceof RangeError ? 413 : 400); }
  if (!env.STRIPE_WEBHOOK_SECRET || !await Promise.any(signature.signatures.map((item) => timingSafeHmacMatches(env.STRIPE_WEBHOOK_SECRET, signature.timestamp!, raw, item))).catch(() => false)) return json({ error: 'invalid_signature' }, 400);
  let event: { id?: unknown; type?: unknown; livemode?: unknown; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(raw) as typeof event; } catch { return json({ error: 'invalid_json' }, 400); }
  if (event.livemode !== false || typeof event.id !== 'string' || !event.id.startsWith('evt_') || typeof event.type !== 'string' || !EVENT_TYPES.has(event.type)) return json({ error: 'invalid_test_event' }, 400);

  let subscription: SubscriptionPayload | null = null;
  const object = event.data?.object ?? {};
  const subscriptionId = typeof object.subscription === 'string' ? object.subscription : typeof object.id === 'string' && object.id.startsWith('sub_') ? object.id : null;
  if (subscriptionId && event.type !== 'checkout.session.async_payment_failed' && event.type !== 'charge.refunded') subscription = await fetchSubscription(fetcher, env, subscriptionId);
  if (subscriptionId && !subscription && event.type !== 'charge.refunded') return json({ error: 'subscription_lookup_failed' }, 503);

  const learnerUid = subscription?.metadata?.learner_uid ?? (typeof object.client_reference_id === 'string' ? object.client_reference_id : null);
  const priceId = subscription?.items?.data?.[0]?.price?.id ?? null;
  const status = subscription?.status ?? (event.type === 'checkout.session.async_payment_failed' ? 'incomplete_expired' : null);
  const accessUntil = subscription?.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
  if (subscription && (!learnerUid || !priceId || !status || !SUBSCRIPTION_STATES.has(status))) return json({ error: 'invalid_subscription' }, 400);
  const persisted = await serviceRequest(fetcher, env, 'rpc/process_gaabe_stripe_test_event', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      p_stripe_event_id: event.id, p_event_type: event.type, p_subscription_id: subscription?.id ?? subscriptionId,
      p_stripe_customer_id: subscription?.customer ?? null, p_learner_uid: learnerUid, p_stripe_price_id: priceId,
      p_status: status, p_access_until: accessUntil,
    }),
  });
  if (!persisted.ok) { console.error(JSON.stringify({ event: 'payment_persist_error', status: persisted.status, type: event.type })); return json({ error: 'persistence_failed' }, 503); }
  const [processed] = await persisted.json() as boolean[];
  return json({ received: true, duplicate: processed === false }, 200);
}

export function createPaymentWorker(fetcher: typeof fetch = fetch) {
  return {
    async fetch(request: Request, env: PaymentWorkerEnv): Promise<Response> {
      const url = new URL(request.url);
      const ready = Boolean(env.STRIPE_SECRET_KEY?.startsWith('rk_test_') && env.STRIPE_WEBHOOK_SECRET && env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
      if (url.pathname === '/health') return json({ service: 'gaabe-payments', mode: 'test', ready });
      if (!ready) return json({ error: 'not_configured' }, 503);
      if (url.pathname === '/webhook/stripe') return request.method === 'POST' ? processWebhook(fetcher, env, request) : json({ error: 'method_not_allowed' }, 405);
      const requestCors = cors(request, env);
      if (requestCors === null) return json({ error: 'origin_not_allowed' }, 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...requestCors, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-max-age': '600' } });
      if (url.pathname === '/v1/checkout' && request.method === 'POST') {
        const authorization = authHeader(request);
        return authorization ? createCheckout(fetcher, env, request, authorization, requestCors) : json({ error: 'unauthorized' }, 401, requestCors);
      }
      return json({ error: 'not_found' }, 404, requestCors);
    },
  };
}

export default createPaymentWorker();

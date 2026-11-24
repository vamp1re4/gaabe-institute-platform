-- Stripe test-mode payment ledger. These records are deliberately isolated from
-- public.entitlements so test Checkout can never unlock production access.

create table if not exists public.gaabe_stripe_test_events (
  stripe_event_id text primary key check (stripe_event_id ~ '^evt_'),
  event_type text not null check (event_type in (
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'charge.refunded'
  )),
  livemode boolean not null default false check (livemode = false),
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.gaabe_stripe_test_subscriptions (
  stripe_subscription_id text primary key check (stripe_subscription_id ~ '^sub_'),
  stripe_customer_id text not null check (stripe_customer_id ~ '^cus_'),
  learner_uid text not null references public.profiles(firebase_uid) on delete restrict,
  stripe_price_id text not null check (stripe_price_id in ('price_1Uem1rDmD2Dp4ykk7WY4HqBt', 'price_1Uem1tDmD2Dp4ykkOLudPuKZ')),
  status text not null check (status in ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  access_until timestamptz,
  updated_at timestamptz not null default now(),
  livemode boolean not null default false check (livemode = false)
);

alter table public.gaabe_stripe_test_events enable row level security;
alter table public.gaabe_stripe_test_subscriptions enable row level security;
revoke all on table public.gaabe_stripe_test_events from anon, authenticated;
revoke all on table public.gaabe_stripe_test_subscriptions from anon, authenticated;
drop policy if exists "Deny browser access to Stripe test events" on public.gaabe_stripe_test_events;
create policy "Deny browser access to Stripe test events" on public.gaabe_stripe_test_events
  as restrictive for all to anon, authenticated using (false) with check (false);
drop policy if exists "Deny browser access to Stripe test subscriptions" on public.gaabe_stripe_test_subscriptions;
create policy "Deny browser access to Stripe test subscriptions" on public.gaabe_stripe_test_subscriptions
  as restrictive for all to anon, authenticated using (false) with check (false);
grant select, insert, update on table public.gaabe_stripe_test_events to service_role;
grant select, insert, update on table public.gaabe_stripe_test_subscriptions to service_role;

insert into public.plans (code, name, active, stripe_price_id)
values
  ('standard', 'Gaabe Institute Standard (test)', true, 'price_1Uem1rDmD2Dp4ykk7WY4HqBt'),
  ('premium', 'Gaabe Institute Premium (test)', true, 'price_1Uem1tDmD2Dp4ykkOLudPuKZ')
on conflict (code) do update set
  name = excluded.name,
  active = excluded.active,
  stripe_price_id = excluded.stripe_price_id;

-- Atomic, idempotent ledger mutation. It is callable only by the server-side
-- service role; browser identities cannot invoke it through the Data API.
create or replace function public.process_gaabe_stripe_test_event(
  p_stripe_event_id text,
  p_event_type text,
  p_subscription_id text default null,
  p_stripe_customer_id text default null,
  p_learner_uid text default null,
  p_stripe_price_id text default null,
  p_status text default null,
  p_access_until timestamptz default null
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_stripe_event_id !~ '^evt_' then
    raise exception 'invalid Stripe event identifier';
  end if;

  insert into public.gaabe_stripe_test_events (stripe_event_id, event_type, livemode)
  values (p_stripe_event_id, p_event_type, false)
  on conflict (stripe_event_id) do nothing;
  if not found then
    return false;
  end if;

  if p_subscription_id is not null then
    if p_stripe_customer_id is null or p_learner_uid is null or p_stripe_price_id is null or p_status is null then
      raise exception 'incomplete subscription payload';
    end if;
    insert into public.gaabe_stripe_test_subscriptions (
      stripe_subscription_id, stripe_customer_id, learner_uid, stripe_price_id, status, access_until, livemode
    ) values (
      p_subscription_id, p_stripe_customer_id, p_learner_uid, p_stripe_price_id, p_status, p_access_until, false
    ) on conflict (stripe_subscription_id) do update set
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_price_id = excluded.stripe_price_id,
      status = excluded.status,
      access_until = excluded.access_until,
      updated_at = now();
  end if;

  update public.gaabe_stripe_test_events set processed_at = now() where stripe_event_id = p_stripe_event_id;
  return true;
end;
$$;

revoke all on function public.process_gaabe_stripe_test_event(text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.process_gaabe_stripe_test_event(text, text, text, text, text, text, text, timestamptz) to service_role;

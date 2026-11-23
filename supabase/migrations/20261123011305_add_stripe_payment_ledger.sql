create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  learner_uid text not null references public.profiles(firebase_uid) on delete restrict,
  plan_id uuid references public.plans(id) on delete restrict,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  amount_minor bigint check (amount_minor is null or amount_minor >= 0),
  currency text check (currency is null or currency ~ '^[a-z]{3}$'),
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

create trigger payment_transactions_set_updated_at before update on public.payment_transactions for each row execute function public.set_updated_at();
create index payment_transactions_learner_uid_idx on public.payment_transactions (learner_uid, created_at desc);

alter table public.payment_transactions enable row level security;
alter table public.stripe_webhook_events enable row level security;
create policy "Firebase identities are limited to Gaabe" on public.payment_transactions as restrictive to anon, authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.stripe_webhook_events as restrictive to anon, authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Learners read their own payment history" on public.payment_transactions for select to anon, authenticated using (learner_uid = public.current_firebase_uid());
grant select on public.payment_transactions to anon, authenticated;

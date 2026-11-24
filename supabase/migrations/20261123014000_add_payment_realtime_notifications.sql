-- Keep payment ledger rows server-only. Learners receive a minimal status event
-- through their existing, RLS-protected notifications feed instead.

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

    insert into public.notifications (recipient_uid, kind, payload)
    values (p_learner_uid, 'test_subscription_updated', jsonb_build_object('status', p_status, 'event_type', p_event_type));
  end if;

  update public.gaabe_stripe_test_events set processed_at = now() where stripe_event_id = p_stripe_event_id;
  return true;
end;
$$;

revoke all on function public.process_gaabe_stripe_test_event(text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.process_gaabe_stripe_test_event(text, text, text, text, text, text, text, timestamptz) to service_role;

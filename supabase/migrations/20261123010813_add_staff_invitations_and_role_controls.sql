create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 320),
  role text not null check (role in ('admin', 'teacher')),
  invited_by_uid text not null references public.profiles(firebase_uid) on delete restrict,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index organization_invitations_email_idx on public.organization_invitations (lower(email));

create function private.is_owner_for_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and firebase_uid = public.current_firebase_uid()
      and role = 'owner'
  )
$$;

revoke execute on function private.is_owner_for_organization(uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_owner_for_organization(uuid) to anon, authenticated;

create function public.accept_staff_invitations()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.email is null then return new; end if;
  insert into public.organization_members (organization_id, firebase_uid, role)
  select organization_id, new.firebase_uid, role
  from public.organization_invitations
  where lower(email) = lower(new.email) and expires_at > now()
  on conflict (organization_id, firebase_uid) do nothing;
  delete from public.organization_invitations
  where lower(email) = lower(new.email) and expires_at > now();
  return new;
end;
$$;

revoke execute on function public.accept_staff_invitations() from public;
create trigger profiles_accept_staff_invitations
  after insert or update of email on public.profiles
  for each row execute function public.accept_staff_invitations();

alter table public.organization_invitations enable row level security;
create policy "Firebase identities are limited to Gaabe" on public.organization_invitations as restrictive to anon, authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Owners can read their invitations" on public.organization_invitations for select to anon, authenticated using (private.is_owner_for_organization(organization_id));
create policy "Owners can invite staff" on public.organization_invitations for insert to anon, authenticated with check (
  private.is_owner_for_organization(organization_id)
  and invited_by_uid = public.current_firebase_uid()
  and lower(email) = email
  and expires_at > now() and expires_at <= now() + interval '30 days'
);
create policy "Owners can revoke invitations" on public.organization_invitations for delete to anon, authenticated using (private.is_owner_for_organization(organization_id));
grant select, insert, delete on public.organization_invitations to anon, authenticated;

create policy "Owners can read organization staff" on public.organization_members for select to anon, authenticated using (private.is_owner_for_organization(organization_id));

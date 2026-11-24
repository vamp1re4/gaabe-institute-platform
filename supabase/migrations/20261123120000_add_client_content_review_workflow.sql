-- Client-authored course content remains draft-only until an organization owner
-- explicitly approves it. The same workflow covers the public teacher profile
-- and simple in-platform presentations.

create table public.organization_public_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  teacher_name text not null default '' check (char_length(teacher_name) <= 160),
  teacher_bio text not null default '' check (char_length(teacher_bio) <= 4000),
  contact_email text check (contact_email is null or char_length(contact_email) <= 320),
  updated_by_uid text references public.profiles(firebase_uid) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.course_review_requests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null unique references public.courses(id) on delete cascade,
  submitted_by_uid text not null references public.profiles(firebase_uid) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'changes_requested')),
  review_note text not null default '' check (char_length(review_note) <= 4000),
  reviewed_by_uid text references public.profiles(firebase_uid) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.presentations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  slides jsonb not null default '[]'::jsonb check (jsonb_typeof(slides) = 'array'),
  published boolean not null default false,
  created_by_uid text not null references public.profiles(firebase_uid) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index course_review_requests_status_idx on public.course_review_requests (status, submitted_at desc);
create index presentations_course_id_idx on public.presentations (course_id, created_at);

create trigger organization_public_profiles_set_updated_at before update on public.organization_public_profiles for each row execute function public.set_updated_at();
create trigger presentations_set_updated_at before update on public.presentations for each row execute function public.set_updated_at();

-- Teachers may author content but only an owner can change a course's public
-- state. This prevents a browser client from bypassing the review flow.
create function private.prevent_unapproved_course_publish()
returns trigger language plpgsql security definer set search_path = public, private
as $$
begin
  if new.status is distinct from old.status
     and not private.is_owner_for_organization(old.organization_id) then
    raise exception 'Only an organization owner can change a course publication state';
  end if;
  return new;
end;
$$;

revoke execute on function private.prevent_unapproved_course_publish() from public;
create trigger courses_require_owner_for_status_change
  before update of status on public.courses
  for each row execute function private.prevent_unapproved_course_publish();

create function public.approve_course_review(p_course_id uuid, p_review_note text default '')
returns void language plpgsql security invoker set search_path = public, private
as $$
begin
  if not private.is_owner_for_organization((select organization_id from public.courses where id = p_course_id)) then
    raise exception 'Only an organization owner can approve course content';
  end if;
  update public.course_review_requests
  set status = 'approved', review_note = left(coalesce(p_review_note, ''), 4000), reviewed_by_uid = public.current_firebase_uid(), reviewed_at = now()
  where course_id = p_course_id and status = 'pending';
  if not found then raise exception 'No pending review request exists for this course'; end if;
  update public.courses set status = 'published', published_at = now() where id = p_course_id;
end;
$$;
revoke execute on function public.approve_course_review(uuid, text) from public;
grant execute on function public.approve_course_review(uuid, text) to anon, authenticated;

alter table public.organization_public_profiles enable row level security;
alter table public.course_review_requests enable row level security;
alter table public.presentations enable row level security;

create policy "Firebase identities are limited to Gaabe" on public.organization_public_profiles as restrictive to anon, authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.course_review_requests as restrictive to anon, authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.presentations as restrictive to anon, authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));

create policy "Staff manage organization public profile" on public.organization_public_profiles for all to anon, authenticated using (private.is_staff_for_organization(organization_id)) with check (private.is_staff_for_organization(organization_id) and updated_by_uid = public.current_firebase_uid());
create policy "Staff read their organization review requests" on public.course_review_requests for select to anon, authenticated using (exists (select 1 from public.courses c where c.id = course_id and private.is_staff_for_organization(c.organization_id)));
create policy "Staff submit course review requests" on public.course_review_requests for insert to anon, authenticated with check (submitted_by_uid = public.current_firebase_uid() and exists (select 1 from public.courses c where c.id = course_id and private.is_staff_for_organization(c.organization_id) and c.status = 'draft'));
create policy "Owners review course requests" on public.course_review_requests for update to anon, authenticated using (exists (select 1 from public.courses c where c.id = course_id and private.is_owner_for_organization(c.organization_id))) with check (reviewed_by_uid = public.current_firebase_uid());
create policy "Staff manage presentations" on public.presentations for all to anon, authenticated using (private.is_staff_for_course(course_id)) with check (private.is_staff_for_course(course_id) and created_by_uid = public.current_firebase_uid());
create policy "Published course presentations are readable" on public.presentations for select to anon, authenticated using (published and public.is_course_visible(course_id));

grant select, insert, update on public.organization_public_profiles, public.course_review_requests, public.presentations to anon, authenticated;

alter publication supabase_realtime add table public.courses, public.course_review_requests, public.presentations;

-- Gaabe Institute production foundation.
-- Identity is supplied by Firebase Auth. Firebase UIDs are text (not UUIDs), so
-- access policies must use auth.jwt()->>'sub' rather than auth.uid().

create type public.course_status as enum ('draft', 'published', 'archived');
create type public.enrollment_status as enum ('active', 'paused', 'completed', 'cancelled');
create type public.asset_visibility as enum ('private', 'course', 'public');
create type public.notification_status as enum ('unread', 'read');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  firebase_uid text primary key check (char_length(firebase_uid) between 1 and 128),
  email text unique check (email is null or char_length(email) <= 320),
  display_name text check (display_name is null or char_length(display_name) <= 160),
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'dv')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  firebase_uid text not null references public.profiles(firebase_uid) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'teacher', 'guardian', 'student')),
  created_at timestamptz not null default now(),
  primary key (organization_id, firebase_uid)
);

create table public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  learner_uid text not null references public.profiles(firebase_uid) on delete cascade,
  guardian_uid text not null references public.profiles(firebase_uid) on delete cascade,
  consent_type text not null check (consent_type in ('account', 'learning_data', 'communications')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  evidence_reference text check (evidence_reference is null or char_length(evidence_reference) <= 512),
  unique (learner_uid, guardian_uid, consent_type)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.course_status not null default 'draft',
  title text not null check (char_length(title) between 1 and 240),
  summary text not null default '' check (char_length(summary) <= 4000),
  cover_asset_id uuid,
  created_by_uid text not null references public.profiles(firebase_uid) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.course_translations (
  course_id uuid not null references public.courses(id) on delete cascade,
  locale text not null check (locale in ('en', 'dv')),
  title text not null check (char_length(title) between 1 and 240),
  summary text not null default '' check (char_length(summary) <= 4000),
  primary key (course_id, locale)
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (char_length(title) between 1 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.module_translations (
  module_id uuid not null references public.course_modules(id) on delete cascade,
  locale text not null check (locale in ('en', 'dv')),
  title text not null check (char_length(title) between 1 and 240),
  primary key (module_id, locale)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (char_length(title) between 1 and 240),
  body jsonb not null default '{}'::jsonb check (jsonb_typeof(body) = 'object'),
  duration_minutes smallint check (duration_minutes is null or duration_minutes between 1 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, position)
);

create table public.lesson_translations (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  locale text not null check (locale in ('en', 'dv')),
  title text not null check (char_length(title) between 1 and 240),
  body jsonb not null default '{}'::jsonb check (jsonb_typeof(body) = 'object'),
  primary key (lesson_id, locale)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  learner_uid text not null references public.profiles(firebase_uid) on delete cascade,
  status public.enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (course_id, learner_uid)
);

create table public.lesson_progress (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  learner_uid text not null references public.profiles(firebase_uid) on delete cascade,
  completed_at timestamptz,
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (lesson_id, learner_uid)
);

create table public.worksheets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.worksheet_questions (
  id uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  position integer not null check (position > 0),
  prompt jsonb not null check (jsonb_typeof(prompt) = 'object'),
  question_type text not null check (question_type in ('multiple_choice', 'short_answer', 'ordering')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object'),
  unique (worksheet_id, position)
);

create table public.worksheet_attempts (
  id uuid primary key default gen_random_uuid(),
  worksheet_id uuid not null references public.worksheets(id) on delete cascade,
  learner_uid text not null references public.profiles(firebase_uid) on delete cascade,
  submitted_at timestamptz,
  score numeric(5,2) check (score is null or score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.worksheet_responses (
  attempt_id uuid not null references public.worksheet_attempts(id) on delete cascade,
  question_id uuid not null references public.worksheet_questions(id) on delete cascade,
  response jsonb not null default '{}'::jsonb,
  is_correct boolean,
  primary key (attempt_id, question_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  active boolean not null default true,
  stripe_price_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  learner_uid text not null references public.profiles(firebase_uid) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete restrict,
  source text not null check (source in ('manual', 'stripe', 'scholarship')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (course_id is not null or plan_id is not null)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  owner_uid text not null references public.profiles(firebase_uid) on delete restrict,
  r2_key text not null unique check (r2_key !~ '^/' and char_length(r2_key) between 1 and 1024),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  content_type text not null check (char_length(content_type) between 1 and 255),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 1073741824),
  sha256 text check (sha256 is null or sha256 ~ '^[A-Fa-f0-9]{64}$'),
  visibility public.asset_visibility not null default 'private',
  created_at timestamptz not null default now()
);

alter table public.courses add constraint courses_cover_asset_id_fkey foreign key (cover_asset_id) references public.assets(id) on delete set null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_uid text not null references public.profiles(firebase_uid) on delete cascade,
  kind text not null check (char_length(kind) between 1 and 80),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status public.notification_status not null default 'unread',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_uid text references public.profiles(firebase_uid) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 128),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

create index enrollments_learner_uid_idx on public.enrollments (learner_uid);
create index lesson_progress_learner_uid_idx on public.lesson_progress (learner_uid);
create index worksheet_attempts_learner_uid_idx on public.worksheet_attempts (learner_uid);
create index notifications_recipient_unread_idx on public.notifications (recipient_uid, status, created_at desc);
create index assets_owner_uid_idx on public.assets (owner_uid);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.current_firebase_uid()
returns text
language sql
stable
set search_path = ''
as $$ select auth.jwt() ->> 'sub' $$;

create function public.is_gaabe_firebase_jwt()
returns boolean
language sql
stable
set search_path = ''
as $$
  select (auth.jwt() ->> 'iss') = 'https://securetoken.google.com/gaabe-institute-auth'
     and (auth.jwt() ->> 'aud') = 'gaabe-institute-auth'
$$;

create function public.is_course_visible(target_course_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    where c.id = target_course_id and c.status = 'published'
  ) or exists (
    select 1 from public.enrollments e
    where e.course_id = target_course_id
      and e.learner_uid = public.current_firebase_uid()
      and e.status in ('active', 'completed')
  )
$$;

create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger course_modules_set_updated_at before update on public.course_modules for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger lesson_progress_set_updated_at before update on public.lesson_progress for each row execute function public.set_updated_at();
create trigger worksheets_set_updated_at before update on public.worksheets for each row execute function public.set_updated_at();
create trigger worksheet_attempts_set_updated_at before update on public.worksheet_attempts for each row execute function public.set_updated_at();
create trigger plans_set_updated_at before update on public.plans for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.guardian_consents enable row level security;
alter table public.courses enable row level security;
alter table public.course_translations enable row level security;
alter table public.course_modules enable row level security;
alter table public.module_translations enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_translations enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.worksheets enable row level security;
alter table public.worksheet_questions enable row level security;
alter table public.worksheet_attempts enable row level security;
alter table public.worksheet_responses enable row level security;
alter table public.plans enable row level security;
alter table public.entitlements enable row level security;
alter table public.assets enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_events enable row level security;

-- Firebase tokens are accepted only when issued for the dedicated Gaabe project.
create policy "Firebase identities are limited to Gaabe" on public.organizations as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.profiles as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.organization_members as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.guardian_consents as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.courses as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.course_translations as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.course_modules as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.module_translations as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.lessons as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.lesson_translations as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.enrollments as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.lesson_progress as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.worksheets as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.worksheet_questions as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.worksheet_attempts as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.worksheet_responses as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.plans as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.entitlements as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.assets as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.notifications as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt())) with check ((select public.is_gaabe_firebase_jwt()));
create policy "Firebase identities are limited to Gaabe" on public.audit_events as restrictive to authenticated using ((select public.is_gaabe_firebase_jwt()));

create policy "Published or enrolled courses are readable" on public.courses for select to anon, authenticated using (
  status = 'published'
  or exists (
    select 1 from public.enrollments e
    where e.course_id = id
      and e.learner_uid = public.current_firebase_uid()
      and e.status in ('active', 'completed')
  )
);
create policy "Published course translations are readable" on public.course_translations for select to anon, authenticated using ((select public.is_course_visible(course_id)));
create policy "Visible course modules are readable" on public.course_modules for select to anon, authenticated using ((select public.is_course_visible(course_id)));
create policy "Visible module translations are readable" on public.module_translations for select to anon, authenticated using (exists (select 1 from public.course_modules m where m.id = module_id and public.is_course_visible(m.course_id)));
create policy "Visible lessons are readable" on public.lessons for select to anon, authenticated using (exists (select 1 from public.course_modules m where m.id = module_id and public.is_course_visible(m.course_id)));
create policy "Visible lesson translations are readable" on public.lesson_translations for select to anon, authenticated using (exists (select 1 from public.lessons l join public.course_modules m on m.id = l.module_id where l.id = lesson_id and public.is_course_visible(m.course_id)));
create policy "Visible worksheets are readable" on public.worksheets for select to authenticated using (published and exists (select 1 from public.lessons l join public.course_modules m on m.id = l.module_id where l.id = lesson_id and public.is_course_visible(m.course_id)));
create policy "Visible worksheet questions are readable" on public.worksheet_questions for select to authenticated using (exists (select 1 from public.worksheets w where w.id = worksheet_id and w.published));
create policy "Active plans are readable" on public.plans for select to authenticated using (active);
create policy "Public assets are readable" on public.assets for select to anon, authenticated using (visibility = 'public' or owner_uid = public.current_firebase_uid());

create policy "Users read their own profile" on public.profiles for select to authenticated using (firebase_uid = public.current_firebase_uid());
create policy "Users create their own profile" on public.profiles for insert to authenticated with check (firebase_uid = public.current_firebase_uid());
create policy "Users update their own profile" on public.profiles for update to authenticated using (firebase_uid = public.current_firebase_uid()) with check (firebase_uid = public.current_firebase_uid());
create policy "Users read their own membership" on public.organization_members for select to authenticated using (firebase_uid = public.current_firebase_uid());
create policy "Guardians read their consents" on public.guardian_consents for select to authenticated using (guardian_uid = public.current_firebase_uid() or learner_uid = public.current_firebase_uid());
create policy "Users read their own enrollments" on public.enrollments for select to authenticated using (learner_uid = public.current_firebase_uid());
create policy "Users read their own progress" on public.lesson_progress for select to authenticated using (learner_uid = public.current_firebase_uid());
create policy "Users create progress in visible courses" on public.lesson_progress for insert to authenticated with check (
  learner_uid = public.current_firebase_uid()
  and exists (select 1 from public.lessons l join public.course_modules m on m.id = l.module_id where l.id = lesson_id and public.is_course_visible(m.course_id))
);
create policy "Users update progress in visible courses" on public.lesson_progress for update to authenticated using (learner_uid = public.current_firebase_uid()) with check (
  learner_uid = public.current_firebase_uid()
  and exists (select 1 from public.lessons l join public.course_modules m on m.id = l.module_id where l.id = lesson_id and public.is_course_visible(m.course_id))
);
create policy "Users read their own attempts" on public.worksheet_attempts for select to authenticated using (learner_uid = public.current_firebase_uid());
create policy "Users create attempts in visible worksheets" on public.worksheet_attempts for insert to authenticated with check (
  learner_uid = public.current_firebase_uid()
  and exists (
    select 1 from public.worksheets w join public.lessons l on l.id = w.lesson_id join public.course_modules m on m.id = l.module_id
    where w.id = worksheet_id and w.published and public.is_course_visible(m.course_id)
  )
);
create policy "Users update their own unsubmitted attempts" on public.worksheet_attempts for update to authenticated using (learner_uid = public.current_firebase_uid() and submitted_at is null) with check (learner_uid = public.current_firebase_uid());
create policy "Users read responses for own attempts" on public.worksheet_responses for select to authenticated using (exists (select 1 from public.worksheet_attempts a where a.id = attempt_id and a.learner_uid = public.current_firebase_uid()));
create policy "Users write valid responses for own unsubmitted attempts" on public.worksheet_responses for insert to authenticated with check (
  exists (
    select 1 from public.worksheet_attempts a join public.worksheet_questions q on q.worksheet_id = a.worksheet_id
    where a.id = attempt_id and q.id = question_id and a.learner_uid = public.current_firebase_uid() and a.submitted_at is null
  )
);
create policy "Users update valid responses for own unsubmitted attempts" on public.worksheet_responses for update to authenticated using (
  exists (
    select 1 from public.worksheet_attempts a join public.worksheet_questions q on q.worksheet_id = a.worksheet_id
    where a.id = attempt_id and q.id = question_id and a.learner_uid = public.current_firebase_uid() and a.submitted_at is null
  )
) with check (
  exists (
    select 1 from public.worksheet_attempts a join public.worksheet_questions q on q.worksheet_id = a.worksheet_id
    where a.id = attempt_id and q.id = question_id and a.learner_uid = public.current_firebase_uid() and a.submitted_at is null
  )
);
create policy "Users read their own entitlements" on public.entitlements for select to authenticated using (learner_uid = public.current_firebase_uid());
create policy "Users read their own notifications" on public.notifications for select to authenticated using (recipient_uid = public.current_firebase_uid());
create policy "Users mark their own notifications read" on public.notifications for update to authenticated using (recipient_uid = public.current_firebase_uid()) with check (recipient_uid = public.current_firebase_uid() and status in ('unread', 'read'));

grant usage on schema public to anon, authenticated;
grant select on public.courses, public.course_translations, public.course_modules, public.module_translations, public.lessons, public.lesson_translations, public.assets to anon, authenticated;
grant select on public.profiles, public.organization_members, public.guardian_consents, public.enrollments, public.lesson_progress, public.worksheets, public.worksheet_questions, public.worksheet_attempts, public.worksheet_responses, public.plans, public.entitlements, public.notifications to authenticated;
grant insert, update (display_name, preferred_locale) on public.profiles to authenticated;
grant insert, update on public.lesson_progress, public.worksheet_attempts, public.worksheet_responses to authenticated;
grant update (status, read_at) on public.notifications to authenticated;

-- Firebase tokens without a custom role claim run as Supabase's anon role.
-- These grants are safe because every affected table has a restrictive policy
-- which accepts only tokens issued for the dedicated Firebase project.
grant select on public.profiles, public.organization_members, public.guardian_consents, public.enrollments, public.lesson_progress, public.worksheets, public.worksheet_questions, public.worksheet_attempts, public.worksheet_responses, public.plans, public.entitlements, public.notifications to anon;
grant insert, update (display_name, preferred_locale) on public.profiles to anon;
grant insert, update on public.lesson_progress, public.worksheet_attempts, public.worksheet_responses to anon;
grant update (status, read_at) on public.notifications to anon;

do $$
declare
  policy_record record;
begin
  -- Promote policies intended for signed-in application users to both roles.
  -- The restrictive Firebase issuer/audience policy still denies unauthenticated
  -- requests and Firebase tokens from any other project.
  for policy_record in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and roles = array['authenticated']::name[]
  loop
    execute format('alter policy %I on public.%I to anon, authenticated', policy_record.policyname, policy_record.tablename);
  end loop;
end;
$$;

alter publication supabase_realtime add table public.enrollments, public.lesson_progress, public.worksheet_attempts, public.notifications;

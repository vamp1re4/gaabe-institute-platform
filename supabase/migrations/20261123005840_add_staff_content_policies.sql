create type public.course_access_tier as enum ('free', 'premium');
alter table public.courses add column access_tier public.course_access_tier not null default 'free';

-- These helpers are deliberately narrowly scoped SECURITY DEFINER functions.
-- They expose only a membership decision, keep their search path fixed, and are
-- callable only by database request roles used by this application.
create function public.is_staff_for_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and firebase_uid = public.current_firebase_uid()
      and role in ('owner', 'admin', 'teacher')
  )
$$;

create function public.is_staff_for_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_staff_for_organization(organization_id)
  from public.courses where id = target_course_id
$$;

create function public.is_staff_for_module(target_module_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_staff_for_course(course_id) from public.course_modules where id = target_module_id
$$;

create function public.is_staff_for_lesson(target_lesson_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_staff_for_module(module_id) from public.lessons where id = target_lesson_id
$$;

create function public.is_staff_for_worksheet(target_worksheet_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_staff_for_lesson(lesson_id) from public.worksheets where id = target_worksheet_id
$$;

revoke execute on function public.is_staff_for_organization(uuid), public.is_staff_for_course(uuid), public.is_staff_for_module(uuid), public.is_staff_for_lesson(uuid), public.is_staff_for_worksheet(uuid) from public;
grant execute on function public.is_staff_for_organization(uuid), public.is_staff_for_course(uuid), public.is_staff_for_module(uuid), public.is_staff_for_lesson(uuid), public.is_staff_for_worksheet(uuid) to anon, authenticated;

create policy "Staff can read their organization" on public.organizations for select to anon, authenticated using (public.is_staff_for_organization(id));
create policy "Staff can update their organization" on public.organizations for update to anon, authenticated using (public.is_staff_for_organization(id)) with check (public.is_staff_for_organization(id));
create policy "Staff can create courses" on public.courses for insert to anon, authenticated with check (public.is_staff_for_organization(organization_id));
create policy "Staff can update courses" on public.courses for update to anon, authenticated using (public.is_staff_for_course(id)) with check (public.is_staff_for_organization(organization_id));
create policy "Staff can delete courses" on public.courses for delete to anon, authenticated using (public.is_staff_for_course(id));
create policy "Staff can manage course translations" on public.course_translations for all to anon, authenticated using (public.is_staff_for_course(course_id)) with check (public.is_staff_for_course(course_id));
create policy "Staff can manage modules" on public.course_modules for all to anon, authenticated using (public.is_staff_for_course(course_id)) with check (public.is_staff_for_course(course_id));
create policy "Staff can manage module translations" on public.module_translations for all to anon, authenticated using (public.is_staff_for_module(module_id)) with check (public.is_staff_for_module(module_id));
create policy "Staff can manage lessons" on public.lessons for all to anon, authenticated using (public.is_staff_for_module(module_id)) with check (public.is_staff_for_module(module_id));
create policy "Staff can manage lesson translations" on public.lesson_translations for all to anon, authenticated using (public.is_staff_for_lesson(lesson_id)) with check (public.is_staff_for_lesson(lesson_id));
create policy "Staff can manage worksheets" on public.worksheets for all to anon, authenticated using (public.is_staff_for_lesson(lesson_id)) with check (public.is_staff_for_lesson(lesson_id));
create policy "Staff can manage worksheet questions" on public.worksheet_questions for all to anon, authenticated using (public.is_staff_for_worksheet(worksheet_id)) with check (public.is_staff_for_worksheet(worksheet_id));

grant select, insert, update, delete on public.organizations, public.courses, public.course_translations, public.course_modules, public.module_translations, public.lessons, public.lesson_translations, public.worksheets, public.worksheet_questions to anon, authenticated;

-- Repair the helper chain after it moved from public to private.  The
-- functions retained their object identity, but their SQL bodies still named
-- public.is_staff_for_* and therefore failed at runtime.  Also let staff read
-- drafts belonging to their own organization; the existing policy covered
-- create/update/delete but not SELECT.

create or replace function private.is_staff_for_organization(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.firebase_uid = public.current_firebase_uid()
      and membership.role in ('owner', 'admin', 'teacher')
  )
$$;

create or replace function private.is_staff_for_course(target_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_staff_for_organization(course.organization_id)
  from public.courses course where course.id = target_course_id
$$;

create or replace function private.is_staff_for_module(target_module_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_staff_for_course(module.course_id)
  from public.course_modules module where module.id = target_module_id
$$;

create or replace function private.is_staff_for_lesson(target_lesson_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_staff_for_module(lesson.module_id)
  from public.lessons lesson where lesson.id = target_lesson_id
$$;

create or replace function private.is_staff_for_worksheet(target_worksheet_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_staff_for_lesson(worksheet.lesson_id)
  from public.worksheets worksheet where worksheet.id = target_worksheet_id
$$;

revoke execute on function private.is_staff_for_organization(uuid), private.is_staff_for_course(uuid), private.is_staff_for_module(uuid), private.is_staff_for_lesson(uuid), private.is_staff_for_worksheet(uuid) from public;
grant execute on function private.is_staff_for_organization(uuid), private.is_staff_for_course(uuid), private.is_staff_for_module(uuid), private.is_staff_for_lesson(uuid), private.is_staff_for_worksheet(uuid) to anon, authenticated;

create policy "Staff can read their organization courses" on public.courses
  for select to anon, authenticated using (private.is_staff_for_course(id));

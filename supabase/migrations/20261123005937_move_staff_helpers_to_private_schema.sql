create schema if not exists private;
revoke all on schema private from public;

alter function public.is_staff_for_organization(uuid) set schema private;
alter function public.is_staff_for_course(uuid) set schema private;
alter function public.is_staff_for_module(uuid) set schema private;
alter function public.is_staff_for_lesson(uuid) set schema private;
alter function public.is_staff_for_worksheet(uuid) set schema private;

-- RLS expressions retain function OIDs after a schema move. The private schema
-- is not exposed by PostgREST, so these helpers cannot be invoked as RPCs.
grant usage on schema private to anon, authenticated;
grant execute on function private.is_staff_for_organization(uuid), private.is_staff_for_course(uuid), private.is_staff_for_module(uuid), private.is_staff_for_lesson(uuid), private.is_staff_for_worksheet(uuid) to anon, authenticated;

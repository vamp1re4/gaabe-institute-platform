revoke execute on function public.accept_staff_invitations() from public, anon, authenticated;
alter function public.accept_staff_invitations() set schema private;

create policy "Staff can read organization assets" on public.assets for select to anon, authenticated using (private.is_staff_for_organization(organization_id));
create policy "Staff can create organization assets" on public.assets for insert to anon, authenticated with check (
  owner_uid = public.current_firebase_uid()
  and private.is_staff_for_organization(organization_id)
);
create policy "Staff can delete organization assets" on public.assets for delete to anon, authenticated using (private.is_staff_for_organization(organization_id));
grant insert, delete on public.assets to anon, authenticated;

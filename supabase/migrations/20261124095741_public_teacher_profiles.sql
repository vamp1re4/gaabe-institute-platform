-- A teacher profile is public only when its organization has at least one
-- published course. Draft-only organizations, staff memberships, and all
-- authoring metadata remain inaccessible to anonymous readers.

drop policy "Firebase identities are limited to Gaabe" on public.organization_public_profiles;

create policy "Published organizations expose their teacher profile"
  on public.organization_public_profiles for select to anon, authenticated
  using (
    exists (
      select 1 from public.courses course
      where course.organization_id = organization_public_profiles.organization_id
        and course.status = 'published'
    )
  );

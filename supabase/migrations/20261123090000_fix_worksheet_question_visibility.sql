-- Fixes an authorization gap in "Visible worksheet questions are readable"
-- (20261123000842_initial_production_schema.sql). That policy checked only
-- worksheets.published, not whether the owning course is actually visible to
-- the requester (published, or the requester is enrolled). A worksheet can be
-- marked published while its course is still draft/archived or the requester
-- isn't enrolled in it, yet worksheet_questions.configuration can hold the
-- answer key. Any authenticated or valid-but-unclaimed Firebase account could
-- read it by worksheet_id, bypassing the course/lesson visibility chain that
-- every sibling policy ("Visible worksheets are readable", "Users create
-- attempts in visible worksheets") already enforces.
--
-- This migration only narrows access to match the intent already documented
-- for every other table; it does not add or change any schema, column, or
-- staff capability.

drop policy "Visible worksheet questions are readable" on public.worksheet_questions;

create policy "Visible worksheet questions are readable" on public.worksheet_questions
  for select to anon, authenticated using (
    exists (
      select 1
      from public.worksheets w
      join public.lessons l on l.id = w.lesson_id
      join public.course_modules m on m.id = l.module_id
      where w.id = worksheet_id
        and w.published
        and public.is_course_visible(m.course_id)
    )
  );

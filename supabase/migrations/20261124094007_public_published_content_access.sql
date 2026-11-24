-- Published learning content is intentionally public so families can browse the
-- catalogue before they create an account. Draft content remains protected by
-- the existing permissive policies (status = 'published' / is_course_visible).
-- Remove only the blanket Firebase-token gate from read-only public content;
-- staff write policies and all learner/private records keep that gate.

drop policy "Firebase identities are limited to Gaabe" on public.courses;
drop policy "Firebase identities are limited to Gaabe" on public.course_translations;
drop policy "Firebase identities are limited to Gaabe" on public.course_modules;
drop policy "Firebase identities are limited to Gaabe" on public.module_translations;
drop policy "Firebase identities are limited to Gaabe" on public.lessons;
drop policy "Firebase identities are limited to Gaabe" on public.lesson_translations;
drop policy "Firebase identities are limited to Gaabe" on public.presentations;

alter publication supabase_realtime add table public.course_modules, public.lessons;

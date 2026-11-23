-- Index every non-covered foreign key identified by the production advisor.
create index assets_organization_id_idx on public.assets (organization_id);
create index audit_events_actor_uid_idx on public.audit_events (actor_uid);
create index courses_cover_asset_id_idx on public.courses (cover_asset_id);
create index courses_created_by_uid_idx on public.courses (created_by_uid);
create index entitlements_course_id_idx on public.entitlements (course_id);
create index entitlements_learner_uid_idx on public.entitlements (learner_uid);
create index entitlements_plan_id_idx on public.entitlements (plan_id);
create index guardian_consents_guardian_uid_idx on public.guardian_consents (guardian_uid);
create index organization_members_firebase_uid_idx on public.organization_members (firebase_uid);
create index worksheet_attempts_worksheet_id_idx on public.worksheet_attempts (worksheet_id);
create index worksheet_responses_question_id_idx on public.worksheet_responses (question_id);

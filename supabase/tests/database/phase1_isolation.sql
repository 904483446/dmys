begin;

select plan(3);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@example.test', '', now(), '{"provider":"email"}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other@example.test', '', now(), '{"provider":"email"}', '{}', now(), now());

insert into public.projects (id, user_id, source_type, display_name) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'zip', 'owner project');
insert into public.verification_jobs (id, user_id, project_id, request_text) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'verify owner project');
insert into public.verification_reports (job_id, user_id, verdict, score, confidence, summary) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'passed', 100, 100, 'private report');
insert into public.job_artifacts (job_id, user_id, kind) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'console_summary');

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is((select count(*) from public.verification_jobs), 0::bigint, 'other user cannot read jobs');
select is((select count(*) from public.verification_reports), 0::bigint, 'other user cannot read reports');
select is((select count(*) from public.job_artifacts), 0::bigint, 'other user cannot read artifacts');

select * from finish();

rollback;

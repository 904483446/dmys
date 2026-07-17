begin;
select plan(2);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('40000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-owner@example.test', '', now(), '{"provider":"email"}', '{}', now(), now()),
  ('40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase4-other@example.test', '', now(), '{"provider":"email"}', '{}', now(), now());
insert into public.projects (id, user_id, source_type, display_name)
values ('40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000010', 'zip', 'owner project');
insert into public.verification_jobs (id, user_id, project_id, status, request_text, source_snapshot)
values ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000001', 'completed', '验证首页', '{}'::jsonb);
insert into public.verification_reports (job_id, user_id, verdict, score, confidence, summary)
values ('40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000010', 'passed', 90, 80, '通过');

set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000011', true);
select is((select count(*) from public.verification_reports where job_id = '40000000-0000-0000-0000-000000000002'), 0::bigint, 'other user cannot read export source report');
select is((select count(*) from public.verification_jobs where id = '40000000-0000-0000-0000-000000000002'), 0::bigint, 'other user cannot discover export source job');
select * from finish();
rollback;

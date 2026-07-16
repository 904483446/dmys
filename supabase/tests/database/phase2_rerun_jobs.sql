begin;

select plan(5);

select has_function(
  'public',
  'rerun_verification_job',
  array['uuid', 'text', 'text'],
  'rerun verification job RPC exists'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rerun-owner@example.test', '', now(), '{"provider":"email"}', '{}', now(), now());
insert into public.profiles (id, access_status)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'active')
on conflict (id) do update set access_status = excluded.access_status;
insert into public.projects (id, user_id, source_type, display_name)
values ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'zip', '原 ZIP 项目');
insert into public.verification_jobs (id, user_id, project_id, status, request_text, prd_storage_path, source_snapshot)
values ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'completed', '验证首页', 'cccccccc-cccc-cccc-cccc-cccccccccccc/original.prd', '{"sourceStoragePath":"cccccccc-cccc-cccc-cccc-cccccccccccc/original.zip"}');
insert into public.verification_reports (job_id, user_id, verdict, score, confidence, summary)
values ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'passed', 90, 90, '旧报告');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
select public.rerun_verification_job('cccccccc-cccc-cccc-cccc-cccccccccc02', null, null);

select is(
  (select count(*) from public.verification_jobs where user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  2::bigint,
  'rerun creates a new job without replacing the old job'
);
select is(
  (select status from public.verification_jobs where id <> 'cccccccc-cccc-cccc-cccc-cccccccccc02'),
  'queued',
  'rerun job is queued'
);
select is(
  (select count(*) from public.verification_reports where job_id = 'cccccccc-cccc-cccc-cccc-cccccccccc02'),
  1::bigint,
  'rerun preserves the old report'
);
select public.rerun_verification_job('cccccccc-cccc-cccc-cccc-cccccccccc02', null, null);
select throws_ok(
  $$select public.rerun_verification_job('cccccccc-cccc-cccc-cccc-cccccccccc02', null, null)$$,
  'P0001',
  'DAILY_JOB_LIMIT_EXCEEDED',
  'rerun enforces the daily job limit'
);

select * from finish();

rollback;

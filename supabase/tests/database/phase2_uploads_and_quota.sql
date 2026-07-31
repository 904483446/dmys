begin;

select plan(5);

select ok(
  exists(select 1 from storage.buckets where id = 'uploads' and public = false),
  'uploads bucket is private'
);
select has_function(
  'public',
  'create_zip_verification_job',
  array['text', 'text', 'text', 'text', 'jsonb'],
  'zip job creation RPC exists'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-owner@example.test', '', now(), '{"provider":"email"}', '{}', now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-other@example.test', '', now(), '{"provider":"email"}', '{}', now(), now());

update public.profiles set access_status = 'active' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
select public.create_zip_verification_job('one', 'request', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/one.zip', '{}'::jsonb);
select public.create_zip_verification_job('two', 'request', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/two.zip', '{}'::jsonb);
select public.create_zip_verification_job('three', 'request', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/three.zip', '{}'::jsonb);

select throws_ok(
  $$select public.create_zip_verification_job('four', 'request', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/four.zip', '{}'::jsonb)$$,
  'P0001',
  'DAILY_JOB_LIMIT_EXCEEDED',
  'fourth job is rejected'
);

update public.verification_jobs
set status = 'failed', error_code = 'REPORT_MODEL_FAILED:PROVIDER:HTTP_503'
where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select lives_ok(
  $$select public.create_zip_verification_job('retry-after-model-failure', 'request', null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/retry.zip', '{}'::jsonb)$$,
  'a model-provider failure releases the daily acceptance quota'
);

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
select is((select count(*) from public.verification_jobs), 0::bigint, 'other user cannot read owner jobs');

select * from finish();

rollback;

begin;

select plan(10);

select has_column(
  'public',
  'verification_jobs',
  'lease_owner',
  'verification jobs record the worker that owns a lease'
);
select has_function(
  'public',
  'update_verification_job_for_worker',
  array['uuid', 'text', 'text', 'text', 'text'],
  'worker status updates require a lease owner'
);
select has_function(
  'public',
  'save_verification_report_for_worker',
  array['uuid', 'text', 'text', 'smallint', 'smallint', 'text', 'jsonb', 'jsonb'],
  'worker report writes require a lease owner'
);

create temp table worker_lease_fixture (
  user_id uuid not null,
  project_id uuid not null,
  job_id uuid not null
) on commit drop;
insert into worker_lease_fixture values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid());

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'worker-test@example.test', '', now(), '{"provider":"email"}', '{}', now(), now()
from worker_lease_fixture;
insert into public.profiles (id, access_status)
select user_id, 'active' from worker_lease_fixture
on conflict (id) do update set access_status = excluded.access_status;
insert into public.projects (id, user_id, source_type, display_name)
select project_id, user_id, 'zip', 'Worker test project' from worker_lease_fixture;
insert into public.verification_jobs (id, user_id, project_id, request_text)
select job_id, user_id, project_id, 'Verify worker lease' from worker_lease_fixture;

select public.claim_verification_job('worker-a');
select ok(
  (select lease_expires_at > now() + interval '9 minutes' from public.verification_jobs where id = (select job_id from worker_lease_fixture)),
  'a claim gives long-running verification work a ten-minute lease'
);
select is(
  (select lease_owner from public.verification_jobs where id = (select job_id from worker_lease_fixture)),
  'worker-a',
  'claim records the worker that owns the lease'
);

select public.update_verification_job_for_worker((select job_id from worker_lease_fixture), 'worker-b', 'building');
select is(
  (select status from public.verification_jobs where id = (select job_id from worker_lease_fixture)),
  'preparing',
  'a different worker cannot update an active lease'
);

select public.save_verification_report_for_worker(
  (select job_id from worker_lease_fixture),
  'worker-b',
  'failed',
  0::smallint,
  90::smallint,
  'Worker failed',
  '[]'::jsonb,
  '[]'::jsonb
);
select is(
  (select count(*) from public.verification_reports where job_id = (select job_id from worker_lease_fixture)),
  0::bigint,
  'a different worker cannot save a report for an active lease'
);

select public.save_verification_report_for_worker(
  (select job_id from worker_lease_fixture),
  'worker-a',
  'at_risk',
  50::smallint,
  40::smallint,
  'Worker report',
  '[]'::jsonb,
  '[]'::jsonb
);
select is(
  (select user_id from public.verification_reports where job_id = (select job_id from worker_lease_fixture)),
  (select user_id from worker_lease_fixture),
  'the report owner is derived from the claimed job'
);

select public.update_verification_job_for_worker((select job_id from worker_lease_fixture), 'worker-a', 'completed');
select is(
  (select status from public.verification_jobs where id = (select job_id from worker_lease_fixture)),
  'completed',
  'the lease owner can write a terminal status'
);
select ok(
  (select lease_owner is null and lease_expires_at is null and finished_at is not null from public.verification_jobs where id = (select job_id from worker_lease_fixture)),
  'a terminal status releases the lease and records completion'
);

select * from finish();

rollback;

alter table public.verification_jobs add column lease_owner text;

create or replace function public.claim_verification_job(worker_id text)
returns public.verification_jobs
language plpgsql
security definer
set search_path = public
as $$
declare claimed_job public.verification_jobs;
begin
  with candidate as (
    select id from public.verification_jobs
    where status = 'queued' or (lease_expires_at is not null and lease_expires_at < now())
    order by created_at
    for update skip locked
    limit 1
  )
  update public.verification_jobs
  set status = 'preparing',
      lease_owner = worker_id,
      lease_expires_at = now() + interval '2 minutes',
      started_at = coalesce(started_at, now())
  where id = (select id from candidate)
  returning * into claimed_job;
  return claimed_job;
end;
$$;

create or replace function public.update_verification_job_for_worker(
  p_job_id uuid,
  p_worker_id text,
  p_status text,
  p_error_code text default null,
  p_error_message text default null
)
returns public.verification_jobs
language plpgsql
security definer
set search_path = public
as $$
declare updated_job public.verification_jobs;
begin
  if p_status not in ('preparing', 'building', 'running', 'testing', 'reporting', 'completed', 'failed', 'timed_out') then
    raise exception using errcode = 'P0001', message = 'INVALID_JOB_STATUS';
  end if;

  update public.verification_jobs
  set status = p_status,
      error_code = p_error_code,
      error_message = p_error_message,
      lease_expires_at = case when p_status in ('completed', 'failed', 'timed_out') then null else now() + interval '2 minutes' end,
      lease_owner = case when p_status in ('completed', 'failed', 'timed_out') then null else lease_owner end,
      finished_at = case when p_status in ('completed', 'failed', 'timed_out') then now() else finished_at end
  where id = p_job_id and lease_owner = p_worker_id and lease_expires_at > now()
  returning * into updated_job;
  return updated_job;
end;
$$;

revoke all on function public.update_verification_job_for_worker(uuid, text, text, text, text) from public;
grant execute on function public.update_verification_job_for_worker(uuid, text, text, text, text) to service_role;

create or replace function public.rerun_verification_job(
  p_job_id uuid,
  p_source_storage_path text default null,
  p_source_ref text default null
)
returns public.verification_jobs
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  original_job public.verification_jobs;
  new_source_snapshot jsonb;
  created_job public.verification_jobs;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select * into original_job
  from public.verification_jobs
  where id = p_job_id;
  if original_job is null then
    raise exception using errcode = 'P0001', message = 'JOB_NOT_FOUND';
  end if;

  if not exists (select 1 from public.profiles where id = current_user_id and access_status = 'active') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  if (select count(*) from public.verification_jobs
      where user_id = current_user_id
        and (created_at at time zone 'Asia/Shanghai')::date = (now() at time zone 'Asia/Shanghai')::date) >= 3 then
    raise exception using errcode = 'P0001', message = 'DAILY_JOB_LIMIT_EXCEEDED';
  end if;

  new_source_snapshot := original_job.source_snapshot;
  if p_source_storage_path is not null then
    new_source_snapshot := jsonb_set(
      new_source_snapshot,
      '{sourceStoragePath}',
      to_jsonb(p_source_storage_path)
    );
  end if;
  if p_source_ref is not null then
    new_source_snapshot := jsonb_set(new_source_snapshot, '{ref}', to_jsonb(p_source_ref));
  end if;

  insert into public.verification_jobs (
    user_id,
    project_id,
    status,
    request_text,
    prd_storage_path,
    source_snapshot
  )
  values (
    current_user_id,
    original_job.project_id,
    'queued',
    original_job.request_text,
    original_job.prd_storage_path,
    new_source_snapshot
  )
  returning * into created_job;

  return created_job;
end;
$$;

grant execute on function public.rerun_verification_job(uuid, text, text) to authenticated;

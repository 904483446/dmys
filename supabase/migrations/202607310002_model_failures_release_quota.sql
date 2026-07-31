create or replace function public.create_zip_verification_job(
  p_display_name text, p_request_text text, p_prd_storage_path text,
  p_source_storage_path text, p_source_snapshot jsonb
)
returns public.verification_jobs
language plpgsql security invoker set search_path = public
as $$
declare current_user_id uuid := auth.uid(); project_id uuid; created_job public.verification_jobs;
begin
  if current_user_id is null then raise exception using errcode = 'P0001', message = 'UNAUTHORIZED'; end if;
  if not exists (select 1 from public.profiles where id = current_user_id and access_status = 'active') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));
  if (select count(*) from public.verification_jobs
      where user_id = current_user_id
        and (created_at at time zone 'Asia/Shanghai')::date = (now() at time zone 'Asia/Shanghai')::date
        and not (status = 'failed' and error_code like 'REPORT_MODEL_FAILED:%')) >= 3 then
    raise exception using errcode = 'P0001', message = 'DAILY_JOB_LIMIT_EXCEEDED';
  end if;
  insert into public.projects (user_id, source_type, display_name)
  values (current_user_id, 'zip', p_display_name) returning id into project_id;
  insert into public.verification_jobs (user_id, project_id, status, request_text, prd_storage_path, source_snapshot)
  values (current_user_id, project_id, 'queued', p_request_text, p_prd_storage_path,
    jsonb_build_object('sourceStoragePath', p_source_storage_path, 'metadata', coalesce(p_source_snapshot, '{}'::jsonb)))
  returning * into created_job;
  return created_job;
end;
$$;

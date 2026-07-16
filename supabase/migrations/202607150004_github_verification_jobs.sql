create or replace function public.create_github_verification_job(
  p_display_name text,
  p_installation_id uuid,
  p_prd_storage_path text,
  p_repository_full_name text,
  p_repository_id bigint,
  p_request_text text,
  p_source_ref text
)
returns public.verification_jobs
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  installation public.github_installations;
  project_id uuid;
  created_job public.verification_jobs;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHORIZED';
  end if;

  select * into installation
  from public.github_installations
  where id = p_installation_id and revoked_at is null;
  if installation is null then
    raise exception using errcode = 'P0001', message = 'GITHUB_INSTALLATION_NOT_FOUND';
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

  insert into public.projects (
    user_id, source_type, display_name, github_installation_id, github_repository_id, github_repository_full_name
  ) values (
    current_user_id, 'github', p_display_name, installation.id, p_repository_id, p_repository_full_name
  ) returning id into project_id;

  insert into public.verification_jobs (
    user_id, project_id, status, request_text, prd_storage_path, source_snapshot
  ) values (
    current_user_id,
    project_id,
    'queued',
    p_request_text,
    p_prd_storage_path,
    jsonb_build_object('installationId', installation.id, 'repositoryId', p_repository_id, 'ref', p_source_ref)
  ) returning * into created_job;

  return created_job;
end;
$$;

grant execute on function public.create_github_verification_job(text, uuid, text, text, bigint, text, text) to authenticated;

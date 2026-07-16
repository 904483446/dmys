create or replace function public.save_verification_report_for_worker(
  p_job_id uuid,
  p_worker_id text,
  p_verdict text,
  p_score smallint,
  p_confidence smallint,
  p_summary text,
  p_verified_items jsonb,
  p_issues jsonb
)
returns public.verification_reports
language plpgsql
security definer
set search_path = public
as $$
declare saved_report public.verification_reports;
begin
  insert into public.verification_reports (
    job_id,
    user_id,
    verdict,
    score,
    confidence,
    summary,
    verified_items,
    issues
  )
  select
    job.id,
    job.user_id,
    p_verdict,
    p_score,
    p_confidence,
    p_summary,
    p_verified_items,
    p_issues
  from public.verification_jobs as job
  where job.id = p_job_id
    and job.lease_owner = p_worker_id
    and job.lease_expires_at > now()
  on conflict (job_id) do nothing
  returning * into saved_report;

  return saved_report;
end;
$$;

revoke all on function public.save_verification_report_for_worker(uuid, text, text, smallint, smallint, text, jsonb, jsonb) from public;
grant execute on function public.save_verification_report_for_worker(uuid, text, text, smallint, smallint, text, jsonb, jsonb) to service_role;

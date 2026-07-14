create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  access_status text not null default 'invited' check (access_status in ('invited', 'active', 'blocked')),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null check (source_type in ('github', 'zip')),
  display_name text not null,
  github_installation_id uuid,
  github_repository_id bigint,
  github_repository_full_name text,
  created_at timestamptz not null default now()
);

create table public.verification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'preparing', 'building', 'running', 'testing', 'reporting', 'completed', 'failed', 'timed_out')),
  request_text text not null check (char_length(trim(request_text)) > 0),
  prd_storage_path text,
  source_snapshot jsonb not null default '{}'::jsonb,
  lease_expires_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.verification_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.verification_jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  verdict text not null check (verdict in ('passed', 'at_risk', 'failed')),
  score smallint not null check (score between 0 and 100),
  confidence smallint not null check (confidence between 0 and 100),
  summary text not null,
  verified_items jsonb not null default '[]'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.job_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.verification_jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('screenshot', 'console_summary', 'network_summary')),
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index verification_jobs_user_created_idx on public.verification_jobs(user_id, created_at desc);
create index verification_jobs_status_created_idx on public.verification_jobs(status, created_at);
create index verification_jobs_lease_expires_idx on public.verification_jobs(lease_expires_at);
create index verification_reports_user_id_idx on public.verification_reports(user_id);
create index job_artifacts_user_id_idx on public.job_artifacts(user_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.verification_jobs enable row level security;
alter table public.verification_reports enable row level security;
alter table public.job_artifacts enable row level security;

create policy "profiles are private" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "projects are private" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "jobs are private" on public.verification_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports are private" on public.verification_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "artifacts are private" on public.job_artifacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
  set status = 'preparing', lease_expires_at = now() + interval '2 minutes', started_at = coalesce(started_at, now())
  where id = (select id from candidate)
  returning * into claimed_job;
  return claimed_job;
end;
$$;

revoke all on function public.claim_verification_job(text) from public;
grant execute on function public.claim_verification_job(text) to service_role;

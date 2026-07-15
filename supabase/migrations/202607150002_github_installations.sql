create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  installation_id bigint not null unique,
  account_login text not null,
  encrypted_token bytea,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index github_installations_user_id_idx on public.github_installations(user_id);

alter table public.github_installations enable row level security;

create policy "github installations are private" on public.github_installations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.github_installations to authenticated;

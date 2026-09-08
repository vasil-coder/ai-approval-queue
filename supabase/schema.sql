-- ============================================================
-- AI Approval Queue: database schema
-- Run in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run.
-- ============================================================

-- ---------- Tables ----------

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  payload jsonb not null,
  received_at timestamptz default now()
);

create table if not exists actions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  action_type text,
  ai_draft jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'executed')),
  approver_id uuid references auth.users(id),
  human_edits jsonb,
  created_at timestamptz default now(),
  decided_at timestamptz
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  ts timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text default 'admin',
  created_at timestamptz default now()
);

-- Rate limiting for the public webhook. Written only by the service-role
-- client, so it gets RLS enabled with no policies at all.
create table if not exists rate_limits (
  ip text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- ---------- Indexes ----------

create index if not exists actions_status_created_idx
  on actions (status, created_at desc);

create index if not exists audit_log_ts_idx
  on audit_log (ts desc);

-- ---------- Row Level Security ----------

alter table events      enable row level security;
alter table actions     enable row level security;
alter table audit_log   enable row level security;
alter table profiles    enable row level security;
alter table rate_limits enable row level security;

-- profiles: a user can read their own row.
-- REQUIRED. Every policy below subqueries this table as the calling user.
-- Without it, RLS on profiles denies the subquery and all other policies
-- silently evaluate to false.
drop policy if exists "users read own profile" on profiles;
create policy "users read own profile" on profiles
  for select using (id = auth.uid());

drop policy if exists "admins read events" on events;
create policy "admins read events" on events
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "admins read actions" on actions;
create policy "admins read actions" on actions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "admins update actions" on actions;
create policy "admins update actions" on actions
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  ) with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "admins read audit" on audit_log;
create policy "admins read audit" on audit_log
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Approve/reject writes an audit row under the admin's own session.
drop policy if exists "admins insert audit" on audit_log;
create policy "admins insert audit" on audit_log
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ---------- Auto-create a profile on signup ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- LedgerFlow Studio Company OS control plane.
-- Run after base auth/project setup. Tables are owner-scoped with RLS enabled.

create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table if not exists public.lf_knowledge_base (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  body text not null,
  source text not null default 'Founder Note',
  trust_level text not null default 'draft' check (trust_level in ('draft','needs_review','approved','archived')),
  tags text[] not null default '{}',
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lf_knowledge_base enable row level security;
drop policy if exists "lf_knowledge_owner_all" on public.lf_knowledge_base;
create policy "lf_knowledge_owner_all" on public.lf_knowledge_base
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists lf_knowledge_user_trust_idx on public.lf_knowledge_base (user_id, trust_level, created_at desc);

create table if not exists public.lf_agent_tasks (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  agent_role text not null default 'Chief of Staff',
  source text not null check (source in ('founder','n8n','telegram','openclaw','dashboard','system')),
  status text not null default 'inbox' check (status in ('inbox','planning','waiting_approval','ready','done','blocked')),
  risk text not null default 'low' check (risk in ('low','medium','high','blocked')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lf_agent_tasks enable row level security;
drop policy if exists "lf_agent_tasks_owner_all" on public.lf_agent_tasks;
create policy "lf_agent_tasks_owner_all" on public.lf_agent_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists lf_agent_tasks_user_status_idx on public.lf_agent_tasks (user_id, status, created_at desc);

create table if not exists public.lf_agent_events (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  source text not null check (source in ('founder','n8n','telegram','openclaw','dashboard','system')),
  event_type text not null,
  title text not null,
  body text not null default '',
  agent_role text,
  task_id text,
  risk text not null default 'low' check (risk in ('low','medium','high','blocked')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.lf_agent_events enable row level security;
drop policy if exists "lf_agent_events_owner_all" on public.lf_agent_events;
create policy "lf_agent_events_owner_all" on public.lf_agent_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists lf_agent_events_user_created_idx on public.lf_agent_events (user_id, created_at desc);
create index if not exists lf_agent_events_user_source_idx on public.lf_agent_events (user_id, source, event_type);

create table if not exists public.lf_tool_runs (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  connector text not null,
  action text not null,
  title text not null,
  target text not null default '',
  status text not null default 'simulated' check (status in ('simulated','waiting_approval','approved','executed','blocked','failed')),
  risk text not null default 'low' check (risk in ('low','medium','high','blocked')),
  approval_required boolean not null default false,
  approved_by uuid references auth.users,
  approved_at timestamptz,
  request jsonb not null default '{}',
  result jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.lf_tool_runs enable row level security;
drop policy if exists "lf_tool_runs_owner_all" on public.lf_tool_runs;
create policy "lf_tool_runs_owner_all" on public.lf_tool_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists lf_tool_runs_user_status_idx on public.lf_tool_runs (user_id, status, created_at desc);

create table if not exists public.lf_financial_ledger (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  txn_date date not null default current_date,
  account_code text not null,
  description text not null,
  debit_vnd numeric(18,2) not null default 0,
  credit_vnd numeric(18,2) not null default 0,
  source text not null default 'manual',
  evidence_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.lf_financial_ledger enable row level security;
drop policy if exists "lf_financial_ledger_owner_all" on public.lf_financial_ledger;
create policy "lf_financial_ledger_owner_all" on public.lf_financial_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists lf_financial_ledger_user_date_idx on public.lf_financial_ledger (user_id, txn_date desc);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lf_knowledge_base_touch_updated_at on public.lf_knowledge_base;
create trigger lf_knowledge_base_touch_updated_at
  before update on public.lf_knowledge_base
  for each row execute function public.touch_updated_at();

drop trigger if exists lf_agent_tasks_touch_updated_at on public.lf_agent_tasks;
create trigger lf_agent_tasks_touch_updated_at
  before update on public.lf_agent_tasks
  for each row execute function public.touch_updated_at();

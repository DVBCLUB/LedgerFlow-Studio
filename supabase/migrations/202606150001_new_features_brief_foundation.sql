-- LedgerFlow Studio new-features brief foundation tables.
-- Run in Supabase SQL Editor or migration pipeline.

create extension if not exists "uuid-ossp";

create table if not exists public.company_memory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  memory_type text not null check (memory_type in ('decision','context','agent_output','product_update','market_intel','customer','blocker','learning')),
  title text not null,
  content text not null,
  agent_author text,
  related_card_id uuid,
  related_product text,
  embedding vector(1536),
  is_active boolean default true,
  expires_at timestamptz,
  tags text[] default '{}',
  importance text default 'normal' check (importance in ('low','normal','high','critical')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.company_memory enable row level security;
drop policy if exists "Xem memory của mình" on public.company_memory;
create policy "Xem memory của mình" on public.company_memory for all using (auth.uid() = user_id);
create index if not exists company_memory_user_type_idx on public.company_memory (user_id, memory_type);
create index if not exists company_memory_user_active_created_idx on public.company_memory (user_id, is_active, created_at desc);
create index if not exists company_memory_user_importance_idx on public.company_memory (user_id, importance);

create table if not exists public.agent_pipelines (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  name text not null,
  status text default 'running' check (status in ('running','waiting_approval','completed','failed','paused')),
  steps jsonb default '[]',
  input jsonb default '{}',
  output text,
  current_step_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agent_pipelines enable row level security;
drop policy if exists "Xem pipelines của mình" on public.agent_pipelines;
create policy "Xem pipelines của mình" on public.agent_pipelines for all using (auth.uid() = user_id);
create index if not exists agent_pipelines_user_status_idx on public.agent_pipelines (user_id, status);
create index if not exists agent_pipelines_user_created_idx on public.agent_pipelines (user_id, created_at desc);

create table if not exists public.revenue_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_name text not null,
  customer_email text,
  amount_vnd integer not null,
  type text not null check (type in ('one_time','subscription','service')),
  status text default 'active' check (status in ('active','churned','paused')),
  period text,
  started_at date,
  ended_at date,
  source text,
  notes text,
  created_at timestamptz default now()
);

alter table public.revenue_records enable row level security;
drop policy if exists "Xem revenue của mình" on public.revenue_records;
create policy "Xem revenue của mình" on public.revenue_records for all using (auth.uid() = user_id);
create index if not exists revenue_records_user_created_idx on public.revenue_records (user_id, created_at desc);
create index if not exists revenue_records_user_status_idx on public.revenue_records (user_id, status);

create or replace function public.seed_company_memory(p_user_id uuid)
returns void as $$
begin
  insert into public.company_memory (user_id, memory_type, title, content, agent_author, importance)
  values
    (p_user_id, 'context', 'Công ty là gì', 'LedgerFlow Studio — solo founder company. Nhân viên là AI agents. Sản phẩm: phần mềm kế toán VN + edu-games. Thị trường: SMEs Việt Nam.', 'Founder', 'critical'),
    (p_user_id, 'context', 'Stack kỹ thuật', 'React 19 + TypeScript + Vite + Express.js + Supabase + Electron. AI qua backend gateway.', 'Founder', 'high'),
    (p_user_id, 'context', 'Thị trường mục tiêu', 'SMEs Việt Nam: kế toán kiêm nhiệm, muốn đơn giản, ưu tiên tuân thủ thuế, VAS/Thông tư 200.', 'Founder', 'high')
  on conflict do nothing;
end;
$$ language plpgsql security definer;

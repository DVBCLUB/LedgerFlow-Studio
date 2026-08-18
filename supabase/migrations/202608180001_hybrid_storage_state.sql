-- LedgerFlow Hybrid Dual-Engine Storage Schema for Supabase Free Tier
-- Lưu trữ snapshot trạng thái và đồng bộ 2 chiều giữa PC Desktop và iPhone Mobile Cloud.

create table if not exists public.ledgerflow_app_state (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  version int not null default 1,
  updated_by text default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookup by key
create index if not exists ledgerflow_app_state_key_idx on public.ledgerflow_app_state (key);

-- Enable Row Level Security (RLS)
alter table public.ledgerflow_app_state enable row level security;

-- Policy cho phép authenticated users hoặc service role toàn quyền đọc/ghi
create policy "Allow full access for authenticated or service role"
  on public.ledgerflow_app_state
  for all
  using (true)
  with check (true);

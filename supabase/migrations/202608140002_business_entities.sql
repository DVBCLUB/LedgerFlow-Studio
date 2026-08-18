-- Business entities table — dữ liệu nghiệp vụ thống nhất, AI & các bộ phận đọc/ghi chung.
create table if not exists public.business_entities (
  id text primary key,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_entities_type_idx on public.business_entities (type);

alter table public.business_entities enable row level security;

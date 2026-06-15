-- LedgerFlow Hub - Supabase schema
-- Run this file in the Supabase SQL Editor for the target project.

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'owner' check (role in ('owner', 'admin', 'viewer')),
  company_name text default 'LedgerFlow Hub',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.workboard_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  kind text not null check (kind in ('Q&A','Code','Design','Data','Marketing','Integration','CI Fix','Audit','Product','Ops')),
  owner text not null default 'Founder',
  ai_staff text,
  status text not null default 'Inbox' check (status in ('Inbox','Planning','Waiting Approval','Ready','Done')),
  risk text not null default 'LOW' check (risk in ('LOW','MEDIUM','HIGH')),
  request text,
  plan jsonb default '[]',
  tools jsonb default '[]',
  approval text,
  steps jsonb default '[]',
  input text,
  expected_output text,
  acceptance_criteria text,
  founder_review text,
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workboard_cards enable row level security;

drop policy if exists "workboard_cards_own_all" on public.workboard_cards;
create policy "workboard_cards_own_all"
  on public.workboard_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.knowledge_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  category text default 'General' check (category in (
    'General', 'Product', 'Accounting', 'Marketing', 'Sales',
    'Code', 'Design', 'Game', 'Finance', 'Operations', 'Legal', 'AI'
  )),
  tags text[] default '{}',
  source text,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.knowledge_items enable row level security;

drop policy if exists "knowledge_items_own_all" on public.knowledge_items;
create policy "knowledge_items_own_all"
  on public.knowledge_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.search_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  p_user_id uuid default auth.uid()
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  tags text[],
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    ki.id,
    ki.title,
    ki.content,
    ki.category,
    ki.tags,
    1 - (ki.embedding <=> query_embedding) as similarity
  from public.knowledge_items ki
  where ki.user_id = p_user_id
    and 1 - (ki.embedding <=> query_embedding) > match_threshold
  order by ki.embedding <=> query_embedding
  limit match_count;
end;
$$;

create table if not exists public.agent_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  card_id uuid references public.workboard_cards(id) on delete set null,
  agent_role text not null check (agent_role in (
    'AI PM', 'AI Dev', 'AI Marketer', 'AI Accountant',
    'AI Auditor', 'AI Designer', 'AI Analyst', 'AI Support'
  )),
  status text default 'queued' check (status in ('queued','running','waiting_review','done','failed')),
  prompt text,
  context jsonb default '{}',
  output text,
  output_metadata jsonb default '{}',
  ai_provider text,
  ai_model text,
  tokens_used integer,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.agent_tasks enable row level security;

drop policy if exists "agent_tasks_own_all" on public.agent_tasks;
create policy "agent_tasks_own_all"
  on public.agent_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.company_memory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  memory_type text not null check (memory_type in (
    'decision', 'context', 'agent_output', 'product_update',
    'market_intel', 'customer', 'blocker', 'learning'
  )),
  title text not null,
  content text not null,
  agent_author text,
  related_card_id uuid references public.workboard_cards(id) on delete set null,
  related_product text,
  tags text[] default '{}',
  importance text not null default 'normal' check (importance in ('low','normal','high','critical')),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.company_memory enable row level security;

drop policy if exists "company_memory_own_all" on public.company_memory;
create policy "company_memory_own_all"
  on public.company_memory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

drop policy if exists "agent_pipelines_own_all" on public.agent_pipelines;
create policy "agent_pipelines_own_all"
  on public.agent_pipelines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists agent_pipelines_user_status_idx on public.agent_pipelines (user_id, status);
create index if not exists agent_pipelines_user_created_idx on public.agent_pipelines (user_id, created_at desc);

create table if not exists public.agent_pipeline_approvals (
  id uuid default uuid_generate_v4() primary key,
  pipeline_id text references public.agent_pipelines(id) on delete cascade not null,
  step_index integer not null,
  approver_id uuid,
  note text,
  created_at timestamptz default now()
);

alter table public.agent_pipeline_approvals enable row level security;

drop policy if exists "agent_pipeline_approvals_own_all" on public.agent_pipeline_approvals;
create policy "agent_pipeline_approvals_own_all"
  on public.agent_pipeline_approvals for all
  using (true)
  with check (true);

create index if not exists agent_pipeline_approvals_pipeline_idx on public.agent_pipeline_approvals (pipeline_id, step_index);


create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null check (type in ('software','game','template','ai-tool','service')),
  status text default 'idea' check (status in ('idea','building','beta','launched','paused','killed')),
  description text,
  target_user text,
  price_vnd integer,
  mrr_vnd integer default 0,
  github_repo text,
  tech_stack text[] default '{}',
  go_decision text check (go_decision in ('GO','HOLD','NO-GO')),
  score numeric(5,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "products_own_all" on public.products;
create policy "products_own_all"
  on public.products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  agent text,
  risk text,
  details jsonb default '{}',
  ip_address inet,
  created_at timestamptz default now()
);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_own" on public.audit_log;
create policy "audit_log_select_own"
  on public.audit_log for select
  using (auth.uid() = user_id);

drop policy if exists "audit_log_insert_own" on public.audit_log;
create policy "audit_log_insert_own"
  on public.audit_log for insert
  with check (auth.uid() = user_id);

create table if not exists public.company_settings (
  user_id uuid references auth.users on delete cascade primary key,
  company_name text default 'My Company',
  logo_url text,
  primary_currency text default 'VND',
  fiscal_year_start integer default 1,
  accounting_standard text default 'VAS' check (accounting_standard in ('VAS','IFRS')),
  industry text default 'software',
  zalo_oa_id text,
  facebook_page_id text,
  github_org text,
  n8n_webhook_url text,
  settings jsonb default '{}',
  updated_at timestamptz default now()
);

alter table public.company_settings enable row level security;

drop policy if exists "company_settings_own_all" on public.company_settings;
create policy "company_settings_own_all"
  on public.company_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists workboard_cards_user_status_idx on public.workboard_cards (user_id, status);
create index if not exists workboard_cards_user_created_idx on public.workboard_cards (user_id, created_at desc);
create index if not exists knowledge_items_user_category_idx on public.knowledge_items (user_id, category);
create index if not exists agent_tasks_user_status_idx on public.agent_tasks (user_id, status);
create index if not exists agent_tasks_user_created_idx on public.agent_tasks (user_id, created_at desc);
create index if not exists products_user_status_idx on public.products (user_id, status);
create index if not exists audit_log_user_created_idx on public.audit_log (user_id, created_at desc);

-- Optional after data exists:
-- create index if not exists knowledge_items_embedding_idx
--   on public.knowledge_items using ivfflat (embedding vector_cosine_ops) with (lists = 100);

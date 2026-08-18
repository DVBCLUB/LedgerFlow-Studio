-- AI lessons table — tri thức AI học lẫn nhau, lưu trên Supabase để máy nhẹ.
create table if not exists public.ai_lessons (
  id text primary key,
  domain text not null default 'general',
  title text not null default '',
  content text not null default '',
  source text not null default '',
  success boolean not null default false,
  confidence real not null default 0.5,
  created_at timestamptz not null default now()
);

alter table public.ai_lessons enable row level security;

-- Service role bypasses RLS; thêm policy cho owner nếu cần đọc từ client.
create policy "ai_lessons_owner_select"
  on public.ai_lessons for select
  using (auth.uid() is not null);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  type text not null check (type in (
    'daily_brief', 'weekly_report', 'monthly_reminder',
    'agent_done', 'approval_needed', 'pipeline_done',
    'alert', 'info'
  )),
  is_read boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Xem notifications của mình" on public.notifications;
create policy "Xem notifications của mình"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notifications_user_read_created_idx on public.notifications (user_id, is_read, created_at desc);
create index if not exists notifications_user_type_idx on public.notifications (user_id, type);

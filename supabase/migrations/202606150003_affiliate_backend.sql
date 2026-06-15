create table if not exists public.referral_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null unique,
  partner_name text not null,
  partner_type text default 'Kế toán dịch vụ',
  partner_email text,
  commission_rate numeric(5,2) default 20.00,
  commission_type text default 'recurring' check (commission_type in ('one_time','recurring')),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.referral_events (
  id uuid default uuid_generate_v4() primary key,
  code text not null references public.referral_codes(code),
  event_type text not null check (event_type in ('click','signup','trial','paid','churned')),
  customer_email text,
  product_name text,
  revenue_vnd integer default 0,
  commission_vnd integer default 0,
  commission_status text default 'pending' check (commission_status in ('pending','approved','paid','rejected')),
  ip_address inet,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.referral_codes enable row level security;
alter table public.referral_events enable row level security;

drop policy if exists "referral_codes_owner_all" on public.referral_codes;
create policy "referral_codes_owner_all"
  on public.referral_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "referral_events_owner_select" on public.referral_events;
create policy "referral_events_owner_select"
  on public.referral_events for select
  using (code in (select rc.code from public.referral_codes rc where rc.user_id = auth.uid()));

create index if not exists referral_codes_user_active_idx on public.referral_codes (user_id, is_active);
create index if not exists referral_events_code_type_idx on public.referral_events (code, event_type);
create index if not exists referral_events_commission_status_idx on public.referral_events (commission_status);

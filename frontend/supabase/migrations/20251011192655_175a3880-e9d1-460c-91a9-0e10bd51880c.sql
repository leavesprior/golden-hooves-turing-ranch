-- Golden Hooves Quest: Ranch game tables

-- Ranch runs table for storing game sessions
create table if not exists public.ranch_runs (
  id uuid primary key default gen_random_uuid(),
  name text unique,
  created_at timestamptz not null default now(),
  config jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  full_log text,
  blockchain_hash text
);

-- Players table
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  karma integer not null default 0,
  coins integer not null default 0,
  alignment text not null default 'Good'
);

-- Inventory table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1
);

-- Karma ledger for tracking transactions
create table if not exists public.karma_ledger (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  transaction_type text not null,
  amount integer not null,
  ts timestamptz not null default now()
);

-- Booking requests table
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid,
  requested_date date not null,
  status text not null default 'pending',
  discount_code text
);

-- Enable RLS
alter table public.ranch_runs enable row level security;
alter table public.players enable row level security;
alter table public.inventory enable row level security;
alter table public.karma_ledger enable row level security;
alter table public.booking_requests enable row level security;

-- RLS policies
create policy "runs_insert" on public.ranch_runs for insert to authenticated with check (true);
create policy "runs_select" on public.ranch_runs for select to authenticated using (true);

create policy "players_rw" on public.players for all to authenticated using (true) with check (true);
create policy "inventory_rw" on public.inventory for all to authenticated using (true) with check (true);
create policy "karma_rw" on public.karma_ledger for all to authenticated using (true) with check (true);
create policy "booking_rw" on public.booking_requests for all to authenticated using (true) with check (true);

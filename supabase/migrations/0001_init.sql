-- An AuDHD Adventure — initial schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------- accounts ----------
-- One row per Supabase auth user. id == auth.users.id, so RLS can compare
-- directly against auth.uid() everywhere below.
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'solo' check (mode in ('solo', 'system')),
  party_name text not null default '',
  active_character_id uuid, -- FK added below, after characters exists
  show_intro boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- characters ----------
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null default 'New character',
  main_role text not null default 'Explorer',
  main_role_why text not null default '',
  physical_stats jsonb not null default '{"strength":5,"endurance":5,"coordination":5,"memory":5,"precision":5}',
  stat_xp jsonb not null default '{"strength":0,"endurance":0,"coordination":0,"memory":0,"precision":0}',
  pools jsonb not null default '{"HP":{"max":100},"SP":{"max":100,"floorFraction":0.15},"MP":{"max":100,"floorFraction":0.25}}',
  day_settings jsonb not null default '{"startHour":7,"startMinute":0,"endHour":23,"endMinute":0}',
  sub_roles jsonb not null default '[]',
  active_buffs jsonb not null default '{}',
  custom_buffs_debuffs jsonb not null default '[]',
  actions_spells jsonb not null default '[]',
  pool_spent jsonb not null default '{"SP":0,"MP":0}',
  pool_spent_date date,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.accounts
  add constraint accounts_active_character_fk
  foreign key (active_character_id) references public.characters(id) on delete set null;

-- ---------- history ----------
-- Polymorphic log: type + data (jsonb) covers login/checkin/growth/
-- buff_toggle/quest_complete/action_spell_use, mirroring the prototype's
-- single `state.history` array.
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  type text not null,
  date date not null,
  ts timestamptz not null default now(),
  data jsonb not null default '{}',
  edited boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists history_account_id_idx on public.history (account_id);
create index if not exists history_character_id_idx on public.history (character_id);
create index if not exists history_ts_idx on public.history (ts desc);

-- ---------- switch_log ----------
-- Fronting history for system/party mode.
create table if not exists public.switch_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  at timestamptz not null default now()
);

create index if not exists switch_log_account_id_idx on public.switch_log (account_id);

-- ---------- Row Level Security ----------
-- Every table is scoped to auth.uid() so a user (or the anon-key client)
-- can only ever read or write their own data. This is the enforcement
-- layer the admin panel (spec section 11) must bypass deliberately and
-- explicitly, never by accident.

alter table public.accounts enable row level security;
alter table public.characters enable row level security;
alter table public.history enable row level security;
alter table public.switch_log enable row level security;

create policy "accounts: owner can select" on public.accounts
  for select using (id = auth.uid());
create policy "accounts: owner can update" on public.accounts
  for update using (id = auth.uid());
create policy "accounts: owner can insert" on public.accounts
  for insert with check (id = auth.uid());
create policy "accounts: owner can delete" on public.accounts
  for delete using (id = auth.uid());

create policy "characters: owner can select" on public.characters
  for select using (account_id = auth.uid());
create policy "characters: owner can insert" on public.characters
  for insert with check (account_id = auth.uid());
create policy "characters: owner can update" on public.characters
  for update using (account_id = auth.uid());
create policy "characters: owner can delete" on public.characters
  for delete using (account_id = auth.uid());

create policy "history: owner can select" on public.history
  for select using (account_id = auth.uid());
create policy "history: owner can insert" on public.history
  for insert with check (account_id = auth.uid());
create policy "history: owner can update" on public.history
  for update using (account_id = auth.uid());
create policy "history: owner can delete" on public.history
  for delete using (account_id = auth.uid());

create policy "switch_log: owner can select" on public.switch_log
  for select using (account_id = auth.uid());
create policy "switch_log: owner can insert" on public.switch_log
  for insert with check (account_id = auth.uid());

-- ---------- New-user provisioning ----------
-- Mirrors spec section 8, "First-login provisioning": the moment someone
-- signs in for the first time (Discord OAuth or anonymous guest), give
-- them an Account row and a single starting Character named "You" with
-- the same baseline the prototype uses (all Physical Stats at 5, full
-- HP/SP/MP, day window starting at signup time so pools read as full).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_character_id uuid;
  start_hour int := extract(hour from now())::int;
  start_minute int := extract(minute from now())::int;
  end_total_minutes int := (start_hour * 60 + start_minute + 16 * 60) % (24 * 60);
begin
  insert into public.accounts (id, mode, party_name, show_intro)
  values (new.id, 'solo', '', true);

  insert into public.characters (
    account_id, name, main_role, main_role_why,
    physical_stats, stat_xp, pools, day_settings
  ) values (
    new.id, 'You', 'Explorer', '',
    '{"strength":5,"endurance":5,"coordination":5,"memory":5,"precision":5}',
    '{"strength":0,"endurance":0,"coordination":0,"memory":0,"precision":0}',
    '{"HP":{"max":100},"SP":{"max":100,"floorFraction":0.15},"MP":{"max":100,"floorFraction":0.25}}',
    jsonb_build_object(
      'startHour', start_hour,
      'startMinute', start_minute,
      'endHour', end_total_minutes / 60,
      'endMinute', end_total_minutes % 60
    )
  )
  returning id into new_character_id;

  update public.accounts set active_character_id = new_character_id where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

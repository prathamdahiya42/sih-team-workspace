-- ====================================================================
-- SIH Team Collaboration Platform (AI "7th Member") Database Schema
-- Run this script in the Supabase SQL Editor to initialize the database
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "pgcrypto";

-- 2. User Profiles (Synced from auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Trigger to auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = coalesce(excluded.email, profiles.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Teams Table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  project_brief text, -- team's SIH problem statement / theme
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- 4. Team Members Table (Enforces 6-9 Member Capacity Cap)
create table if not exists public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);

-- Function and trigger to enforce 9-member limit per team
create or replace function public.check_team_member_cap()
returns trigger
language plpgsql
as $$
declare
  member_count int;
begin
  select count(*) into member_count
  from public.team_members
  where team_id = new.team_id;

  if member_count >= 9 then
    raise exception 'Team has reached the maximum capacity of 9 members allowed for SIH.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_team_member_cap on public.team_members;
create trigger enforce_team_member_cap
  before insert on public.team_members
  for each row execute function public.check_team_member_cap();

-- 5. Messages Table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references auth.users, -- null for 'agent' and 'system'
  content text not null,
  type text not null default 'text' check (type in ('text', 'agent', 'transcript', 'system')),
  meta jsonb default '{}'::jsonb, -- e.g. {"call_id": "...", "model": "..."}
  created_at timestamptz default now()
);

-- 6. Summaries Table
create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  content text,
  decisions jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb, -- [{ "text": "...", "assignee": "user_id/name or null", "done": false }]
  message_range_start uuid,
  message_range_end uuid,
  generated_at timestamptz default now()
);

-- 7. Calls Table
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  room_name text not null, -- crypto-random 'sih-<uuid>'
  started_by uuid references auth.users,
  started_at timestamptz default now(),
  ended_at timestamptz,
  recap_message_id uuid references public.messages(id)
);

-- 8. Team API Keys Table
create table if not exists public.team_api_keys (
  team_id uuid references public.teams(id) on delete cascade,
  provider text not null check (provider in ('groq', 'gemini', 'openrouter')),
  model_id text not null,
  secret_id uuid, -- optional vault.secrets.id
  encrypted_key text, -- fallback encrypted key
  is_active boolean not null default true,
  updated_at timestamptz default now(),
  primary key (team_id, provider)
);

-- 9. Helper Function for RLS
create or replace function public.is_team_member(_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = _team_id and user_id = auth.uid()
  );
$$;

-- 10. Enable Row-Level Security (RLS) on all tables
alter table public.profiles enable row level security;
create policy "Anyone can read profiles" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

alter table public.teams enable row level security;
create policy "Team members read teams" on public.teams for select using (is_team_member(id) or created_by = auth.uid());
create policy "Authenticated users create teams" on public.teams for insert with check (auth.role() = 'authenticated');
create policy "Team members update teams" on public.teams for update using (is_team_member(id));

alter table public.team_members enable row level security;
create policy "Team members read membership" on public.team_members for select using (is_team_member(team_id));
create policy "Authenticated users can join team" on public.team_members for insert with check (auth.uid() = user_id);
create policy "Users can leave or owners can remove" on public.team_members for delete using (auth.uid() = user_id or exists(select 1 from public.team_members where team_id = team_members.team_id and user_id = auth.uid() and role = 'owner'));

alter table public.messages enable row level security;
create policy "Team members read messages" on public.messages for select using (is_team_member(team_id));
create policy "Team members send messages" on public.messages for insert with check (is_team_member(team_id) and (user_id = auth.uid() or type != 'text'));

alter table public.summaries enable row level security;
create policy "Team members read summaries" on public.summaries for select using (is_team_member(team_id));
create policy "Team members create summaries" on public.summaries for insert with check (is_team_member(team_id));

alter table public.calls enable row level security;
create policy "Team members read calls" on public.calls for select using (is_team_member(team_id));
create policy "Team members manage calls" on public.calls for all using (is_team_member(team_id));

-- Note: team_api_keys gets NO client-facing policy! RLS is enabled with zero policies for authenticated/anon.
alter table public.team_api_keys enable row level security;

-- 11. Vault Extension & Helper Functions (if Supabase Vault is available)
do $$
begin
  begin
    create extension if not exists supabase_vault with schema vault;
  exception when others then
    raise notice 'Vault extension not enabled or not supported in this environment, fallback encryption will be used.';
  end;
end $$;

-- 12. Enable Realtime Publications
begin;
  -- drop publication if exists supabase_realtime;
  -- create publication supabase_realtime;
  alter publication supabase_realtime add table public.messages;
  alter publication supabase_realtime add table public.calls;
  alter publication supabase_realtime add table public.summaries;
commit;

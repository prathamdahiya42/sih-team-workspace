-- ====================================================================
-- SIH Collab: Migration for Profiles, Custom Roles & WhatsApp Import
-- Run this in your Supabase SQL Editor
-- ====================================================================

-- 1. Add preferences column to profiles
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- 2. Add custom_role column to team_members
alter table public.team_members
  add column if not exists custom_role text;

-- 3. Update messages check constraint to allow 'imported'
alter table public.messages
  drop constraint if exists messages_type_check;

alter table public.messages
  add constraint messages_type_check check (type in ('text', 'agent', 'transcript', 'system', 'imported'));

-- 4. Create chat_imports table if not exists
create table if not exists public.chat_imports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  filename text not null,
  message_count int not null default 0,
  matched_count int not null default 0,
  unmatched_senders text[] default '{}',
  created_at timestamptz not null default now()
);

alter table public.chat_imports enable row level security;

drop policy if exists "Team members read chat imports" on public.chat_imports;
create policy "Team members read chat imports" on public.chat_imports for select using (is_team_member(team_id));

drop policy if exists "Team members create chat imports" on public.chat_imports;
create policy "Team members create chat imports" on public.chat_imports for insert with check (is_team_member(team_id));

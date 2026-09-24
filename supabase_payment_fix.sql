-- PFC Financials: repair the Premium payment workflow
-- Run this once in Supabase SQL Editor against the production database.
-- This migration is intentionally idempotent.

-- ============================================================
-- 1. paymentRequests: align the database with PremiumModal/Admin
-- ============================================================

create table if not exists public."paymentRequests" (
  id text primary key,
  "userId" uuid,
  "companyId" text,
  "companyName" text,
  whatsapp text,
  "txnId" text,
  plan text,
  status text default 'pending',
  "createdAt" text,
  amount numeric,
  "userEmail" text,
  "userName" text,
  "licenseKey" text
);

alter table public."paymentRequests" add column if not exists "userId" uuid;
alter table public."paymentRequests" add column if not exists "companyId" text;
alter table public."paymentRequests" add column if not exists "companyName" text;
alter table public."paymentRequests" add column if not exists whatsapp text;
alter table public."paymentRequests" add column if not exists "txnId" text;
alter table public."paymentRequests" add column if not exists plan text;
alter table public."paymentRequests" add column if not exists status text;
alter table public."paymentRequests" add column if not exists "createdAt" text;
alter table public."paymentRequests" add column if not exists amount numeric;
alter table public."paymentRequests" add column if not exists "userEmail" text;
alter table public."paymentRequests" add column if not exists "userName" text;
alter table public."paymentRequests" add column if not exists "licenseKey" text;

alter table public."paymentRequests" enable row level security;

drop policy if exists "paymentRequests_select_own_or_admin" on public."paymentRequests";
create policy "paymentRequests_select_own_or_admin"
on public."paymentRequests"
for select
to authenticated
using (
  "userId" = (select auth.uid())
  or (select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com'
);

drop policy if exists "paymentRequests_insert_own" on public."paymentRequests";
create policy "paymentRequests_insert_own"
on public."paymentRequests"
for insert
to authenticated
with check ("userId" = (select auth.uid()));

drop policy if exists "paymentRequests_update_admin" on public."paymentRequests";
create policy "paymentRequests_update_admin"
on public."paymentRequests"
for update
to authenticated
using ((select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com')
with check ((select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com');

drop policy if exists "paymentRequests_delete_admin" on public."paymentRequests";
create policy "paymentRequests_delete_admin"
on public."paymentRequests"
for delete
to authenticated
using ((select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com');

grant select, insert, update, delete on public."paymentRequests" to authenticated;

-- ============================================================
-- 2. validKeys: align the database with Admin.tsx
-- ============================================================

create table if not exists public."validKeys" (
  id text primary key,
  "createdAt" text,
  "isActive" boolean default true,
  used boolean default false,
  "generatedForCompany" text,
  "companyId" text,
  plan text,
  "usedAt" text
);

alter table public."validKeys" add column if not exists "createdAt" text;
alter table public."validKeys" add column if not exists "isActive" boolean default true;
alter table public."validKeys" add column if not exists used boolean default false;
alter table public."validKeys" add column if not exists "generatedForCompany" text;
alter table public."validKeys" add column if not exists "companyId" text;
alter table public."validKeys" add column if not exists plan text;
alter table public."validKeys" add column if not exists "usedAt" text;

alter table public."validKeys" enable row level security;

drop policy if exists "validKeys_select_authenticated" on public."validKeys";
create policy "validKeys_select_authenticated"
on public."validKeys"
for select
to authenticated
using (true);

drop policy if exists "validKeys_insert_admin" on public."validKeys";
create policy "validKeys_insert_admin"
on public."validKeys"
for insert
to authenticated
with check ((select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com');

drop policy if exists "validKeys_update_admin" on public."validKeys";
create policy "validKeys_update_admin"
on public."validKeys"
for update
to authenticated
using ((select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com')
with check ((select auth.jwt() ->> 'email') = 'mndl.yuvi@gmail.com');

grant select, insert, update on public."validKeys" to authenticated;

-- ============================================================
-- 3. Enable Supabase Realtime safely
-- ============================================================

do $$
begin
  begin
    alter publication supabase_realtime add table public."paymentRequests";
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public."validKeys";
  exception
    when duplicate_object then null;
  end;
end $$;

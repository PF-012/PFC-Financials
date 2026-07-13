-- Add missing columns to existing tables
alter table companies add column if not exists "createdAt" text;
alter table ledgers add column if not exists "createdAt" text;
alter table vouchers add column if not exists "createdAt" text;
alter table bank_transactions add column if not exists "createdAt" text;

-- Create paymentRequests table
create table if not exists "paymentRequests" (
  id text primary key,
  "userId" uuid not null,
  status text,
  "createdAt" text,
  amount numeric,
  "userEmail" text,
  "userName" text,
  "companyName" text
);
alter table "paymentRequests" enable row level security;

drop policy if exists "Users can read their own paymentRequests" on "paymentRequests";
create policy "Users can read their own paymentRequests" on "paymentRequests" for select using (auth.uid() = "userId");

drop policy if exists "Users can insert their own paymentRequests" on "paymentRequests";
create policy "Users can insert their own paymentRequests" on "paymentRequests" for insert with check (auth.uid() = "userId");

drop policy if exists "Users can update their own paymentRequests" on "paymentRequests";
create policy "Users can update their own paymentRequests" on "paymentRequests" for update using (auth.uid() = "userId");

drop policy if exists "Users can delete their own paymentRequests" on "paymentRequests";
create policy "Users can delete their own paymentRequests" on "paymentRequests" for delete using (auth.uid() = "userId");

-- Create validKeys table
create table if not exists "validKeys" (
  id text primary key,
  "createdAt" text,
  "isActive" boolean default true
);
alter table "validKeys" enable row level security;
-- Only admin can modify, but any user can read valid keys
drop policy if exists "Anyone can read validKeys" on "validKeys";
create policy "Anyone can read validKeys" on "validKeys" for select using (true);

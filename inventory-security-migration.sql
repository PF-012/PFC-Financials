-- PFC Financials Inventory database migration
-- Run this ONCE in Supabase SQL Editor.
-- Inventory data is private to the authenticated owner through RLS.

create extension if not exists "uuid-ossp";

create table if not exists inv_locations (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  name text not null,
  address text,
  "isDefault" boolean default false
);

create table if not exists inv_units (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  name text not null,
  symbol text not null
);

create table if not exists inv_groups (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  name text not null,
  "parentId" uuid
);

create table if not exists inv_items (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  name text not null,
  sku text not null,
  "groupId" uuid,
  "unitId" uuid not null,
  description text,
  "minStockLevel" numeric default 0,
  "isBatchTracking" boolean default false,
  "purchasePrice" numeric default 0,
  "salesPrice" numeric default 0,
  "hsnCode" text,
  "taxRate" numeric default 0
);

create table if not exists inv_batches (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  "itemId" uuid not null,
  "batchNumber" text not null,
  "manufacturingDate" text,
  "expiryDate" text
);

create table if not exists inv_transactions (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  type text not null check (type in ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
  "itemId" uuid not null,
  "batchId" uuid,
  "locationId" uuid not null,
  "toLocationId" uuid,
  quantity numeric not null default 0,
  rate numeric not null default 0,
  amount numeric not null default 0,
  date text not null,
  reference text,
  "voucherId" uuid
);

alter table inv_locations add column if not exists "userId" uuid;
alter table inv_locations add column if not exists "companyId" uuid;
alter table inv_units add column if not exists "userId" uuid;
alter table inv_units add column if not exists "companyId" uuid;
alter table inv_groups add column if not exists "userId" uuid;
alter table inv_groups add column if not exists "companyId" uuid;
alter table inv_items add column if not exists "userId" uuid;
alter table inv_items add column if not exists "companyId" uuid;
alter table inv_batches add column if not exists "userId" uuid;
alter table inv_batches add column if not exists "companyId" uuid;
alter table inv_transactions add column if not exists "userId" uuid;
alter table inv_transactions add column if not exists "companyId" uuid;

alter table inv_locations enable row level security;
alter table inv_units enable row level security;
alter table inv_groups enable row level security;
alter table inv_items enable row level security;
alter table inv_batches enable row level security;
alter table inv_transactions enable row level security;

-- Locations
 drop policy if exists "Inventory locations select own" on inv_locations;
create policy "Inventory locations select own" on inv_locations for select using (auth.uid() = "userId");
drop policy if exists "Inventory locations insert own" on inv_locations;
create policy "Inventory locations insert own" on inv_locations for insert with check (auth.uid() = "userId");
drop policy if exists "Inventory locations update own" on inv_locations;
create policy "Inventory locations update own" on inv_locations for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
drop policy if exists "Inventory locations delete own" on inv_locations;
create policy "Inventory locations delete own" on inv_locations for delete using (auth.uid() = "userId");

-- Units
 drop policy if exists "Inventory units select own" on inv_units;
create policy "Inventory units select own" on inv_units for select using (auth.uid() = "userId");
drop policy if exists "Inventory units insert own" on inv_units;
create policy "Inventory units insert own" on inv_units for insert with check (auth.uid() = "userId");
drop policy if exists "Inventory units update own" on inv_units;
create policy "Inventory units update own" on inv_units for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
drop policy if exists "Inventory units delete own" on inv_units;
create policy "Inventory units delete own" on inv_units for delete using (auth.uid() = "userId");

-- Groups
 drop policy if exists "Inventory groups select own" on inv_groups;
create policy "Inventory groups select own" on inv_groups for select using (auth.uid() = "userId");
drop policy if exists "Inventory groups insert own" on inv_groups;
create policy "Inventory groups insert own" on inv_groups for insert with check (auth.uid() = "userId");
drop policy if exists "Inventory groups update own" on inv_groups;
create policy "Inventory groups update own" on inv_groups for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
drop policy if exists "Inventory groups delete own" on inv_groups;
create policy "Inventory groups delete own" on inv_groups for delete using (auth.uid() = "userId");

-- Items
 drop policy if exists "Inventory items select own" on inv_items;
create policy "Inventory items select own" on inv_items for select using (auth.uid() = "userId");
drop policy if exists "Inventory items insert own" on inv_items;
create policy "Inventory items insert own" on inv_items for insert with check (auth.uid() = "userId");
drop policy if exists "Inventory items update own" on inv_items;
create policy "Inventory items update own" on inv_items for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
drop policy if exists "Inventory items delete own" on inv_items;
create policy "Inventory items delete own" on inv_items for delete using (auth.uid() = "userId");

-- Batches
 drop policy if exists "Inventory batches select own" on inv_batches;
create policy "Inventory batches select own" on inv_batches for select using (auth.uid() = "userId");
drop policy if exists "Inventory batches insert own" on inv_batches;
create policy "Inventory batches insert own" on inv_batches for insert with check (auth.uid() = "userId");
drop policy if exists "Inventory batches update own" on inv_batches;
create policy "Inventory batches update own" on inv_batches for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
drop policy if exists "Inventory batches delete own" on inv_batches;
create policy "Inventory batches delete own" on inv_batches for delete using (auth.uid() = "userId");

-- Transactions
 drop policy if exists "Inventory transactions select own" on inv_transactions;
create policy "Inventory transactions select own" on inv_transactions for select using (auth.uid() = "userId");
drop policy if exists "Inventory transactions insert own" on inv_transactions;
create policy "Inventory transactions insert own" on inv_transactions for insert with check (auth.uid() = "userId");
drop policy if exists "Inventory transactions update own" on inv_transactions;
create policy "Inventory transactions update own" on inv_transactions for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
drop policy if exists "Inventory transactions delete own" on inv_transactions;
create policy "Inventory transactions delete own" on inv_transactions for delete using (auth.uid() = "userId");

create index if not exists inv_locations_user_company_idx on inv_locations ("userId", "companyId");
create index if not exists inv_units_user_company_idx on inv_units ("userId", "companyId");
create index if not exists inv_groups_user_company_idx on inv_groups ("userId", "companyId");
create index if not exists inv_items_user_company_idx on inv_items ("userId", "companyId");
create index if not exists inv_batches_user_company_idx on inv_batches ("userId", "companyId");
create index if not exists inv_batches_item_idx on inv_batches ("itemId");
create index if not exists inv_transactions_user_company_idx on inv_transactions ("userId", "companyId");
create index if not exists inv_transactions_item_idx on inv_transactions ("itemId");
create index if not exists inv_transactions_location_idx on inv_transactions ("locationId");

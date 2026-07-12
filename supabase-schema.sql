create extension if not exists "uuid-ossp";

-- Drop existing policies to prevent conflicts
drop policy if exists "Users can read their own companies" on companies;
drop policy if exists "Users can insert their own companies" on companies;
drop policy if exists "Users can update their own companies" on companies;
drop policy if exists "Users can delete their own companies" on companies;

drop policy if exists "Users can read their own ledgers" on ledgers;
drop policy if exists "Users can insert their own ledgers" on ledgers;
drop policy if exists "Users can update their own ledgers" on ledgers;
drop policy if exists "Users can delete their own ledgers" on ledgers;

drop policy if exists "Users can read their own vouchers" on vouchers;
drop policy if exists "Users can insert their own vouchers" on vouchers;
drop policy if exists "Users can update their own vouchers" on vouchers;
drop policy if exists "Users can delete their own vouchers" on vouchers;

drop policy if exists "Users can read their own bank_transactions" on bank_transactions;
drop policy if exists "Users can insert their own bank_transactions" on bank_transactions;
drop policy if exists "Users can update their own bank_transactions" on bank_transactions;
drop policy if exists "Users can delete their own bank_transactions" on bank_transactions;

-- Drop and recreate tables
drop table if exists bank_transactions cascade;
drop table if exists vouchers cascade;
drop table if exists ledgers cascade;
drop table if exists companies cascade;

create table companies (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null,
  name text not null,
  address text,
  gstin text,
  pan text,
  email text,
  phone text,
  "financialYearStart" text,
  "booksBeginFrom" text,
  settings jsonb,
  "isBanned" boolean default false,
  "banReason" text,
  license jsonb
);

create table ledgers (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null,
  "companyId" uuid references companies(id) on delete cascade,
  name text not null,
  "group" text,
  "openingBalance" numeric,
  address text,
  email text,
  "hsnCode" text,
  gstin text,
  "contactNo" text,
  "registrationType" text,
  "gstType" text,
  "cgstRate" numeric,
  "sgstRate" numeric,
  "igstRate" numeric,
  "isSystem" boolean default false
);

create table vouchers (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null,
  "companyId" uuid references companies(id) on delete cascade,
  type text not null,
  date text not null,
  number text,
  "partyId" uuid references ledgers(id) on delete cascade,
  "accountId" uuid,
  "totalAmount" numeric,
  "gstAmount" numeric,
  "cgstAmount" numeric,
  "sgstAmount" numeric,
  "igstAmount" numeric,
  "cgstRate" numeric,
  "sgstRate" numeric,
  "igstRate" numeric,
  "isSystem" boolean default false,
  "tdsAmount" numeric,
  narration text,
  "itemName" text,
  items jsonb
);

create table bank_transactions (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null,
  "companyId" uuid references companies(id) on delete cascade,
  date text not null,
  description text,
  amount numeric,
  type text,
  "isReconciled" boolean default false,
  "reconciliationDate" text,
  "instrumentNumber" text
);

-- Enable RLS
alter table companies enable row level security;
alter table ledgers enable row level security;
alter table vouchers enable row level security;
alter table bank_transactions enable row level security;

-- Policies
create policy "Users can read their own companies" on companies for select using (auth.uid() = "userId");
create policy "Users can insert their own companies" on companies for insert with check (auth.uid() = "userId");
create policy "Users can update their own companies" on companies for update using (auth.uid() = "userId");
create policy "Users can delete their own companies" on companies for delete using (auth.uid() = "userId");

create policy "Users can read their own ledgers" on ledgers for select using (auth.uid() = "userId");
create policy "Users can insert their own ledgers" on ledgers for insert with check (auth.uid() = "userId");
create policy "Users can update their own ledgers" on ledgers for update using (auth.uid() = "userId");
create policy "Users can delete their own ledgers" on ledgers for delete using (auth.uid() = "userId");

create policy "Users can read their own vouchers" on vouchers for select using (auth.uid() = "userId");
create policy "Users can insert their own vouchers" on vouchers for insert with check (auth.uid() = "userId");
create policy "Users can update their own vouchers" on vouchers for update using (auth.uid() = "userId");
create policy "Users can delete their own vouchers" on vouchers for delete using (auth.uid() = "userId");

create policy "Users can read their own bank_transactions" on bank_transactions for select using (auth.uid() = "userId");
create policy "Users can insert their own bank_transactions" on bank_transactions for insert with check (auth.uid() = "userId");
create policy "Users can update their own bank_transactions" on bank_transactions for update using (auth.uid() = "userId");
create policy "Users can delete their own bank_transactions" on bank_transactions for delete using (auth.uid() = "userId");

-- Realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime for table companies, ledgers, vouchers, bank_transactions;

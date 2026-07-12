create extension if not exists "uuid-ossp";

-- Supabase Schema for PFC Financials

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  "userId" text not null,
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

create table if not exists ledgers (
  id uuid primary key default uuid_generate_v4(),
  "userId" text not null,
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

create table if not exists vouchers (
  id uuid primary key default uuid_generate_v4(),
  "userId" text not null,
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

create table if not exists bank_transactions (
  id uuid primary key default uuid_generate_v4(),
  "userId" text not null,
  "companyId" uuid references companies(id) on delete cascade,
  date text not null,
  description text,
  amount numeric,
  type text,
  "isReconciled" boolean default false,
  "reconciliationDate" text,
  "instrumentNumber" text
);

-- Enable RLS and add policies
alter table companies enable row level security;
alter table ledgers enable row level security;
alter table vouchers enable row level security;
alter table bank_transactions enable row level security;

-- Policies for companies
create policy "Users can read their own companies" on companies for select using (auth.uid()::text = "userId");
create policy "Users can insert their own companies" on companies for insert with check (auth.uid()::text = "userId");
create policy "Users can update their own companies" on companies for update using (auth.uid()::text = "userId");
create policy "Users can delete their own companies" on companies for delete using (auth.uid()::text = "userId");

-- Policies for ledgers
create policy "Users can read their own ledgers" on ledgers for select using (auth.uid()::text = "userId");
create policy "Users can insert their own ledgers" on ledgers for insert with check (auth.uid()::text = "userId");
create policy "Users can update their own ledgers" on ledgers for update using (auth.uid()::text = "userId");
create policy "Users can delete their own ledgers" on ledgers for delete using (auth.uid()::text = "userId");

-- Policies for vouchers
create policy "Users can read their own vouchers" on vouchers for select using (auth.uid()::text = "userId");
create policy "Users can insert their own vouchers" on vouchers for insert with check (auth.uid()::text = "userId");
create policy "Users can update their own vouchers" on vouchers for update using (auth.uid()::text = "userId");
create policy "Users can delete their own vouchers" on vouchers for delete using (auth.uid()::text = "userId");

-- Policies for bank_transactions
create policy "Users can read their own bank_transactions" on bank_transactions for select using (auth.uid()::text = "userId");
create policy "Users can insert their own bank_transactions" on bank_transactions for insert with check (auth.uid()::text = "userId");
create policy "Users can update their own bank_transactions" on bank_transactions for update using (auth.uid()::text = "userId");
create policy "Users can delete their own bank_transactions" on bank_transactions for delete using (auth.uid()::text = "userId");

-- Turn on realtime for tables
alter publication supabase_realtime add table companies;
alter publication supabase_realtime add table ledgers;
alter publication supabase_realtime add table vouchers;
alter publication supabase_realtime add table bank_transactions;

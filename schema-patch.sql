-- Add missing columns to companies
alter table companies add column if not exists "createdAt" text;
alter table companies add column if not exists "updatedAt" text;
-- Add missing columns to ledgers
alter table ledgers add column if not exists "createdAt" text;
alter table ledgers add column if not exists "updatedAt" text;
-- Add missing columns to vouchers
alter table vouchers add column if not exists "createdAt" text;
alter table vouchers add column if not exists "updatedAt" text;
-- Add missing columns to bank_transactions
alter table bank_transactions add column if not exists "createdAt" text;
alter table bank_transactions add column if not exists "updatedAt" text;

-- paymentRequests
create table if not exists "paymentRequests" (
  id uuid primary key default uuid_generate_v4(),
  "companyId" text,
  "companyName" text,
  whatsapp text,
  "txnId" text,
  plan text,
  status text,
  "createdAt" text,
  "licenseKey" text
);

alter table "paymentRequests" enable row level security;
drop policy if exists "Enable all for paymentRequests" on "paymentRequests";
create policy "Enable all for paymentRequests" on "paymentRequests" for all using (true) with check (true);

-- validKeys
create table if not exists "validKeys" (
  id text primary key,
  "createdAt" text,
  "isActive" boolean default true
);

alter table "validKeys" enable row level security;
drop policy if exists "Enable all for validKeys" on "validKeys";
create policy "Enable all for validKeys" on "validKeys" for all using (true) with check (true);

-- realtime publications
alter publication supabase_realtime add table "paymentRequests";
alter publication supabase_realtime add table "validKeys";


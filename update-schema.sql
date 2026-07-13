alter table companies add column if not exists "createdAt" text;
alter table ledgers add column if not exists "createdAt" text;
alter table vouchers add column if not exists "createdAt" text;
alter table bank_transactions add column if not exists "createdAt" text;

create table if not exists "paymentRequests" (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid not null,
  "companyId" uuid references companies(id) on delete cascade,
  status text,
  "createdAt" text,
  amount numeric,
  "userEmail" text,
  "userName" text,
  "companyName" text
);

alter table "paymentRequests" enable row level security;
create policy "Users can read their own paymentRequests" on "paymentRequests" for select using (auth.uid() = "userId");
create policy "Users can insert their own paymentRequests" on "paymentRequests" for insert with check (auth.uid() = "userId");
create policy "Users can update their own paymentRequests" on "paymentRequests" for update using (auth.uid() = "userId");
create policy "Users can delete their own paymentRequests" on "paymentRequests" for delete using (auth.uid() = "userId");

alter publication supabase_realtime add table "paymentRequests";

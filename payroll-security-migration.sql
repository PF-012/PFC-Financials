-- PFC Financials Payroll security migration
-- Run this ONCE in Supabase SQL Editor.
-- It keeps employee and salary data private to the authenticated owner.

create extension if not exists "uuid-ossp";

create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  "employeeCode" text not null,
  name text not null,
  designation text not null,
  department text not null,
  "dateOfJoining" text not null,
  pan text,
  uan text,
  "pfNumber" text,
  "esiNumber" text,
  "bankName" text,
  "accountNumber" text,
  "ifscCode" text,
  "basicSalary" numeric default 0,
  hra numeric default 0,
  "conveyanceAllowance" numeric default 0,
  "medicalAllowance" numeric default 0,
  "specialAllowance" numeric default 0,
  "isActive" boolean default true,
  "deductPT" boolean default true
);

alter table employees add column if not exists "userId" uuid;
alter table employees add column if not exists "companyId" uuid;

create table if not exists "salarySlips" (
  id uuid primary key default uuid_generate_v4(),
  "userId" uuid,
  "companyId" uuid,
  "employeeId" uuid,
  month integer not null,
  year integer not null,
  basic numeric default 0,
  hra numeric default 0,
  conveyance numeric default 0,
  medical numeric default 0,
  special numeric default 0,
  "grossEarnings" numeric default 0,
  pf numeric default 0,
  esi numeric default 0,
  pt numeric default 0,
  tds numeric default 0,
  "otherDeductions" numeric default 0,
  "totalDeductions" numeric default 0,
  "netSalary" numeric default 0,
  "workingDays" numeric default 0,
  "presentDays" numeric default 0,
  leaves numeric default 0,
  "taxBreakdown" jsonb
);

alter table "salarySlips" add column if not exists "userId" uuid;
alter table "salarySlips" add column if not exists "companyId" uuid;

-- Enable RLS. Nothing becomes publicly writable.
alter table employees enable row level security;
alter table "salarySlips" enable row level security;

drop policy if exists "Users can read their own employees" on employees;
create policy "Users can read their own employees"
on employees for select
using (auth.uid() = "userId");

drop policy if exists "Users can insert their own employees" on employees;
create policy "Users can insert their own employees"
on employees for insert
with check (auth.uid() = "userId");

drop policy if exists "Users can update their own employees" on employees;
create policy "Users can update their own employees"
on employees for update
using (auth.uid() = "userId")
with check (auth.uid() = "userId");

drop policy if exists "Users can delete their own employees" on employees;
create policy "Users can delete their own employees"
on employees for delete
using (auth.uid() = "userId");

drop policy if exists "Users can read their own salary slips" on "salarySlips";
create policy "Users can read their own salary slips"
on "salarySlips" for select
using (auth.uid() = "userId");

drop policy if exists "Users can insert their own salary slips" on "salarySlips";
create policy "Users can insert their own salary slips"
on "salarySlips" for insert
with check (auth.uid() = "userId");

drop policy if exists "Users can update their own salary slips" on "salarySlips";
create policy "Users can update their own salary slips"
on "salarySlips" for update
using (auth.uid() = "userId")
with check (auth.uid() = "userId");

drop policy if exists "Users can delete their own salary slips" on "salarySlips";
create policy "Users can delete their own salary slips"
on "salarySlips" for delete
using (auth.uid() = "userId");

-- Helpful indexes for the payroll queries.
create index if not exists employees_user_company_idx on employees ("userId", "companyId");
create index if not exists salary_slips_user_company_idx on "salarySlips" ("userId", "companyId");
create index if not exists salary_slips_employee_idx on "salarySlips" ("employeeId");

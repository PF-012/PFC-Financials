alter table "validKeys" add column if not exists "used" boolean default false;
alter table "validKeys" add column if not exists "generatedForCompany" text;
alter table "validKeys" add column if not exists "plan" text;

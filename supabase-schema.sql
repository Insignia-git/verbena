create extension if not exists pgcrypto;

create table if not exists public.contest_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_code text not null unique,
  status text not null default 'NOWE',
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  city text,
  street text,
  house_number text,
  flat_number text,
  postal_code text,
  purchase_place text,
  purchase_date date,
  product_models text not null,
  attachment_path text,
  consent_rules boolean not null default false,
  consent_privacy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_contest_submissions_updated_at on public.contest_submissions;
create trigger trg_contest_submissions_updated_at
before update on public.contest_submissions
for each row
execute function public.set_updated_at();

alter table public.contest_submissions enable row level security;

drop policy if exists "anon insert submissions" on public.contest_submissions;
create policy "anon insert submissions"
on public.contest_submissions
for insert
to anon, authenticated
with check (consent_rules is true and consent_privacy is true);

drop policy if exists "service full submissions" on public.contest_submissions;
create policy "service full submissions"
on public.contest_submissions
for all
to service_role
using (true)
with check (true);

create or replace function public.check_submission_status(
  p_submission_code text,
  p_phone text
)
returns table (
  submission_code text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select cs.submission_code, cs.status, cs.created_at, cs.updated_at
  from public.contest_submissions cs
  where cs.submission_code = p_submission_code
    and cs.phone = p_phone
  limit 1;
$$;

grant execute on function public.check_submission_status(text, text) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('konkurs-zgloszenia', 'konkurs-zgloszenia', false)
on conflict (id) do nothing;

-- Uwaga: storage.objects jest tabelą systemową Supabase.
-- RLS jest zarządzane po stronie Storage i próba ALTER TABLE może zwracać:
-- "must be owner of table objects".

drop policy if exists "anon upload receipts" on storage.objects;
create policy "anon upload receipts"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'konkurs-zgloszenia');

drop policy if exists "service manage receipts" on storage.objects;
create policy "service manage receipts"
on storage.objects
for all
to service_role
using (bucket_id = 'konkurs-zgloszenia')
with check (bucket_id = 'konkurs-zgloszenia');

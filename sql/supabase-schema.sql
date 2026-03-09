create extension if not exists pgcrypto;

create table if not exists public.contest_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_code text not null unique,
  status text not null default 'NOWE',
  is_active boolean not null default true,
  approved boolean not null default false,
  is_favorite boolean not null default false,
  approved_at timestamptz,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  product_models text not null,
  attachment_path text,
  consent_rules boolean not null default false,
  consent_privacy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_access (
  id int primary key default 1,
  pass_hash text not null,
  updated_at timestamptz not null default now(),
  constraint admin_access_single_row check (id = 1)
);

insert into public.admin_access (id, pass_hash)
values (1, md5('CHANGE_ME_ADMIN_CODE'))
on conflict (id) do nothing;

drop function if exists public.admin_list_submissions(text);
drop function if exists public.admin_accept_submission(text, uuid);
drop function if exists public.admin_reject_submission(text, uuid);
drop function if exists public.admin_restore_submission(text, uuid);
drop function if exists public.admin_toggle_favorite(text, uuid);
drop function if exists public.admin_disable_submission(text, uuid);
drop function if exists public.admin_mark_checked(text, uuid);

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

create or replace function public.admin_list_submissions(
  p_admin_code text
)
returns table (
  id uuid,
  submission_code text,
  status text,
  is_active boolean,
  approved boolean,
  is_favorite boolean,
  approved_at timestamptz,
  first_name text,
  last_name text,
  phone text,
  email text,
  product_models text,
  attachment_path text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.admin_access aa
    where aa.id = 1
      and aa.pass_hash = md5(p_admin_code)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  return query
  select
    cs.id,
    cs.submission_code,
    cs.status,
    cs.is_active,
    cs.approved,
    cs.is_favorite,
    cs.approved_at,
    cs.first_name,
    cs.last_name,
    cs.phone,
    cs.email,
    cs.product_models,
    cs.attachment_path,
    cs.created_at,
    cs.updated_at
  from public.contest_submissions cs
  order by cs.created_at desc;
end;
$$;

create or replace function public.admin_accept_submission(
  p_admin_code text,
  p_submission_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.admin_access aa
    where aa.id = 1
      and aa.pass_hash = md5(p_admin_code)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.contest_submissions
  set approved = true,
      approved_at = now(),
      status = 'ZAAKCEPTOWANE'
  where id = p_submission_id
    and is_active = true;

  return found;
end;
$$;

create or replace function public.admin_reject_submission(
  p_admin_code text,
  p_submission_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.admin_access aa
    where aa.id = 1
      and aa.pass_hash = md5(p_admin_code)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.contest_submissions
  set is_active = false,
      approved = false,
      is_favorite = false,
      approved_at = null,
      status = 'ODRZUCONE'
  where id = p_submission_id;

  return found;
end;
$$;

create or replace function public.admin_restore_submission(
  p_admin_code text,
  p_submission_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.admin_access aa
    where aa.id = 1
      and aa.pass_hash = md5(p_admin_code)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.contest_submissions
  set is_active = true,
      approved = false,
      is_favorite = false,
      approved_at = null,
      status = 'NOWE'
  where id = p_submission_id
    and status = 'ODRZUCONE';

  return found;
end;
$$;

create or replace function public.admin_toggle_favorite(
  p_admin_code text,
  p_submission_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1
    from public.admin_access aa
    where aa.id = 1
      and aa.pass_hash = md5(p_admin_code)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.contest_submissions
  set is_favorite = not coalesce(is_favorite, false)
  where id = p_submission_id
    and status = 'ZAAKCEPTOWANE'
    and is_active = true;

  return found;
end;
$$;

grant execute on function public.admin_list_submissions(text) to anon, authenticated;
grant execute on function public.admin_accept_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_reject_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_restore_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_toggle_favorite(text, uuid) to anon, authenticated;

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

drop policy if exists "anon read receipts" on storage.objects;
create policy "anon read receipts"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'konkurs-zgloszenia');

drop policy if exists "service manage receipts" on storage.objects;
create policy "service manage receipts"
on storage.objects
for all
to service_role
using (bucket_id = 'konkurs-zgloszenia')
with check (bucket_id = 'konkurs-zgloszenia');

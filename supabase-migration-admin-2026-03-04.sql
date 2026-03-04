-- Migracja panelu admin (MVP)
-- Data: 2026-03-04

begin;

alter table if exists public.contest_submissions
  add column if not exists is_active boolean not null default true,
  add column if not exists approved boolean not null default false,
  add column if not exists approved_at timestamptz,
  add column if not exists checked_at timestamptz;

create table if not exists public.admin_access (
  id int primary key default 1,
  pass_hash text not null,
  updated_at timestamptz not null default now(),
  constraint admin_access_single_row check (id = 1)
);

insert into public.admin_access (id, pass_hash)
values (1, crypt('CHANGE_ME_ADMIN_CODE', gen_salt('bf')))
on conflict (id) do nothing;

create or replace function public.admin_list_submissions(
  p_admin_code text
)
returns table (
  id uuid,
  submission_code text,
  status text,
  is_active boolean,
  approved boolean,
  approved_at timestamptz,
  checked_at timestamptz,
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
      and aa.pass_hash = crypt(p_admin_code, aa.pass_hash)
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
    cs.approved_at,
    cs.checked_at,
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
      and aa.pass_hash = crypt(p_admin_code, aa.pass_hash)
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

create or replace function public.admin_disable_submission(
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
      and aa.pass_hash = crypt(p_admin_code, aa.pass_hash)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.contest_submissions
  set is_active = false,
      status = 'WYŁĄCZONE'
  where id = p_submission_id;

  return found;
end;
$$;

create or replace function public.admin_mark_checked(
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
      and aa.pass_hash = crypt(p_admin_code, aa.pass_hash)
  ) into v_ok;

  if not v_ok then
    raise exception 'UNAUTHORIZED';
  end if;

  update public.contest_submissions
  set checked_at = now(),
      status = case when status = 'NOWE' then 'SPRAWDZONE' else status end
  where id = p_submission_id
    and is_active = true;

  return found;
end;
$$;

grant execute on function public.admin_list_submissions(text) to anon, authenticated;
grant execute on function public.admin_accept_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_disable_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_mark_checked(text, uuid) to anon, authenticated;

drop policy if exists "anon read receipts" on storage.objects;
create policy "anon read receipts"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'konkurs-zgloszenia');

commit;

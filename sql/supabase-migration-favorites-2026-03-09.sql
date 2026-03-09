-- Migracja: pole ulubione + toggle w panelu admin
-- Data: 2026-03-09

begin;

alter table if exists public.contest_submissions
  add column if not exists is_favorite boolean not null default false;

drop function if exists public.admin_list_submissions(text);

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
grant execute on function public.admin_reject_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_restore_submission(text, uuid) to anon, authenticated;
grant execute on function public.admin_toggle_favorite(text, uuid) to anon, authenticated;

commit;

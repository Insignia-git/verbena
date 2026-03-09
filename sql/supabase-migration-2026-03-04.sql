-- Migracja do uproszczonego formularza konkursowego (regulamin 2026)
-- Data: 2026-03-04

begin;

-- Pola adresowo-zakupowe nie są już wymagane w formularzu.
alter table if exists public.contest_submissions
  alter column if exists city drop not null,
  alter column if exists street drop not null,
  alter column if exists house_number drop not null,
  alter column if exists postal_code drop not null,
  alter column if exists purchase_place drop not null,
  alter column if exists purchase_date drop not null;

-- Dodatkowe zabezpieczenie: odpowiedź konkursowa pozostaje wymagana.
alter table if exists public.contest_submissions
  alter column product_models set not null;

-- RPC statusu pozostaje bez zmian, ale tworzymy ponownie idempotentnie.
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

commit;

-- Migracja: usuniecie nieuzywanych pol formularza
-- Data: 2026-03-09

begin;

alter table if exists public.contest_submissions
  drop column if exists city,
  drop column if exists street,
  drop column if exists house_number,
  drop column if exists flat_number,
  drop column if exists postal_code,
  drop column if exists purchase_place,
  drop column if exists purchase_date,
  drop column if exists checked_at;

commit;

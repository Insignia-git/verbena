alter table if exists public.contest_submissions
  add column if not exists consent_marketing boolean not null default false;

drop policy if exists "anon insert submissions" on public.contest_submissions;
create policy "anon insert submissions"
on public.contest_submissions
for insert
to anon, authenticated
with check (
  consent_rules is true
  and consent_privacy is true
  and consent_marketing is true
);

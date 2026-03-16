-- Security fix: enable RLS on public.admin_access
-- Date: 2026-03-11

begin;

alter table if exists public.admin_access enable row level security;

drop policy if exists "service full admin access" on public.admin_access;
create policy "service full admin access"
on public.admin_access
for all
to service_role
using (true)
with check (true);

commit;

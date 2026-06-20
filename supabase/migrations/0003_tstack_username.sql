-- =====================================================================
-- T-Stack — username come identità visualizzata (al posto di nome/cognome).
-- Login resta con email; lo username è unico (case-insensitive).
-- =====================================================================

alter table tstack.profiles add column if not exists username text;

-- Unicità case-insensitive dello username
create unique index if not exists idx_profiles_username_lower
  on tstack.profiles (lower(username));

-- La vista dei saldi espone lo username (non più full_name)
drop view if exists tstack.team_balances;
create view tstack.team_balances as
select
  p.id   as user_id,
  p.username,
  p.role,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0) as total_income,
  coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0)  as total_expense,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0)
    - coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0) as balance
from tstack.profiles p
left join tstack.transactions t on t.owner_id = p.id
group by p.id, p.username, p.role;

alter view tstack.team_balances set (security_invoker = on);
grant select on tstack.team_balances to anon, authenticated, service_role;

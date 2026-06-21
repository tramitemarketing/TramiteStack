-- =====================================================================
-- T-Stack — colore identità per ogni membro (avatar coerente ovunque).
-- Colore scelto alla registrazione, distinto, salvato sul profilo.
-- =====================================================================

alter table tstack.profiles add column if not exists color text;

-- Backfill: assegna colori distinti ai profili senza colore (in ordine di creazione)
update tstack.profiles p
set color = palette.c[((r.rn) % 8) + 1]
from (
  select id, (row_number() over (order by created_at) - 1) as rn
  from tstack.profiles
  where color is null
) r,
(select array['#0F4C81','#7C5CD6','#1F8A5B','#2A78C2','#C8932B','#D8553F','#0E7C86','#B4458E'] as c) palette
where p.id = r.id;

-- La vista dei saldi espone anche il colore
drop view if exists tstack.team_balances;
create view tstack.team_balances as
select
  p.id   as user_id,
  p.username,
  p.color,
  p.role,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0) as total_income,
  coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0)  as total_expense,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0)
    - coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0) as balance
from tstack.profiles p
left join tstack.transactions t on t.owner_id = p.id
group by p.id, p.username, p.color, p.role;

alter view tstack.team_balances set (security_invoker = on);
grant select on tstack.team_balances to anon, authenticated, service_role;

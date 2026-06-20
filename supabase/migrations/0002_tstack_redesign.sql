-- =====================================================================
-- T-Stack v2 — ridisegno: priorità 1–5, bilancio personale (owner),
-- codice di registrazione ("nome collaborazione"), pulizia dati demo.
-- Tutto isolato nello schema `tstack`. Non tocca bussola/public.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Pulizia dati demo (task/clienti/progetti/movimenti + profili di test)
-- ---------------------------------------------------------------------
delete from tstack.transactions;
delete from tstack.attachments;
delete from tstack.calendar_events;
delete from tstack.tasks;
delete from tstack.projects;
delete from tstack.clients;
delete from tstack.notifications;
delete from tstack.profiles;  -- i profili reali si ricreano lazy al primo accesso

-- ---------------------------------------------------------------------
-- 2. Priorità numerica 1–5 per task e progetti
-- ---------------------------------------------------------------------
alter table tstack.tasks add column if not exists priority_level integer not null default 3
  check (priority_level between 1 and 5);
alter table tstack.tasks drop column if exists priority;
drop type if exists tstack.task_priority;

alter table tstack.projects add column if not exists priority_level integer not null default 3
  check (priority_level between 1 and 5);

-- ---------------------------------------------------------------------
-- 3. Bilancio personale: owner del movimento
-- ---------------------------------------------------------------------
alter table tstack.transactions
  add column if not exists owner_id uuid references tstack.profiles(id) on delete cascade;
create index if not exists idx_tx_owner on tstack.transactions(owner_id);

-- Saldo per dipendente (visibile a tutti)
create or replace view tstack.team_balances as
select
  p.id   as user_id,
  p.full_name,
  p.role,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0) as total_income,
  coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0)  as total_expense,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0)
    - coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0) as balance
from tstack.profiles p
left join tstack.transactions t on t.owner_id = p.id
group by p.id, p.full_name, p.role;

-- La vista rispetta la RLS delle tabelle sottostanti (no bypass per anon)
alter view tstack.team_balances set (security_invoker = on);

-- ---------------------------------------------------------------------
-- 4. Codice di registrazione ("nome collaborazione")
-- ---------------------------------------------------------------------
create table if not exists tstack.app_settings (
  id                boolean primary key default true check (id),
  registration_code text not null default 'TRAMITE2026',
  updated_at        timestamptz not null default now()
);
insert into tstack.app_settings (id, registration_code)
values (true, 'TRAMITE2026')
on conflict (id) do nothing;

alter table tstack.app_settings enable row level security;
drop policy if exists app_settings_admin on tstack.app_settings;
create policy app_settings_admin on tstack.app_settings
  for all using (tstack.is_admin()) with check (tstack.is_admin());

-- Verifica del codice senza esporre il valore (callable da anon in fase di registrazione)
create or replace function tstack.check_registration_code(p_code text)
returns boolean language sql stable security definer set search_path = tstack, public as $$
  select exists (
    select 1 from tstack.app_settings
    where id = true and registration_code = p_code
  );
$$;
revoke all on function tstack.check_registration_code(text) from public;
grant execute on function tstack.check_registration_code(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Grant (le nuove tabelle/viste seguono i default privileges già impostati)
-- ---------------------------------------------------------------------
grant select on tstack.team_balances to anon, authenticated, service_role;
grant all on tstack.app_settings to authenticated, service_role;

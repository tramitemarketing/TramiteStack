-- =====================================================================
-- T-Stack — archiviazione/storico (task completate e progetti completati).
-- =====================================================================
alter table tstack.tasks    add column if not exists archived_at  timestamptz;
alter table tstack.tasks    add column if not exists completed_at timestamptz;
alter table tstack.projects add column if not exists archived_at  timestamptz;
alter table tstack.projects add column if not exists completed_at timestamptz;
alter table tstack.profiles add column if not exists completed_tasks_count int not null default 0;

-- Storico dei progetti archiviati (solo il nome + date).
create table if not exists tstack.archived_projects (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  completed_at timestamptz,
  archived_at  timestamptz not null default now()
);
alter table tstack.archived_projects enable row level security;
drop policy if exists archived_projects_select on tstack.archived_projects;
create policy archived_projects_select on tstack.archived_projects
  for select using (tstack.is_active_member());
grant all on tstack.archived_projects to anon, authenticated, service_role;

-- Mantiene completed_at quando lo stato diventa/cessa 'completato' (task e progetti).
create or replace function tstack.set_completed_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'completato' and (old.status is distinct from 'completato') then
    new.completed_at := now();
  elsif new.status <> 'completato' then
    new.completed_at := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_task_completed on tstack.tasks;
create trigger trg_task_completed before update on tstack.tasks
  for each row execute function tstack.set_completed_at();
drop trigger if exists trg_project_completed on tstack.projects;
create trigger trg_project_completed before update on tstack.projects
  for each row execute function tstack.set_completed_at();

-- Backfill per i dati esistenti già completati.
update tstack.tasks    set completed_at = coalesce(completed_at, updated_at) where status = 'completato' and completed_at is null;
update tstack.projects set completed_at = coalesce(completed_at, updated_at) where status = 'completato' and completed_at is null;

-- Archivia le task completate oltre le 15 più recenti; +1 a ogni assegnatario.
create or replace function tstack.archive_completed_tasks()
returns void language plpgsql security definer set search_path = tstack, public as $$
declare arch uuid[];
begin
  select array_agg(id) into arch from (
    select id, row_number() over (order by coalesce(completed_at, updated_at) desc) rn
    from tstack.tasks
    where status = 'completato' and archived_at is null
  ) s where rn > 15;

  if arch is null then return; end if;

  update tstack.profiles p
  set completed_tasks_count = completed_tasks_count + cnt.c
  from (
    select uid, count(*) c
    from (select unnest(assignee_ids) uid from tstack.tasks where id = any(arch)) u
    group by uid
  ) cnt
  where p.id = cnt.uid;

  update tstack.tasks set archived_at = now() where id = any(arch);
end $$;

-- Archivia i progetti completati da più di 5 giorni; conserva il nome nello storico.
create or replace function tstack.archive_completed_projects()
returns void language plpgsql security definer set search_path = tstack, public as $$
begin
  insert into tstack.archived_projects (name, completed_at)
  select name, completed_at from tstack.projects
  where status = 'completato' and archived_at is null
    and completed_at is not null and completed_at < now() - interval '5 days';

  update tstack.projects set archived_at = now()
  where status = 'completato' and archived_at is null
    and completed_at is not null and completed_at < now() - interval '5 days';
end $$;

grant execute on function tstack.archive_completed_tasks() to authenticated, service_role;
grant execute on function tstack.archive_completed_projects() to authenticated, service_role;

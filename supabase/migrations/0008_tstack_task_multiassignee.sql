-- =====================================================================
-- T-Stack — assegnazione task a più persone (lista di id).
-- =====================================================================
alter table tstack.tasks add column if not exists assignee_ids uuid[] not null default '{}';

-- Backfill dalla colonna singola esistente.
update tstack.tasks
set assignee_ids = array[assignee_id]
where assignee_id is not null and assignee_ids = '{}';

create index if not exists idx_tasks_assignees on tstack.tasks using gin (assignee_ids);

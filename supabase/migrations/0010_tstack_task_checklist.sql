-- =====================================================================
-- T-Stack — checklist (sotto-voci) delle task.
-- =====================================================================
create table if not exists tstack.task_checklist (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tstack.tasks(id) on delete cascade,
  body       text not null,
  done       boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_checklist_task on tstack.task_checklist(task_id, position);

alter table tstack.task_checklist enable row level security;

drop policy if exists checklist_rw on tstack.task_checklist;
create policy checklist_rw on tstack.task_checklist
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());

grant all on tstack.task_checklist to anon, authenticated, service_role;

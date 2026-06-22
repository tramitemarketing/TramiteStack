-- =====================================================================
-- T-Stack — commenti sulle task.
-- =====================================================================
create table if not exists tstack.task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tstack.tasks(id) on delete cascade,
  author_id  uuid references tstack.profiles(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_task_comments_task on tstack.task_comments(task_id, created_at);

alter table tstack.task_comments enable row level security;

drop policy if exists task_comments_select on tstack.task_comments;
drop policy if exists task_comments_insert on tstack.task_comments;
drop policy if exists task_comments_delete on tstack.task_comments;

create policy task_comments_select on tstack.task_comments
  for select using (tstack.is_active_member());
create policy task_comments_insert on tstack.task_comments
  for insert with check (author_id = auth.uid() and tstack.is_active_member());
create policy task_comments_delete on tstack.task_comments
  for delete using (author_id = auth.uid() or tstack.is_admin());

grant all on tstack.task_comments to anon, authenticated, service_role;

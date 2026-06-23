-- =====================================================================
-- T-Stack — iscrizioni Web Push (una per dispositivo/browser).
-- =====================================================================
create table if not exists tstack.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references tstack.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_push_sub_user on tstack.push_subscriptions(user_id);

alter table tstack.push_subscriptions enable row level security;
drop policy if exists push_sub_own on tstack.push_subscriptions;
create policy push_sub_own on tstack.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

grant all on tstack.push_subscriptions to anon, authenticated, service_role;

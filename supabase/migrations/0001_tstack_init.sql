-- =====================================================================
-- T-Stack — Schema dedicato `tstack` dentro il progetto "bussola".
-- Convive con l'app esistente senza toccarne i dati: tutto è isolato nello
-- schema `tstack`. Auth condiviso (riuso di auth.users). RLS su tutte le
-- tabelle ("tutti i membri attivi vedono tutto"; admin gestisce i profili).
-- IMPORTANTE: non crea trigger/funzioni su oggetti condivisi (es. auth.users).
-- =====================================================================

create schema if not exists tstack;
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums (nello schema tstack)
-- ---------------------------------------------------------------------
do $$ begin
  create type tstack.user_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tstack.project_status as enum ('attivo', 'in_corso', 'completato', 'sospeso');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tstack.task_status as enum ('da_fare', 'in_corso', 'in_revisione', 'completato');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tstack.task_priority as enum ('bassa', 'media', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tstack.tx_type as enum ('entrata', 'uscita');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Funzione: updated_at automatico
-- ---------------------------------------------------------------------
create or replace function tstack.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- profiles (1:1 con auth.users) — riuso degli utenti esistenti
-- ---------------------------------------------------------------------
create table if not exists tstack.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        tstack.user_role not null default 'member',
  avatar_url  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on tstack.profiles;
create trigger trg_profiles_updated before update on tstack.profiles
  for each row execute function tstack.set_updated_at();

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
create table if not exists tstack.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_email text,
  phone         text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_clients_updated on tstack.clients;
create trigger trg_clients_updated before update on tstack.clients
  for each row execute function tstack.set_updated_at();

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists tstack.projects (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references tstack.clients(id) on delete set null,
  name          text not null,
  description   text,
  status        tstack.project_status not null default 'attivo',
  start_date    date,
  due_date      date,
  budget_amount numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_projects_client on tstack.projects(client_id);
create index if not exists idx_projects_status on tstack.projects(status);
drop trigger if exists trg_projects_updated on tstack.projects;
create trigger trg_projects_updated before update on tstack.projects
  for each row execute function tstack.set_updated_at();

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------
create table if not exists tstack.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references tstack.projects(id) on delete cascade,
  title       text not null,
  description text,
  status      tstack.task_status not null default 'da_fare',
  priority    tstack.task_priority not null default 'media',
  assignee_id uuid references tstack.profiles(id) on delete set null,
  due_date    date,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tasks_project on tstack.tasks(project_id);
create index if not exists idx_tasks_assignee on tstack.tasks(assignee_id);
create index if not exists idx_tasks_status on tstack.tasks(status);
drop trigger if exists trg_tasks_updated on tstack.tasks;
create trigger trg_tasks_updated before update on tstack.tasks
  for each row execute function tstack.set_updated_at();

-- ---------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------
create table if not exists tstack.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  all_day     boolean not null default false,
  project_id  uuid references tstack.projects(id) on delete cascade,
  task_id     uuid references tstack.tasks(id) on delete cascade,
  created_by  uuid references tstack.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_events_starts on tstack.calendar_events(starts_at);
drop trigger if exists trg_events_updated on tstack.calendar_events;
create trigger trg_events_updated before update on tstack.calendar_events
  for each row execute function tstack.set_updated_at();

-- ---------------------------------------------------------------------
-- transactions (cuore del bilancio)
-- ---------------------------------------------------------------------
create table if not exists tstack.transactions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references tstack.projects(id) on delete set null,
  type        tstack.tx_type not null,
  amount      numeric(12,2) not null check (amount >= 0),
  currency    text not null default 'EUR',
  description text,
  category    text,
  occurred_on date not null default current_date,
  created_by  uuid references tstack.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tx_project on tstack.transactions(project_id);
create index if not exists idx_tx_date on tstack.transactions(occurred_on);
drop trigger if exists trg_tx_updated on tstack.transactions;
create trigger trg_tx_updated before update on tstack.transactions
  for each row execute function tstack.set_updated_at();

-- ---------------------------------------------------------------------
-- attachments
-- ---------------------------------------------------------------------
create table if not exists tstack.attachments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references tstack.projects(id) on delete cascade,
  task_id     uuid references tstack.tasks(id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references tstack.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_attach_project on tstack.attachments(project_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists tstack.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references tstack.profiles(id) on delete cascade,
  type          text not null default 'promemoria',
  title         text not null,
  body          text,
  entity_type   text,
  entity_id     uuid,
  read_at       timestamptz,
  scheduled_for timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_notif_user on tstack.notifications(user_id, read_at);

-- =====================================================================
-- Viste per il bilancio
-- =====================================================================
create or replace view tstack.project_financials as
select
  p.id            as project_id,
  p.name          as project_name,
  p.client_id,
  p.status,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0) as total_income,
  coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0)  as total_expense,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0)
    - coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0) as margin
from tstack.projects p
left join tstack.transactions t on t.project_id = p.id
group by p.id, p.name, p.client_id, p.status;

create or replace view tstack.monthly_income as
select
  date_trunc('month', occurred_on)::date as month,
  coalesce(sum(amount) filter (where type = 'entrata'), 0) as income,
  coalesce(sum(amount) filter (where type = 'uscita'), 0)  as expense,
  coalesce(sum(amount) filter (where type = 'entrata'), 0)
    - coalesce(sum(amount) filter (where type = 'uscita'), 0) as net
from tstack.transactions
group by 1
order by 1;

-- Le viste rispettano la RLS delle tabelle sottostanti (no bypass per anon)
alter view tstack.project_financials set (security_invoker = on);
alter view tstack.monthly_income set (security_invoker = on);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table tstack.profiles        enable row level security;
alter table tstack.clients         enable row level security;
alter table tstack.projects        enable row level security;
alter table tstack.tasks           enable row level security;
alter table tstack.calendar_events enable row level security;
alter table tstack.transactions    enable row level security;
alter table tstack.attachments     enable row level security;
alter table tstack.notifications   enable row level security;

-- Helper: membro attivo del team T-Stack?
create or replace function tstack.is_active_member()
returns boolean language sql stable security definer set search_path = tstack, public as $$
  select exists (
    select 1 from tstack.profiles
    where id = auth.uid() and active = true
  );
$$;

-- Helper: admin T-Stack?
create or replace function tstack.is_admin()
returns boolean language sql stable security definer set search_path = tstack, public as $$
  select exists (
    select 1 from tstack.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- profiles
drop policy if exists profiles_select on tstack.profiles;
drop policy if exists profiles_update_self on tstack.profiles;
drop policy if exists profiles_insert_self on tstack.profiles;
drop policy if exists profiles_admin_all on tstack.profiles;
create policy profiles_select on tstack.profiles for select using (tstack.is_active_member());
create policy profiles_update_self on tstack.profiles for update using (id = auth.uid());
-- consente la creazione lazy del proprio profilo al primo accesso
create policy profiles_insert_self on tstack.profiles for insert with check (id = auth.uid());
create policy profiles_admin_all on tstack.profiles for all using (tstack.is_admin()) with check (tstack.is_admin());

-- Tabelle di lavoro condivise: ogni membro attivo legge e scrive tutto.
drop policy if exists clients_rw on tstack.clients;
create policy clients_rw on tstack.clients
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());
drop policy if exists projects_rw on tstack.projects;
create policy projects_rw on tstack.projects
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());
drop policy if exists tasks_rw on tstack.tasks;
create policy tasks_rw on tstack.tasks
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());
drop policy if exists events_rw on tstack.calendar_events;
create policy events_rw on tstack.calendar_events
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());
drop policy if exists transactions_rw on tstack.transactions;
create policy transactions_rw on tstack.transactions
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());
drop policy if exists attachments_rw on tstack.attachments;
create policy attachments_rw on tstack.attachments
  for all using (tstack.is_active_member()) with check (tstack.is_active_member());

-- notifications: ognuno gestisce solo le proprie.
drop policy if exists notifications_own on tstack.notifications;
create policy notifications_own on tstack.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Storage: bucket privato namespaced per gli allegati T-Stack
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('tstack-attachments', 'tstack-attachments', false)
on conflict (id) do nothing;

drop policy if exists "tstack attachments read" on storage.objects;
drop policy if exists "tstack attachments insert" on storage.objects;
drop policy if exists "tstack attachments delete" on storage.objects;
create policy "tstack attachments read" on storage.objects
  for select using (bucket_id = 'tstack-attachments' and tstack.is_active_member());
create policy "tstack attachments insert" on storage.objects
  for insert with check (bucket_id = 'tstack-attachments' and tstack.is_active_member());
create policy "tstack attachments delete" on storage.objects
  for delete using (bucket_id = 'tstack-attachments' and tstack.is_active_member());

-- =====================================================================
-- Esposizione dello schema all'API + grant (additivo, non tocca bussola)
-- =====================================================================
grant usage on schema tstack to anon, authenticated, service_role;
grant all on all tables in schema tstack to anon, authenticated, service_role;
grant all on all sequences in schema tstack to anon, authenticated, service_role;
grant execute on all routines in schema tstack to anon, authenticated, service_role;
alter default privileges in schema tstack grant all on tables to anon, authenticated, service_role;
alter default privileges in schema tstack grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema tstack grant execute on routines to anon, authenticated, service_role;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, tstack';
notify pgrst, 'reload config';

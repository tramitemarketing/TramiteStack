-- =====================================================================
-- T-Stack — Schema iniziale (TramiteMarketing)
-- Modello: Cliente -> Progetto -> Task, Bilancio per progetto, Calendario,
--          Allegati, Notifiche. RLS attivo ("tutti vedono tutto" tra utenti
--          autenticati e attivi; gestione utenti riservata all'admin).
-- =====================================================================

-- Estensioni utili
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('attivo', 'in_corso', 'completato', 'sospeso');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('da_fare', 'in_corso', 'in_revisione', 'completato');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('bassa', 'media', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tx_type as enum ('entrata', 'uscita');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Funzione: updated_at automatico
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- profiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        user_role not null default 'member',
  avatar_url  text,
  active       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Crea automaticamente un profilo quando nasce un utente auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_email text,
  phone         text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_clients_updated before update on clients
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references clients(id) on delete set null,
  name          text not null,
  description   text,
  status        project_status not null default 'attivo',
  start_date    date,
  due_date      date,
  budget_amount numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_projects_client on projects(client_id);
create index if not exists idx_projects_status on projects(status);
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  title       text not null,
  description text,
  status      task_status not null default 'da_fare',
  priority    task_priority not null default 'media',
  assignee_id uuid references profiles(id) on delete set null,
  due_date    date,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_assignee on tasks(assignee_id);
create index if not exists idx_tasks_status on tasks(status);
create trigger trg_tasks_updated before update on tasks
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------
create table if not exists calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  all_day     boolean not null default false,
  project_id  uuid references projects(id) on delete cascade,
  task_id     uuid references tasks(id) on delete cascade,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_events_starts on calendar_events(starts_at);
create trigger trg_events_updated before update on calendar_events
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- transactions (cuore del bilancio)
-- ---------------------------------------------------------------------
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete set null,
  type        tx_type not null,
  amount      numeric(12,2) not null check (amount >= 0),
  currency    text not null default 'EUR',
  description text,
  category    text,
  occurred_on date not null default current_date,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tx_project on transactions(project_id);
create index if not exists idx_tx_date on transactions(occurred_on);
create trigger trg_tx_updated before update on transactions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- attachments
-- ---------------------------------------------------------------------
create table if not exists attachments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  task_id     uuid references tasks(id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_attach_project on attachments(project_id);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  type          text not null default 'promemoria',
  title         text not null,
  body          text,
  entity_type   text,
  entity_id     uuid,
  read_at       timestamptz,
  scheduled_for timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_notif_user on notifications(user_id, read_at);

-- =====================================================================
-- Viste per il bilancio
-- =====================================================================

-- Riepilogo finanziario per progetto: entrate, uscite, margine
create or replace view project_financials as
select
  p.id            as project_id,
  p.name          as project_name,
  p.client_id,
  p.status,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0) as total_income,
  coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0)  as total_expense,
  coalesce(sum(t.amount) filter (where t.type = 'entrata'), 0)
    - coalesce(sum(t.amount) filter (where t.type = 'uscita'), 0) as margin
from projects p
left join transactions t on t.project_id = p.id
group by p.id, p.name, p.client_id, p.status;

-- Income mensile (entrate per mese) — utile per i lavori completati
create or replace view monthly_income as
select
  date_trunc('month', occurred_on)::date as month,
  coalesce(sum(amount) filter (where type = 'entrata'), 0) as income,
  coalesce(sum(amount) filter (where type = 'uscita'), 0)  as expense,
  coalesce(sum(amount) filter (where type = 'entrata'), 0)
    - coalesce(sum(amount) filter (where type = 'uscita'), 0) as net
from transactions
group by 1
order by 1;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table profiles        enable row level security;
alter table clients         enable row level security;
alter table projects        enable row level security;
alter table tasks           enable row level security;
alter table calendar_events enable row level security;
alter table transactions    enable row level security;
alter table attachments     enable row level security;
alter table notifications   enable row level security;

-- Helper: l'utente corrente è un membro attivo del team?
create or replace function is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and active = true
  );
$$;

-- Helper: l'utente corrente è admin?
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- profiles: tutti i membri attivi leggono i profili; ognuno aggiorna il proprio;
--           l'admin può gestire tutti i profili (creare/disattivare utenti).
create policy profiles_select on profiles for select using (is_active_member());
create policy profiles_update_self on profiles for update using (id = auth.uid());
create policy profiles_admin_all on profiles for all using (is_admin()) with check (is_admin());

-- Tabelle di lavoro condivise: ogni membro attivo legge e scrive tutto.
create policy clients_rw on clients
  for all using (is_active_member()) with check (is_active_member());
create policy projects_rw on projects
  for all using (is_active_member()) with check (is_active_member());
create policy tasks_rw on tasks
  for all using (is_active_member()) with check (is_active_member());
create policy events_rw on calendar_events
  for all using (is_active_member()) with check (is_active_member());
create policy transactions_rw on transactions
  for all using (is_active_member()) with check (is_active_member());
create policy attachments_rw on attachments
  for all using (is_active_member()) with check (is_active_member());

-- notifications: ognuno vede e gestisce solo le proprie.
create policy notifications_own on notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- Storage: bucket privato per gli allegati
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments read" on storage.objects
  for select using (bucket_id = 'attachments' and is_active_member());
create policy "attachments insert" on storage.objects
  for insert with check (bucket_id = 'attachments' and is_active_member());
create policy "attachments delete" on storage.objects
  for delete using (bucket_id = 'attachments' and is_active_member());

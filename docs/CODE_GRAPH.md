# Code Graph — T-Stack v2

Diagrammi dell'architettura, del modello dati e dei flussi (Mermaid).

## 1. Architettura

```mermaid
flowchart LR
  subgraph Device["📱 PWA (telefono/browser)"]
    UI["Next.js UI<br/>Server + Client Components<br/>framer-motion · @dnd-kit"]
  end
  subgraph Vercel["▲ Vercel (Next.js 16)"]
    Proxy["proxy.ts<br/>sessione + guardia rotte"]
    RSC["Server Components<br/>(lettura)"]
    SA["Server Actions<br/>(mutazioni + delete)"]
    API["/api/reminders<br/>(cron)"]
  end
  subgraph Supabase["🗄️ Supabase — progetto bussola"]
    Auth["Auth (condiviso)"]
    DB[("Postgres · schema tstack<br/>RLS + viste (security_invoker)")]
    Storage["Storage<br/>tstack-attachments"]
  end
  UI -->|HTTP| Proxy --> RSC --> DB
  UI -->|form action| SA --> DB
  UI -->|drag&drop → moveTask| SA
  Proxy --> Auth
  UI -->|upload| Storage
  API -->|service role| DB
```

## 2. Modello dati (ER)

```mermaid
erDiagram
  profiles ||--o{ tasks : "assegnatario (assignee_id)"
  profiles ||--o{ transactions : "owner (saldo personale)"
  profiles ||--o{ notifications : riceve
  projects ||--o{ tasks : contiene
  projects ||--o{ attachments : allega
  projects ||--o{ calendar_events : pianifica
  auth_users ||--|| profiles : "1:1 (lazy al login)"
  app_settings }o--|| profiles : "codice gestito da admin"

  profiles { uuid id PK; text full_name; user_role role; bool active }
  projects { uuid id PK; project_status status; int priority_level; date due_date }
  tasks { uuid id PK; uuid project_id FK; uuid assignee_id FK; task_status status; int priority_level; int position; date due_date }
  transactions { uuid id PK; uuid owner_id FK; tx_type type; numeric amount; date occurred_on }
  calendar_events { uuid id PK; timestamptz starts_at }
  attachments { uuid id PK; text file_path }
  notifications { uuid id PK; uuid user_id FK; timestamptz read_at }
  app_settings { bool id PK; text registration_code }
```

**Vista bilancio:** `tstack.team_balances` (per dipendente: entrate − uscite = saldo, RLS-safe).

## 3. Registrazione con "nome collaborazione"

```mermaid
sequenceDiagram
  participant U as Utente
  participant SA as signUp (Server Action)
  participant DB as tstack.check_registration_code
  participant Auth as Supabase Auth
  U->>SA: Nome, email, password, codice
  SA->>DB: rpc(check_registration_code, codice)
  alt codice valido
    SA->>Auth: signUp(email, password, {full_name})
    Auth-->>U: sessione (no conferma email) → /dashboard
  else codice errato
    SA-->>U: "Nome collaborazione non valido"
  end
```

## 4. Meccanismo di stato dei task (drag & drop)

```mermaid
flowchart LR
  Drag["Trascina card<br/>(@dnd-kit)"] --> Opt["Update ottimistico<br/>stato+posizione locale"]
  Opt --> Spin["Spinner sulla card"]
  Spin --> Move["moveTask(id,status,position)"]
  Move --> DB[("UPDATE tasks")]
  Move --> Rev["revalidatePath('/tasks')"]
  Rev --> Done["Spinner via, stato confermato"]
```

## 5. Mappa rotte

```mermaid
flowchart TD
  root["/"] -->|redirect| dash
  login["/login"] --- reg["/register"]
  subgraph app["(app) — protette dal proxy"]
    dash["/dashboard (Home: saldo + task oggi)"]
    tasks["/tasks (board dnd)"]
    cal["/calendar (bimensile)"]
    budget["/budget (saldi per dipendente)"]
    projects["/projects"] --> pnew["/projects/new"]
    projects --> pdet["/projects/[id]"]
    settings["/settings"]
  end
  api["/api/reminders (cron)"]
```

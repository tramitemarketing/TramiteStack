# Code Graph — T-Stack

Diagrammi dell'architettura, del modello dati e dei flussi principali (Mermaid).
GitHub li renderizza automaticamente.

## 1. Architettura

```mermaid
flowchart LR
  subgraph Device["📱 Telefono / Browser (PWA)"]
    UI["Next.js UI<br/>Server + Client Components"]
  end

  subgraph Vercel["▲ Vercel (Next.js 16)"]
    Proxy["proxy.ts<br/>refresh sessione + guardia rotte"]
    RSC["Server Components<br/>(lettura dati)"]
    SA["Server Actions<br/>(mutazioni)"]
    API["/api/reminders<br/>(cron promemoria)"]
  end

  subgraph Supabase["🗄️ Supabase"]
    Auth["Auth"]
    DB[("Postgres<br/>+ RLS + viste")]
    Storage["Storage<br/>bucket attachments"]
  end

  UI -->|HTTP| Proxy
  Proxy --> RSC
  UI -->|form action| SA
  RSC -->|anon key + sessione| DB
  SA -->|anon key + sessione| DB
  Proxy --> Auth
  UI -->|upload/download| Storage
  API -->|service role| DB
```

## 2. Modello dati (ER)

```mermaid
erDiagram
  profiles ||--o{ tasks : assegnatario
  profiles ||--o{ notifications : riceve
  clients  ||--o{ projects : ha
  projects ||--o{ tasks : contiene
  projects ||--o{ transactions : registra
  projects ||--o{ calendar_events : pianifica
  projects ||--o{ attachments : allega
  tasks    ||--o{ attachments : allega
  auth_users ||--|| profiles : "1:1 (trigger)"

  profiles {
    uuid id PK
    text full_name
    user_role role
    bool active
  }
  clients {
    uuid id PK
    text name
  }
  projects {
    uuid id PK
    uuid client_id FK
    project_status status
    numeric budget_amount
    date due_date
  }
  tasks {
    uuid id PK
    uuid project_id FK
    uuid assignee_id FK
    task_status status
    task_priority priority
    date due_date
  }
  transactions {
    uuid id PK
    uuid project_id FK
    tx_type type
    numeric amount
    date occurred_on
  }
  calendar_events {
    uuid id PK
    timestamptz starts_at
  }
  attachments {
    uuid id PK
    text file_path
  }
  notifications {
    uuid id PK
    uuid user_id FK
    timestamptz read_at
  }
```

**Viste bilancio:** `project_financials` (entrate − uscite = margine per progetto) e
`monthly_income` (income/expense/net per mese).

## 3. Flusso autenticazione (solo-invito)

```mermaid
sequenceDiagram
  participant U as Utente
  participant P as proxy.ts
  participant S as Supabase Auth
  U->>P: richiesta /dashboard
  P->>S: getUser() (da cookie)
  alt non autenticato
    P-->>U: redirect /login
    U->>S: signInWithPassword(email, pwd)
    S-->>U: sessione (cookie)
    U-->>P: redirect /dashboard
  else autenticato
    P-->>U: pagina servita
  end
  note over S: niente registrazione aperta:<br/>gli account li crea l'admin
```

## 4. Flusso mutazione (Server Action)

```mermaid
flowchart LR
  Form["<form action={createTask}>"] --> SA["Server Action<br/>app/(app)/actions.ts"]
  SA --> Sup["createClient() server"]
  Sup --> RLS{"RLS:<br/>membro attivo?"}
  RLS -->|sì| DB[("INSERT/UPDATE")]
  RLS -->|no| Deny["errore / negato"]
  SA --> Rev["revalidatePath()"]
  Rev --> UI["UI aggiornata"]
```

## 5. Mappa delle rotte

```mermaid
flowchart TD
  root["/"] -->|redirect| dash
  login["/login"]
  subgraph app["(app) — protette dal proxy"]
    dash["/dashboard"]
    tasks["/tasks (board)"]
    cal["/calendar"]
    budget["/budget"]
    projects["/projects"]
    pnew["/projects/new"]
    pdet["/projects/[id]"]
    clients["/clients"]
    cnew["/clients/new"]
    settings["/settings"]
  end
  api["/api/reminders (cron)"]
  projects --> pnew
  projects --> pdet
  clients --> cnew
```

## 6. Dipendenze tra moduli chiave

```mermaid
flowchart LR
  pages["app/(app)/*/page.tsx"] --> server["lib/supabase/server.ts"]
  pages --> auth["lib/auth.ts"]
  pages --> ui["components/ui.tsx"]
  pages --> actions["app/(app)/actions.ts"]
  auth --> server
  actions --> server
  proxy["proxy.ts"] --> pxlib["lib/supabase/proxy.ts"]
  attach["components/attachments-panel.tsx"] --> client["lib/supabase/client.ts"]
  server --> types["types/database.ts"]
  ui --> types
  actions --> types
```

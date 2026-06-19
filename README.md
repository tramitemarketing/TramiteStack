# T-Stack

App mobile-first (PWA) per i **4 dipendenti di TramiteMarketing**. Gestisce il lavoro in un
unico posto: **progetti & task**, **calendario** delle attività in corso e **bilancio per
progetto/cliente** (spese, guadagni, margini, income dei lavori completati).

> Installabile sul telefono come un'app ("Aggiungi a schermata Home"), una sola codebase,
> aggiornamenti istantanei, niente store.

## Funzionalità

- 🔐 **Accesso solo su invito** — gli account li crea l'amministratore (no registrazione aperta)
- 📁 **Progetti → Task** con stati (Da fare / In corso / In revisione / Completato), priorità, scadenze, assegnatari
- 🗂️ **Board task** in stile Kanban su tutti i progetti
- 📅 **Calendario** interno (vista mese) con eventi e scadenze
- 💶 **Bilancio per progetto/cliente** — entrate/uscite, margine, saldo mensile, income
- 📎 **Allegati** ai progetti (Supabase Storage)
- 🔔 **Promemoria** automatici per le scadenze (endpoint cron)
- 👀 **Tutti vedono tutto** (team di 4 persone) con RLS attivo su ogni tabella

## Stack

| | |
|---|---|
| Framework | **Next.js 16** (App Router, React 19, TypeScript) |
| UI | **Tailwind CSS v4**, mobile-first |
| Backend | **Supabase** (Postgres + Auth + Storage), Row Level Security |
| Hosting | **Vercel** |
| PWA | manifest nativo Next + icone (installabile) |

> ⚠️ **Next.js 16** ha rinominato `middleware.ts` in **`proxy.ts`**. Vedi `AGENTS.md`.

> 🗄️ **Database:** T-Stack usa il progetto Supabase **"bussola"** ma in uno **schema dedicato `tstack`**,
> per convivere senza conflitti con l'app già presente in quel progetto. I client impostano
> `db: { schema: 'tstack' }`. Bucket allegati: `tstack-attachments`.

## Avvio rapido

```bash
# 1. Dipendenze
npm install

# 2. Variabili d'ambiente
#    Le chiavi PUBBLICHE sono già in .env.production (progetto bussola).
#    Per lo sviluppo locale puoi copiarle in .env.local.
cp .env.production .env.local

# 3. Database: lo schema `tstack` è già applicato sul progetto bussola
#    (migration: supabase/migrations/0001_tstack_init.sql, dati demo: supabase/seed.sql)

# 4. Sviluppo
npm run dev        # http://localhost:3000

# 5. Build / qualità
npm run build
npm run lint
npm run typecheck
```

La guida completa di setup e d'uso è in **[docs/ISTRUZIONI.md](docs/ISTRUZIONI.md)**.

## Struttura

```
app/            Pagine (App Router): login, dashboard, projects, tasks, calendar, budget, clients, settings
components/     UI riutilizzabile (bottom-nav, card, badge, allegati)
lib/            Client Supabase (browser/server/proxy), auth, utils
supabase/       Migration SQL (schema + RLS + viste) e seed
types/          Tipi TypeScript del database
docs/           ISTRUZIONI · CODE_GRAPH (diagrammi) · CODE_REVIEW
proxy.ts        Protezione rotte + refresh sessione (ex middleware)
```

## Documentazione

- **[docs/ISTRUZIONI.md](docs/ISTRUZIONI.md)** — setup, deploy, creazione utenti, guida d'uso
- **[docs/CODE_GRAPH.md](docs/CODE_GRAPH.md)** — diagrammi architettura, modello dati, flussi
- **[docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)** — code review dello scaffold

## Roadmap (fasi future)

- ⏱️ Time tracking (ore per task/progetto) e profittabilità reale
- 📊 Dashboard con grafici e report mensili (Recharts)
- 🔄 Sync con Google Calendar
- 🔔 Push notification native
- 🧾 Preventivi / fatturazione

# T-Stack

App mobile-first (PWA) per i **dipendenti di TramiteMarketing**. Gestisce il lavoro in un unico
posto: **task** (board drag&drop con stati), **calendario**, **bilancio personale** di ogni
collaboratore e **progetti** con allegati.

> Installabile sul telefono ("Aggiungi a schermata Home"), una sola codebase, aggiornamenti
> istantanei, niente store.

## Funzionalità (v2)

- 🔐 **Login + Registrazione** con **username** e **"nome collaborazione"**: un codice condiviso
  (modificabile nel DB) che consente l'iscrizione solo ai veri dipendenti. Accesso con email +
  password; le persone sono identificate ovunque dallo **username**. Accesso immediato.
- 🏠 **Home**: saldo personale attuale + task in scadenza oggi.
- ✅ **Task**: board **trascinabile** su 4 colonne (Da fare / In corso / In revisione / Completato)
  con spostamento ottimistico e **spinner** durante il salvataggio; priorità **1–5**, scadenza,
  **assegnatario** ("chi è in carico"), cestino.
- 📅 **Calendario** bimensile navigabile, con **scadenze di task e progetti sincronizzate** e giorni
  cliccabili per il dettaglio.
- 💶 **Bilancio personale** per ogni dipendente (visibile a tutto il team); entrate/uscite per
  persona, cestino sui movimenti.
- 📁 **Progetti**: titolo, descrizione, priorità 1–5, stato, task collegati, **allegati**, cestino.
- ✨ Stile a **box distinti**, **animazioni** di apertura/espansione, **skeleton** di caricamento,
  palette + logo dedicati.
- 🔔 Promemoria in-app (push telefono "giorno prima" pianificata in fase 2).

## Stack

| | |
|---|---|
| Framework | **Next.js 16** (App Router, React 19, TypeScript) |
| UI | **Tailwind CSS v4** + **framer-motion** (animazioni) |
| Drag & drop | **@dnd-kit** (touch-friendly) |
| Backend | **Supabase** (Postgres + Auth + Storage), Row Level Security |
| Hosting | **Vercel** |

> ⚠️ **Next.js 16**: `middleware.ts` → **`proxy.ts`**. Vedi `AGENTS.md`.

> 🗄️ **Database:** progetto Supabase **"bussola"**, schema dedicato **`tstack`** (i client usano
> `db: { schema: 'tstack' }`). Bucket allegati: `tstack-attachments`. Lo schema convive senza
> conflitti con l'app già presente in quel progetto.

> 🔑 **Le chiavi NON sono nella repo.** Vanno configurate come variabili d'ambiente (vedi
> `.env.example` e `docs/ISTRUZIONI.md`).

## Avvio rapido

```bash
npm install
cp .env.example .env.local     # compila con i valori da Supabase → Project Settings → API
npm run dev                    # http://localhost:3000

npm run build                  # produzione
npm run lint
npm run typecheck
```

Setup completo (Supabase + Vercel + env) in **[docs/ISTRUZIONI.md](docs/ISTRUZIONI.md)**.

## Struttura

```
app/(app)/      dashboard · tasks · calendar · budget · projects · settings
app/login · app/register   autenticazione (codice collaborazione)
app/api/reminders          cron promemoria (service role)
components/     task-board (dnd) · create-task · calendar-view · ui · skeletons · bottom-nav · logo
lib/            supabase (browser/server/proxy) · auth · utils
supabase/migrations/  0001_tstack_init.sql · 0002_tstack_redesign.sql
types/          tipi del DB (schema tstack)
docs/           ISTRUZIONI (manuale) · CODE_GRAPH · CODE_REVIEW
```

## Documentazione

- **[docs/ISTRUZIONI.md](docs/ISTRUZIONI.md)** — manuale: Supabase, env, Vercel, uso
- **[docs/CODE_GRAPH.md](docs/CODE_GRAPH.md)** — diagrammi architettura/dati/flussi
- **[docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)** — code review

## Roadmap (fasi future)

- 🔔 Web Push reale "giorno prima" (chiavi VAPID)
- ⏱️ Time tracking ore · 📊 report mensili · 🔄 sync Google Calendar
- 💼 Economia di progetto (Prezzo vendita/Spese) se servirà

@AGENTS.md

# T-Stack — guida per lo sviluppo

App PWA mobile-first per i 4 dipendenti di TramiteMarketing: progetti & task, calendario,
bilancio per progetto/cliente. **Lingua UI: italiano. Valuta: EUR.**

## Stack & versioni (importante)
- **Next.js 16** (App Router, React 19, TypeScript) — **breaking change: `middleware.ts` → `proxy.ts`**.
- `cookies()` e `params` delle route dinamiche sono **asincroni** (`await`).
- **Tailwind CSS v4** — sintassi `@import "tailwindcss"` + `@theme` in `app/globals.css` (niente `tailwind.config`).
- **Supabase** per DB/Auth/Storage con **Row Level Security** su tutte le tabelle.
- **DB condiviso**: progetto Supabase **"bussola"** (`bxmatbhaxkdsuzcojesj`), ma T-Stack vive in uno
  **schema dedicato `tstack`** per non collidere con l'app già presente. I client Supabase impostano
  `db: { schema: 'tstack' }`; le query `.from('...')` restano invariate. Bucket storage: `tstack-attachments`.
- Niente font Google a build-time (si usano font di sistema) per evitare dipendenze di rete.

## Comandi
```bash
npm run dev        # sviluppo
npm run build      # build produzione (deve restare verde)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
node scripts/gen-icons.mjs   # rigenera le icone PWA
```

## Convenzioni
- **Lettura dati**: nei Server Component via `lib/supabase/server.ts` (`createClient()` async).
- **Mutazioni**: Server Actions in `app/(app)/actions.ts` (`'use server'`) + `revalidatePath`.
- **Client Component**: solo quando serve interattività (es. upload allegati, form login) via `lib/supabase/client.ts`.
- Le pagine che leggono dati usano `export const dynamic = 'force-dynamic'`.
- Tipi del DB in `types/database.ts` — tenere allineati alla migration SQL.
- Etichette/stati in italiano centralizzati in `types/database.ts` (es. `TASK_STATUS_LABEL`).

## Mappa cartelle
- `app/login/` — login solo-invito + `actions.ts` (signIn/signOut)
- `app/(app)/` — area autenticata (layout con bottom-nav); `actions.ts` = mutazioni condivise
- `app/api/reminders/` — cron promemoria (usa `SUPABASE_SERVICE_ROLE_KEY`, protetto da `CRON_SECRET`)
- `lib/supabase/` — `client` (browser), `server` (SSR), `proxy` (sessione/route guard)
- `supabase/migrations/0001_tstack_init.sql` — **fonte di verità** dello schema `tstack` + RLS + viste bilancio + grant/esposizione schema
- `components/` — `bottom-nav`, `ui` (Card/Badge/…), `attachments-panel`, `sign-out-button`

## Sicurezza
- Mai esporre `SUPABASE_SERVICE_ROLE_KEY` al client (solo route handler/script).
- Le policy RLS assumono utente autenticato e `active = true`; gestione utenti riservata a `role = 'admin'`.

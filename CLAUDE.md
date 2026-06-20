@AGENTS.md

# T-Stack — guida per lo sviluppo

App PWA mobile-first per i dipendenti di TramiteMarketing: task (board drag&drop), calendario,
bilancio **personale** per dipendente, progetti con allegati. **Lingua UI: italiano. Valuta: EUR.**

## Funzionalità chiave (v2)
- Auth **Login + Register** con **username** + "nome collaborazione" (codice in `tstack.app_settings`,
  verificato da `tstack.check_registration_code` SECURITY DEFINER). Login via email; conferma email
  disattivata su Supabase. Le persone si mostrano ovunque con `profiles.username` (unico).
- **Task board** trascinabile (`@dnd-kit`) a 4 stati con update ottimistico + spinner (`components/task-board.tsx`).
- Priorità **1–5** (`priority_level`) su task e progetti. Assegnatario task = `assignee_id`.
- **Bilancio personale**: `transactions.owner_id` → vista `tstack.team_balances` (saldo per dipendente, RLS-safe via `security_invoker`).
- Animazioni `framer-motion` (`app/(app)/template.tsx`, modali), skeleton (`components/skeletons.tsx` + `loading.tsx`).
- Eliminazioni (cestino) per task/progetti/eventi/movimenti in `app/(app)/actions.ts`.

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
- `app/login/`, `app/register/` — auth; server actions in `app/login/actions.ts` (signIn/signUp/signOut)
- `app/(app)/` — area autenticata (bottom-nav: Home/Task/Calendario/Bilancio/Progetti); `actions.ts` = mutazioni
- `app/api/reminders/` — cron promemoria (`SUPABASE_SERVICE_ROLE_KEY`, protetto da `CRON_SECRET`)
- `lib/supabase/` — `client` (browser), `server` (SSR), `proxy` (sessione/route guard). Tutti con `db.schema='tstack'`.
- `supabase/migrations/` — `0001_tstack_init.sql` + `0002_tstack_redesign.sql` (**fonte di verità** schema `tstack`)
- `components/` — `task-board`, `create-task`, `calendar-view`, `ui`, `skeletons`, `bottom-nav`, `logo`, `attachments-panel`, `sign-out-button`

## Sicurezza
- Mai esporre `SUPABASE_SERVICE_ROLE_KEY` al client. **Nessuna chiave nella repo** (solo env; `.env.example` è un template).
- RLS su tutte le tabelle `tstack` (utente autenticato e `active = true`); viste con `security_invoker = on`.
- `tstack.check_registration_code` è callable da `anon` ma ritorna solo true/false (non espone il codice).

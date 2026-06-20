# Code Review — T-Stack v2

Revisione del ridisegno. Stato: **build ✓, lint ✓, typecheck ✓**, migration applicate su bussola,
advisor di sicurezza puliti per lo schema `tstack`.
Legenda: 🔴 alta · 🟡 media · 🟢 bassa/nota.

## Sintesi
Ridisegno coerente con il documento: nuova IA (Home/Task/Calendario/Bilancio/Progetti), board
drag&drop con meccanismo di stato curato (ottimistico + spinner), bilancio personale per dipendente,
auth con codice di collaborazione, stile a box con animazioni e skeleton. Isolamento da bussola
mantenuto (schema `tstack`, nessun oggetto condiviso toccato).

## Punti di forza
- **Sicurezza dati:** RLS su tutte le tabelle `tstack`; **viste con `security_invoker = on`** così i
  saldi non sono leggibili da `anon` (corretto in fase di review). `check_registration_code` espone
  solo un booleano.
- **UX stato task:** update ottimistico + spinner sulla card durante il salvataggio; ordinamento
  persistito con `position`; `@dnd-kit` funziona anche su touch (PWA).
- **Niente segreti nella repo:** chiavi solo via env; `.env.example` come template.
- **Coerenza schema:** il codice usa `.from('...')` invariato grazie a `db.schema='tstack'`.

## Findings
### 🟡 Ordinamento fine tra le card
Il drag aggiorna stato e posizione "in coda" alla colonna; il riordino preciso (drop in mezzo a due
card) non è ancora gestito. Per ora sufficiente; in futuro usare `@dnd-kit/sortable` con reindex.

### 🟡 Conferma email è un passo manuale
L'"accesso immediato" dipende dalla disattivazione di *Confirm email* su Supabase (non esiste tool
MCP per cambiarla): documentato in `docs/ISTRUZIONI.md` §A.2. Senza, la registrazione non dà sessione.

### 🟢 Reminders solo task
`/api/reminders` genera promemoria per le scadenze task; gli eventi calendario e la **push reale
"giorno prima"** (VAPID + service worker) sono pianificati in fase 2.

### 🟢 Eliminazioni senza conferma modale
Il cestino elimina direttamente (con revalidate). Valutare una conferma per progetti (cascade su task).

### 🟢 Validazione input minimale
Le Server Actions validano l'essenziale; in futuro **Zod** per messaggi d'errore ricchi.

### 🟢 Advisor preesistenti di bussola
Restano alcuni warning su funzioni `public.*` di bussola e su *Leaked Password Protection*: non
appartengono a T-Stack e non vanno modificati qui (eventualmente abilitare la protezione password a
livello progetto).

## Sicurezza — checklist
- [x] RLS su tutte le tabelle `tstack`; notifiche ristrette al proprietario
- [x] Viste `security_invoker = on` (no bypass RLS per anon)
- [x] `service_role` solo server-side; nessuna chiave nella repo
- [x] Bucket `tstack-attachments` privato, policy per membri attivi
- [x] `check_registration_code` SECURITY DEFINER ma ritorna solo booleano
- [x] Funzioni con `search_path` impostato

## Prossimi passi
1. Disattivare *Confirm email* + impostare il codice di registrazione (vedi manuale).
2. Deploy Vercel con le env (tenute dall'utente).
3. Fase 2: Web Push "giorno prima", riordino fine card, conferme di eliminazione, Zod.

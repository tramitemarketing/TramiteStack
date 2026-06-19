# Code Review — T-Stack (scaffold iniziale)

Revisione dello scaffold MVP. Stato: **build ✓, lint ✓, typecheck ✓**.
Legenda severità: 🔴 alta · 🟡 media · 🟢 bassa/nota.

## Sintesi
Base solida e coerente: separazione netta tra lettura (Server Components) e scrittura
(Server Actions), RLS attiva su tutte le tabelle, tipi del DB centralizzati, UI mobile-first.
Adatta a un team di 4 persone. Le note sotto sono migliorie incrementali, non bloccanti.

---

## Punti di forza
- **Sicurezza dati alla fonte:** RLS su ogni tabella + funzioni helper `is_active_member()` /
  `is_admin()` in `SECURITY DEFINER` per evitare ricorsione nelle policy di `profiles`.
- **Segreti gestiti bene:** `service_role` usato solo nel route handler `/api/reminders`, mai nel client.
- **Allineamento a Next 16:** uso corretto di `proxy.ts`, `await cookies()`, `params` async.
- **Niente dipendenze di rete a build-time** (font di sistema) → build riproducibile.
- **Modello dati pulito** con viste (`project_financials`, `monthly_income`) che spostano il calcolo
  del bilancio nel DB invece che nel client.

---

## Findings

### 🔴 (risolto) Conteggio "Task in corso" sempre a zero — `app/(app)/dashboard/page.tsx`
La query usava `{ head: true, count: 'exact' }` ma il valore veniva letto da `data.length`
(sempre `null`/0). **Corretto** leggendo `count` dalla risposta. *Lezione:* con `head:true` i
dati non tornano, solo `count`.

### 🟡 N+1 nel cron promemoria — `app/api/reminders/route.ts`
Per ogni task si esegue una query di de-duplica separata. A questa scala (decine di task) è
irrilevante, ma con la crescita conviene una singola query con `not in (...)` o un indice/vincolo
unico su `(entity_type, entity_id)` filtrando le notifiche non lette.

### 🟡 Accessibilità: zoom disabilitato — `app/layout.tsx`
`viewport` imposta `maximumScale: 1, userScalable: false` (utile per evitare zoom involontari su
iOS nei form, ma limita l'accessibilità). Valutare di riabilitare lo zoom se richiesto.

### 🟢 UX cambio stato con doppio passaggio — board task e dettaglio progetto
Cambiare stato richiede di selezionare e premere "OK". Va bene per l'MVP; in futuro si può
auto-inviare al cambio (`onChange`) o introdurre drag & drop sulla board.

### 🟢 Sanitizzazione nome file allegati — `components/attachments-panel.tsx`
Il path storage usa `Date.now()-file.name`. Supabase gestisce la maggior parte dei caratteri, ma
conviene normalizzare il nome (spazi/accenti) per URL più puliti.

### 🟢 Validazione input minimale — Server Actions
Le action validano l'essenziale (campi obbligatori, importi > 0) ma non con uno schema.
Per robustezza futura si può introdurre **Zod** e messaggi d'errore in UI.

### 🟢 Nessun test automatico
Non ci sono ancora test. Per le parti critiche (viste bilancio, policy RLS) si consigliano test di
integrazione contro un Supabase locale.

---

## Sicurezza — checklist
- [x] RLS abilitata su tutte le tabelle applicative
- [x] Policy `notifications` ristretta al proprietario (`user_id = auth.uid()`)
- [x] `service_role` solo server-side, endpoint cron protetto da `CRON_SECRET`
- [x] Bucket `attachments` **privato** con policy per soli membri attivi
- [x] Messaggi di login generici (no user enumeration)
- [ ] (consigliato) Eseguire `get_advisors` su Supabase dopo il deploy per security/performance lint

---

## Prossimi passi consigliati
1. Provisioning Supabase + applicare `0001_init.sql`, poi rigenerare i tipi (`generate_typescript_types`)
   per sostituire i tipi scritti a mano in `types/database.ts`.
2. Deploy su Vercel con le env e schedulare il cron `/api/reminders`.
3. Aggiungere validazione con Zod e qualche test sulle viste bilancio.
4. Roadmap funzionale: time tracking, dashboard con grafici, sync Google Calendar.

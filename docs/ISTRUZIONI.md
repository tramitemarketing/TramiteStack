# Istruzioni T-Stack

Guida pratica per mettere in piedi l'app e usarla. Due parti:
**A) Setup tecnico** (una volta sola) · **B) Uso quotidiano** (per i dipendenti).

---

## A) Setup tecnico

### 1. Creare il progetto Supabase
1. Vai su [supabase.com](https://supabase.com) → **New project** (regione EU consigliata, es. Frankfurt).
2. Annota la **Database password**.
3. Da **Project Settings → API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (segreta) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Creare lo schema del database
1. Apri **SQL Editor** nella dashboard Supabase.
2. Incolla **tutto** il contenuto di `supabase/migrations/0001_init.sql` ed esegui (**Run**).
   - Crea tabelle, viste bilancio, trigger, **RLS** e il bucket `attachments`.
3. (Facoltativo) Per dati di esempio esegui `supabase/seed.sql` **dopo** aver creato almeno un utente.

> In alternativa, con la Supabase CLI: `supabase db push` (richiede progetto collegato).

### 3. Configurare le variabili d'ambiente
```bash
cp .env.example .env.local
```
Compila `.env.local` con i valori del punto 1. Imposta anche un `CRON_SECRET` a piacere.

### 4. Avviare in locale
```bash
npm install
npm run dev      # http://localhost:3000
```

### 5. Deploy su Vercel
1. Collega il repo GitHub su [vercel.com](https://vercel.com) → **New Project**.
2. In **Environment Variables** inserisci le stesse variabili di `.env.local`.
3. Deploy. Vercel assegna un dominio `*.vercel.app` (collegabile a un dominio custom).
4. **Cron promemoria** (facoltativo): aggiungi un Vercel Cron Job che chiama
   `GET /api/reminders` con header `Authorization: Bearer <CRON_SECRET>` (es. ogni mattina).

### 6. Creare i 4 account (solo invito)
L'app **non** ha registrazione aperta. L'admin crea gli utenti:

**Opzione semplice (dashboard):**
1. Supabase → **Authentication → Users → Add user**.
2. Inserisci email + password e crea. Il profilo nasce in automatico (trigger `on_auth_user_created`).
3. Comunica le credenziali al dipendente (che potrà poi cambiare password).

**Rendere admin un utente:** nel **SQL Editor**:
```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu@tramitemarketing.it');
```

**Disattivare un dipendente** (toglie l'accesso ai dati senza cancellarlo):
```sql
update profiles set active = false where id = '<user-id>';
```

### 7. Installare l'app sul telefono (PWA)
- **iPhone (Safari):** apri il sito → Condividi → *Aggiungi a Home*.
- **Android (Chrome):** apri il sito → menu ⋮ → *Installa app / Aggiungi a Home*.

---

## B) Uso quotidiano (dipendenti)

- **Accesso:** apri T-Stack, inserisci email e password ricevute dall'admin.
- **Home (Dashboard):** colpo d'occhio su scadenze di oggi, task in corso e saldo del mese.
- **Progetti:** crea un progetto, scegli il cliente, imposta budget e scadenza.
  Dentro al progetto gestisci **task**, **movimenti** (entrate/uscite) e **allegati**.
- **Task:** la board mostra tutti i task per stato. Cambia stato con il menù a tendina → **OK**.
- **Calendario:** vista del mese; aggiungi eventi e vedi i giorni con scadenze (pallino).
- **Bilancio:** entrate/uscite del mese, **margine per progetto**, ultimi movimenti.
  Registra un movimento (anche "Generale", non legato a un progetto).
- **Clienti:** anagrafica con contatti e note.
- **Impostazioni:** profilo, elenco team; l'admin trova le note per gestire gli utenti.

> **Nota:** tutti i 4 utenti vedono tutto (task, calendario, bilancio). Le notifiche personali
> (promemoria scadenze) sono invece private di ciascun utente.

---

## Risoluzione problemi
- **Non riesco ad accedere:** verifica che l'account sia stato creato dall'admin e che `active = true`.
- **Pagina vuota / errori dati:** controlla che le variabili `NEXT_PUBLIC_SUPABASE_*` siano corrette
  e che la migration sia stata eseguita.
- **Upload allegati non funziona:** assicurati che la migration abbia creato il bucket `attachments`
  e le relative policy di storage.

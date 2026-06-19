# Istruzioni T-Stack

Guida pratica per mettere in piedi l'app e usarla. Due parti:
**A) Setup tecnico** (una volta sola) · **B) Uso quotidiano** (per i dipendenti).

---

## A) Setup tecnico

> ⚙️ **Già fatto per te:** lo schema `tstack` è stato creato sul progetto Supabase **"bussola"**
> (`bxmatbhaxkdsuzcojesj`), con tabelle, viste bilancio, RLS, bucket `tstack-attachments`, dati demo
> e profili per gli utenti esistenti. Le chiavi pubbliche sono in `.env.production`. I passi sotto
> servono solo per ricreare l'ambiente altrove o per capire com'è configurato.

### 1. Database (progetto "bussola", schema dedicato `tstack`)
T-Stack **non usa un progetto nuovo**: vive nello schema `tstack` dentro il progetto bussola, così
da non interferire con l'app già presente. Per (ri)applicarlo:
1. **SQL Editor** della dashboard Supabase → incolla `supabase/migrations/0001_tstack_init.sql` → **Run**.
   Crea schema `tstack`, tabelle, viste, **RLS**, bucket `tstack-attachments`, grant ed **espone lo
   schema all'API** (`pgrst.db_schemas = 'public, graphql_public, tstack'`).
2. (Facoltativo) Dati demo: esegui `supabase/seed.sql`.

> Lo schema `tstack` è esposto all'API; i client Supabase usano `db: { schema: 'tstack' }` (già nel codice).

### 2. Variabili d'ambiente
- Le **chiavi pubbliche** (URL + anon key del progetto bussola) sono già in **`.env.production`**
  (sicure: protette da RLS). Per il locale: `cp .env.production .env.local`.
- Per il **cron promemoria** servono, da impostare nelle env di Vercel (segrete):
  `SUPABASE_SERVICE_ROLE_KEY` (Dashboard → Project Settings → API) e un `CRON_SECRET` a piacere.

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

> Il profilo T-Stack viene creato **in automatico al primo accesso** (lazy). In più, un profilo
> esiste già per gli utenti presenti nel progetto. Tabella: `tstack.profiles`.

**Rendere admin un utente:** nel **SQL Editor**:
```sql
update tstack.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu@tramitemarketing.it');
```

**Disattivare un dipendente** (toglie l'accesso ai dati di T-Stack senza cancellare l'account):
```sql
update tstack.profiles set active = false where id = '<user-id>';
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
- **Upload allegati non funziona:** assicurati che la migration abbia creato il bucket
  `tstack-attachments` e le relative policy di storage.
- **Errori "schema must be one of...":** verifica che lo schema `tstack` sia esposto all'API
  (la migration lo fa con `alter role authenticator set pgrst.db_schemas = ...; notify pgrst, ...`).

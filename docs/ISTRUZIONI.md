# Manuale T-Stack

Guida completa per configurare e usare T-Stack.
**A) Setup tecnico** (una volta) · **B) Variabili d'ambiente** · **C) Deploy Vercel** · **D) Uso quotidiano**.

---

## A) Setup tecnico (Supabase)

T-Stack vive nel progetto Supabase **"bussola"** (`bxmatbhaxkdsuzcojesj`) in uno **schema dedicato
`tstack`**, isolato dall'app già presente. Lo schema, le tabelle, RLS, viste, il bucket allegati e i
dati base **sono già stati creati**. I passi qui servono per capire la configurazione o ricrearla.

### 1. Schema del database
Le migration sono in `supabase/migrations/`:
- `0001_tstack_init.sql` — schema, tabelle, RLS, viste, bucket `tstack-attachments`, esposizione API.
- `0002_tstack_redesign.sql` — priorità 1–5, bilancio personale (owner), codice di registrazione, pulizia demo.

Per (ri)applicarle: Supabase → **SQL Editor** → incolla il contenuto dei file in ordine → **Run**.

### 2. Disattivare la conferma email (accesso immediato) ⚠️ OBBLIGATORIO
Senza questo passo la registrazione **non** dà accesso (il login risulterà "rotto").
Supabase → **Authentication → Sign In / Providers → Email** → disattiva **"Confirm email"** → salva.

### 3. Impostare il "nome collaborazione" (codice di registrazione)
È il codice condiviso che abilita solo i dipendenti veri a registrarsi.
- Valore iniziale: **`TRAMITE2026`** (cambialo!).
- Da **app** (consigliato): accedi come **admin** → **Impostazioni → Nome collaborazione** → modifica.
- Da **SQL**:
  ```sql
  update tstack.app_settings set registration_code = 'IL_TUO_CODICE' where id = true;
  ```

### 4. Promuovere un amministratore
Il profilo si crea da solo al primo accesso. Per renderlo admin:
```sql
update tstack.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu@tramitemarketing.it');
```
Disattivare un collaboratore (gli toglie l'accesso ai dati senza cancellare l'account):
```sql
update tstack.profiles set active = false where id = '<user-id>';
```

---

## B) Variabili d'ambiente (le tieni tu — nessuna chiave nella repo)

I valori si trovano in **Supabase → Project Settings → API**:

| Variabile | Dove trovarla | Tipo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | *Project URL* | pubblica |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Project API keys → anon/publishable* | pubblica |
| `SUPABASE_SERVICE_ROLE_KEY` | *Project API keys → service_role* | **segreta** |
| `CRON_SECRET` | la scegli tu | segreta |

- **In locale:** copia il template e compila — il file **non** viene committato:
  ```bash
  cp .env.example .env.local
  ```
- **Su Vercel:** Project → **Settings → Environment Variables** → aggiungi le 4 variabili
  (Production + Preview). `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` servono solo per i promemoria.
- ❌ **Non** mettere chiavi in file committati. `.gitignore` ignora tutti i `.env*` (tranne `.env.example`).

---

## C) Deploy su Vercel

1. [vercel.com](https://vercel.com) → **New Project** → importa il repo GitHub `tramitemarketing/TramiteStack`.
2. **Environment Variables**: inserisci le variabili del punto B.
3. **Deploy.** Vercel assegna un dominio `*.vercel.app` (collegabile a un dominio tuo).
4. **Promemoria (facoltativo):** aggiungi un **Vercel Cron Job** che chiama `GET /api/reminders`
   con header `Authorization: Bearer <CRON_SECRET>` (es. ogni mattina).

### Installare la PWA sul telefono
- **iPhone (Safari):** Condividi → *Aggiungi a Home*.
- **Android (Chrome):** menu ⋮ → *Installa app*.

---

## D) Uso quotidiano

- **Registrazione:** apri l'app → *Registrati* → **username**, email, password e **nome
  collaborazione** → accesso immediato. L'accesso avviene con **email + password**; lo **username**
  è il nome con cui ti vedono i colleghi in tutta l'app. (Senza il codice corretto non si entra.)
- **Home:** il tuo **saldo personale** e i **task di oggi**.
- **Task:** *Crea Task* (scegli progetto, priorità 1–5, scadenza, a chi è in carico). **Trascina** le
  card tra le 4 colonne per cambiarne lo stato: appare uno **spinner** finché il salvataggio è
  confermato. Cestino sulla card per eliminare.
- **Calendario:** due mesi affiancati, frecce per navigare; i pallini indicano eventi (viola),
  scadenze task (ambra) e consegne progetti (ciano). Tocca un giorno per il dettaglio.
- **Bilancio:** saldo di **ogni dipendente** (visibile a tutti). *Aggiungi entrata/uscita* scegliendo
  la persona. Cestino sui movimenti.
- **Progetti:** crea progetto (priorità, stato, scadenza), gestisci i suoi **task** e gli **allegati**,
  eliminalo col cestino.
- **Impostazioni:** profilo, team e (admin) modifica del **nome collaborazione**.

---

## Risoluzione problemi
- **Registrazione rifiutata:** "nome collaborazione" errato → verifica il codice in *Impostazioni*
  (admin) o in `tstack.app_settings`.
- **Mi chiede di confermare l'email:** disattiva *Confirm email* (sezione A.2).
- **Pagina vuota / errori dati:** controlla le `NEXT_PUBLIC_SUPABASE_*` e che le migration siano applicate.
- **Allegati:** serve il bucket `tstack-attachments` e le sue policy (creati dalla migration).
- **Errore "schema must be one of…":** lo schema `tstack` dev'essere esposto all'API (lo fa la migration
  `0001`: `pgrst.db_schemas = 'public, graphql_public, tstack'`).

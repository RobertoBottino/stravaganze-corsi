# Stravaganze Corsi — Fase 1

Web app pubblica per le iscrizioni ai workshop di Stravaganze Floreali.

## Funzioni

- modulo pubblico mobile-first;
- Christmas Atelier 2026;
- 22 novembre — Corona dell'Avvento;
- 5 dicembre — Corona fuori porta;
- 19 dicembre — Centrotavola natalizio;
- quote automatiche: 1 data 60 €, 2 date 100 €, 3 date 150 €;
- privacy obbligatoria come presa visione;
- consenso marketing separato e facoltativo;
- backend Google Apps Script;
- Google Sheet privato;
- e-mail automatica a Stravaganze Floreali;
- e-mail di conferma automatica al partecipante;
- stato iniziale pagamento: **In attesa pagamento**;
- nessuna password, token, API key o credenziale bancaria nel repository pubblico.

## Google Sheet già creato

Il foglio privato è:

**Iscrizioni Christmas Atelier 2026**

Spreadsheet ID:

`1RlkoEpV1SQpfQmMhR5oSfw0yTLOJnH-zzn8jqBTSDxA`

Il file è privato e l'ID da solo non concede accesso ai dati.

## Pubblicazione GitHub Pages

Il repository è pubblico ma GitHub Pages va attivato una volta manualmente:

1. Apri **Settings → Pages** del repository.
2. In **Build and deployment**, scegli **Deploy from a branch**.
3. Branch: **main**.
4. Cartella: **/(root)**.
5. Premi **Save**.

L'indirizzo pubblico sarà:

`https://robertobottino.github.io/stravaganze-corsi/`

Non servono workflow GitHub Actions.

## Collegamento Apps Script

1. Apri il Google Sheet.
2. Vai in **Estensioni → Apps Script**.
3. Sostituisci il contenuto di `Code.gs` con quello presente in `apps-script/Code.gs`.
4. In **Impostazioni progetto → Proprietà script**, crea:

   - `SHEET_ID` = `1RlkoEpV1SQpfQmMhR5oSfw0yTLOJnH-zzn8jqBTSDxA`
   - `NOTIFY_EMAIL` = l'indirizzo a cui devono arrivare le notifiche delle nuove iscrizioni
   - `PAYMENT_BENEFICIARY` = intestatario del conto
   - `PAYMENT_IBAN` = IBAN su cui ricevere il bonifico
   - `PAYMENT_BIC` = BIC/SWIFT, opzionale
   - `PAYMENT_DEADLINE_HOURS` = ore entro cui completare il pagamento, es. `24`

5. **Distribuisci → Nuova distribuzione → App web**
6. **Esegui come:** Me
7. **Chi ha accesso:** Chiunque
8. Pubblica e copia l'URL che termina in `/exec`.
9. Inserisci quell'URL in `config.js`:

```js
window.STRAVAGANZE_CORSI_CONFIG={
  appsScriptUrl:'https://script.google.com/macros/s/...../exec'
};
```

L'URL `/exec` è pubblico per natura e non è una credenziale segreta.

## Sicurezza

Il sito GitHub contiene solo il frontend pubblico e l'URL della Web App.

Non contiene:
- password Google;
- token OAuth;
- chiavi API;
- credenziali bancarie;
- dati degli iscritti.

Le iscrizioni vengono salvate esclusivamente nel Google Sheet privato.

Per la Fase 1 non esiste un pannello admin pubblico: Sara gestisce iscritti e pagamenti direttamente nel Google Sheet privato.

## Pagamenti — Fase 1

Le iscrizioni nascono con stato **In attesa pagamento**. La mail contiene importo, intestatario, IBAN, causale univoca e scadenza. Il posto viene confermato alla ricezione del pagamento. Le coordinate bancarie restano nelle Proprietà script di Google Apps Script e non vengono salvate nel repository pubblico.

Una futura Fase 2 potrà aggiungere payment link business senza esporre credenziali nel repository.


## Deployment Apps Script attuale

URL collegato al frontend:

`https://script.google.com/macros/s/AKfycbyW-rl31Nuild7plrtuCnsCbY2s26GOt3jc4RqoKslfnLSkGIiQTnUJT5Q2Jsa-wO15/exec`

Se il codice Apps Script viene modificato, ricordarsi di creare/aggiornare il deployment affinché la versione pubblica includa le modifiche.

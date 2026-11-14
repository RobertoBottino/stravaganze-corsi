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
- stato iniziale pagamento: **Da saldare**;
- nessuna password, token, API key o credenziale bancaria nel repository pubblico.

## Google Sheet già creato

Il foglio privato è:

**Iscrizioni Christmas Atelier 2026**

Spreadsheet ID:

`1RlkoEpV1SQpfQmMhR5oSfw0yTLOJnH-zzn8jqBTSDxA`

Il file è privato e l'ID da solo non concede accesso ai dati.

## Collegamento Apps Script

1. Apri il Google Sheet.
2. Vai in **Estensioni → Apps Script**.
3. Sostituisci il contenuto di `Code.gs` con quello presente in `apps-script/Code.gs`.
4. In **Impostazioni progetto → Proprietà script**, crea:

   - `SHEET_ID` = `1RlkoEpV1SQpfQmMhR5oSfw0yTLOJnH-zzn8jqBTSDxA`
   - `NOTIFY_EMAIL` = l'indirizzo a cui devono arrivare le notifiche delle nuove iscrizioni

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

Le iscrizioni nascono con stato **Da saldare**. Il pagamento viene gestito successivamente tramite bonifico o contanti.

Una futura Fase 2 potrà aggiungere payment link business senza esporre credenziali nel repository.

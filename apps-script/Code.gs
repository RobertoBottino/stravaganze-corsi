/**
 * Backend Christmas Atelier — Stravaganze Floreali
 *
 * Script Properties richieste:
 * SHEET_ID     = ID del Google Sheet privato
 * NOTIFY_EMAIL = e-mail che riceve le nuove iscrizioni
 *
 * Il foglio resta privato. Nessuna password o token va nel repository GitHub.
 */

const SHEET_NAME = 'Iscrizioni';
const HEADERS = [
  'Data registrazione','ID','Nome e cognome','Telefono','E-mail',
  '22 novembre','5 dicembre','19 dicembre','Workshop scelti',
  'Quota EUR','Stato pagamento','Metodo pagamento','Data pagamento',
  'Privacy','Marketing'
];

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    if (String(p.action || '') !== 'register') return text_('Richiesta non valida');
    if (String(p.website || '').trim()) return text_('OK'); // honeypot anti-spam
    return register_(p);
  } catch (err) {
    console.error(err);
    return text_('Errore: ' + err.message);
  }
}

function doGet() {
  return text_('Stravaganze Corsi backend attivo');
}

function register_(p) {
  const nome = clean_(p.nome,120);
  const telefono = clean_(p.telefono,50);
  const email = clean_(p.email,180);
  const privacy = p.privacy === 'SI';
  const marketing = p.marketing === 'SI' ? 'SI' : 'NO';

  const w2211 = p.w2211 === '1';
  const w0512 = p.w0512 === '1';
  const w1912 = p.w1912 === '1';
  const selected = [
    w2211 ? "22 novembre 2026 — Corona dell'Avvento" : '',
    w0512 ? '5 dicembre 2026 — Corona fuori porta' : '',
    w1912 ? '19 dicembre 2026 — Centrotavola natalizio' : ''
  ].filter(Boolean);

  // La quota viene sempre ricalcolata dal server: non ci fidiamo del valore inviato dal browser.
  const expectedQuota = selected.length === 1 ? 60 : selected.length === 2 ? 100 : selected.length === 3 ? 150 : 0;

  if (!nome || !telefono || !validEmail_(email)) throw new Error('Dati partecipante incompleti');
  if (!selected.length) throw new Error('Seleziona almeno un workshop');
  if (!privacy) throw new Error('Informativa privacy non accettata');

  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('SHEET_ID');
  if (!sheetId) throw new Error('SHEET_ID non configurato');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME);
    ensureHeaders_(sh);

    // Evita il doppio invio accidentale dello stesso form nel giro di pochi minuti.
    if (isRecentDuplicate_(sh,email,telefono,selected.join(' | '))) {
      return text_('OK');
    }

    const id = Utilities.getUuid();
    const now = new Date();
    sh.appendRow([
      now,id,nome,telefono,email,
      w2211?'SI':'NO',w0512?'SI':'NO',w1912?'SI':'NO',selected.join(' | '),
      expectedQuota,'Da saldare','Da definire','',
      'SI',marketing
    ]);

    const notify = props.getProperty('NOTIFY_EMAIL');
    if (notify) {
      MailApp.sendEmail({
        to: notify,
        subject: 'Nuova iscrizione Christmas Atelier — ' + nome,
        htmlBody:
          '<p><b>Nuova iscrizione ricevuta</b></p>'+
          '<p><b>'+html_(nome)+'</b><br>'+html_(telefono)+'<br>'+html_(email)+'</p>'+
          '<p>'+selected.map(html_).join('<br>')+'</p>'+
          '<p><b>Quota: '+expectedQuota+' €</b><br>Stato: da saldare</p>'
      });
    }

    MailApp.sendEmail({
      to: email,
      subject: 'Conferma iscrizione Christmas Atelier — Stravaganze Floreali',
      htmlBody:
        '<p>Ciao '+html_(nome)+',</p>'+
        '<p>abbiamo ricevuto la tua iscrizione al <b>Christmas Atelier di Stravaganze Floreali</b>.</p>'+
        '<p>'+selected.map(html_).join('<br>')+'</p>'+
        '<p><b>Quota: '+expectedQuota+' €</b></p>'+
        '<p>La prenotazione risulta <b>da saldare</b>. Riceverai le indicazioni per il pagamento da Stravaganze Floreali.</p>'+
        '<p>A presto! 🎄</p>'
    });

    return text_('OK');
  } finally {
    lock.releaseLock();
  }
}

function isRecentDuplicate_(sh,email,telefono,workshops) {
  const last = sh.getLastRow();
  if (last < 2) return false;
  const start = Math.max(2,last-40);
  const rows = sh.getRange(start,1,last-start+1,9).getValues();
  const now = Date.now();
  return rows.some(function(r){
    const when = r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime();
    return Number.isFinite(when) &&
      now-when < 10*60*1000 &&
      String(r[4]||'').toLowerCase() === String(email||'').toLowerCase() &&
      String(r[3]||'') === String(telefono||'') &&
      String(r[8]||'') === String(workshops||'');
  });
}

function ensureHeaders_(sh) {
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
}

function validEmail_(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||''));
}

function clean_(v,max) {
  return String(v||'').trim().replace(/[<>]/g,'').slice(0,max);
}

function html_(v) {
  return String(v||'').replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function text_(s) {
  return ContentService.createTextOutput(String(s)).setMimeType(ContentService.MimeType.TEXT);
}
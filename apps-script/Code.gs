/**
 * Backend Christmas Atelier — Stravaganze Floreali
 *
 * Script Properties richieste:
 * SHEET_ID     = ID del Google Sheet privato
 * NOTIFY_EMAIL           = e-mail che riceve le nuove iscrizioni
 * PAYMENT_BENEFICIARY     = intestatario del conto
 * PAYMENT_IBAN            = IBAN per il bonifico
 * PAYMENT_BIC             = BIC/SWIFT opzionale
 * PAYMENT_BANK_NAME       = nome banca opzionale
 * PAYMENT_DEADLINE_HOURS  = ore entro cui pagare (default 24)
 *
 * Il foglio resta privato. Nessuna credenziale bancaria viene salvata nel repository GitHub.
 */

const SHEET_NAME = 'Iscrizioni';
const HEADERS = [
  'Data registrazione','ID','Nome e cognome','Telefono','E-mail',
  '22 novembre','5 dicembre','19 dicembre','Workshop scelti',
  'Quota EUR','Stato pagamento','Metodo pagamento','Data pagamento',
  'Privacy','Marketing','Scadenza pagamento','Causale pagamento'
];

function doPost(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    if (String(p.action || '') !== 'register') return responsePage_(false,'Richiesta non valida');
    if (String(p.website || '').trim()) return responsePage_(true,'OK'); // honeypot anti-spam
    register_(p);
    return responsePage_(true,'OK');
  } catch (err) {
    console.error(err);
    return responsePage_(false,'Errore: ' + err.message);
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
  const moduleNumbers = [
    w2211 ? '1' : '',
    w0512 ? '2' : '',
    w1912 ? '3' : ''
  ].filter(Boolean);

  // La quota viene sempre ricalcolata dal server: non ci fidiamo del valore inviato dal browser.
  const expectedQuota = selected.length === 1 ? 60 : selected.length === 2 ? 100 : selected.length === 3 ? 150 : 0;

  if (!nome || !telefono || !validEmail_(email)) throw new Error('Dati partecipante incompleti');
  if (!selected.length) throw new Error('Seleziona almeno un workshop');
  if (!privacy) throw new Error('Informativa privacy non accettata');

  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('SHEET_ID');
  if (!sheetId) throw new Error('SHEET_ID non configurato');

  const payment = paymentConfig_(props);
  if (!payment.iban || !payment.beneficiary) {
    throw new Error('Coordinate di pagamento non configurate');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME);
    ensureHeaders_(sh);

    // Evita righe duplicate, ma NON blocca la mail: se l'utente reinvia entro
    // pochi minuti, riutilizziamo la registrazione esistente e rimandiamo le istruzioni.
    const duplicate = findRecentDuplicate_(sh,email,telefono,selected.join(' | '));
    const now = new Date();
    let id,deadline,causale;

    if (duplicate) {
      id = String(duplicate.values[1] || Utilities.getUuid());
      const existingDeadline = duplicate.values[15];
      deadline = existingDeadline instanceof Date && !isNaN(existingDeadline.getTime())
        ? existingDeadline
        : new Date(now.getTime() + payment.deadlineHours * 60 * 60 * 1000);
      causale = paymentReference_(nome,moduleNumbers);

      sh.getRange(duplicate.row,11).setValue('In attesa pagamento');
      sh.getRange(duplicate.row,12).setValue('Bonifico');
      sh.getRange(duplicate.row,16).setValue(deadline);
      sh.getRange(duplicate.row,17).setValue(causale);
    } else {
      id = Utilities.getUuid();
      deadline = new Date(now.getTime() + payment.deadlineHours * 60 * 60 * 1000);
      causale = paymentReference_(nome,moduleNumbers);
      sh.appendRow([
        now,id,nome,telefono,email,
        w2211?'SI':'NO',w0512?'SI':'NO',w1912?'SI':'NO',selected.join(' | '),
        expectedQuota,'In attesa pagamento','Bonifico','',
        'SI',marketing,deadline,causale
      ]);
    }

    const notify = props.getProperty('NOTIFY_EMAIL');
    const deadlineText = Utilities.formatDate(deadline, Session.getScriptTimeZone() || 'Europe/Rome', 'dd/MM/yyyy HH:mm');
    const paymentHtml = paymentInstructionsHtml_(payment,expectedQuota,causale,deadlineText);

    if (notify) {
      MailApp.sendEmail({
        to: notify,
        subject: 'Nuova iscrizione Christmas Atelier — ' + nome,
        htmlBody:
          '<p style="font-size:18px"><b>Nuova iscrizione ricevuta</b></p>'+
          '<p><b>'+html_(nome)+'</b><br>'+html_(telefono)+'<br>'+html_(email)+'</p>'+
          '<p>'+selected.map(html_).join('<br>')+'</p>'+
          '<p><b>Quota: '+expectedQuota+' €</b><br>'+
          '<b>Stato:</b> in attesa pagamento<br>'+
          '<b>Scadenza pagamento:</b> '+html_(deadlineText)+'<br>'+
          '<b>Causale:</b> '+html_(causale)+'</p>'+
          '<p>Il posto sarà confermato alla ricezione del pagamento.</p>'
      });
    }

    MailApp.sendEmail({
      to: email,
      subject: 'Christmas Atelier — completa il pagamento per confermare il posto',
      htmlBody:
        '<div style="font-family:Arial,sans-serif;color:#26312b;line-height:1.55;max-width:620px">'+
          '<p>Ciao '+html_(nome)+',</p>'+
          '<p>abbiamo ricevuto la tua iscrizione al <b>Christmas Atelier di Stravaganze Floreali</b>.</p>'+
          '<p>'+selected.map(function(x){return '🎄 '+html_(x)}).join('<br>')+'</p>'+
          '<p>La tua richiesta è stata registrata e il posto è <b>riservato temporaneamente</b>.</p>'+
          paymentHtml+
          '<p>Il posto sarà <b>confermato alla ricezione del pagamento</b>. Se il pagamento non viene ricevuto entro la scadenza indicata, la disponibilità del posto non può essere garantita.</p>'+
          '<p>Per qualsiasi dubbio puoi rispondere direttamente a questa e-mail.</p>'+
          '<p>A presto!<br><b>Stravaganze Floreali</b> 🎄</p>'+
        '</div>'
    });

    return;
  } finally {
    lock.releaseLock();
  }
}

function paymentConfig_(props) {
  const hours = Number(props.getProperty('PAYMENT_DEADLINE_HOURS') || 24);
  return {
    beneficiary: clean_(props.getProperty('PAYMENT_BENEFICIARY'),160),
    iban: clean_(props.getProperty('PAYMENT_IBAN'),80).replace(/\s+/g,' ').toUpperCase(),
    bic: clean_(props.getProperty('PAYMENT_BIC'),40).toUpperCase(),
    bankName: clean_(props.getProperty('PAYMENT_BANK_NAME'),180),
    deadlineHours: Number.isFinite(hours) ? Math.min(168,Math.max(1,hours)) : 24
  };
}

function paymentReference_(nome,moduleNumbers) {
  const safeName = String(nome||'').replace(/[^a-zA-ZÀ-ÿ0-9 ]/g,'').trim().replace(/\s+/g,' ');
  const modules = (moduleNumbers||[]).filter(Boolean).join(',');
  return 'Stravaganze Floreali – Corso Natalizio Modulo ' + modules + ' ' + safeName;
}

function paymentInstructionsHtml_(payment,amount,causale,deadlineText) {
  return '<div style="background:#f0f5ed;border:1px solid #d6e0d2;border-radius:12px;padding:16px;margin:18px 0">'+
    '<p style="margin:0 0 10px"><b>Pagamento richiesto per confermare il posto</b></p>'+
    '<p style="margin:0">'+
      '<b>Importo:</b> '+amount+' €<br>'+
      '<b>Intestatario:</b> '+html_(payment.beneficiary)+'<br>'+
      (payment.bankName ? '<b>Banca:</b> '+html_(payment.bankName)+'<br>' : '')+
      '<b>IBAN:</b> '+html_(payment.iban)+'<br>'+
      (payment.bic ? '<b>BIC/SWIFT:</b> '+html_(payment.bic)+'<br>' : '')+
      '<b>Causale:</b> '+html_(causale)+'<br>'+
      '<b>Da effettuare entro:</b> '+html_(deadlineText)+
    '</p>'+
  '</div>';
}

function findRecentDuplicate_(sh,email,telefono,workshops) {
  const last = sh.getLastRow();
  if (last < 2) return null;
  const start = Math.max(2,last-40);
  const rows = sh.getRange(start,1,last-start+1,17).getValues();
  const now = Date.now();

  for (let i=rows.length-1;i>=0;i--) {
    const r = rows[i];
    const when = r[0] instanceof Date ? r[0].getTime() : new Date(r[0]).getTime();
    const match = Number.isFinite(when) &&
      now-when < 10*60*1000 &&
      String(r[4]||'').toLowerCase() === String(email||'').toLowerCase() &&
      String(r[3]||'') === String(telefono||'') &&
      String(r[8]||'') === String(workshops||'');
    if (match) return {row:start+i,values:r};
  }
  return null;
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

function responsePage_(ok,message) {
  const payload = JSON.stringify({
    type:'sf-course-submit',
    ok:Boolean(ok),
    message:String(message||'')
  }).replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>'+
    'window.parent.postMessage('+payload+', "*");'+
    '<\/script>'
  );
}

function text_(s) {
  return ContentService.createTextOutput(String(s)).setMimeType(ContentService.MimeType.TEXT);
}
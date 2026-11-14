(()=>{'use strict';
const cfg=window.STRAVAGANZE_CORSI_CONFIG||{};
const form=document.getElementById('registrationForm');
const frame=document.getElementById('submitFrame');
const price=document.getElementById('priceValue');
const quota=document.getElementById('quotaField');
const workshopsText=document.getElementById('workshopsText');
const error=document.getElementById('formError');
const btn=document.getElementById('submitBtn');
const success=document.getElementById('successCard');
const successText=document.getElementById('successText');
let submitted=false,lastSummary='',submitTimer=null;

function selected(){return [...form.querySelectorAll('[data-workshop]:checked')]}

function recalc(){
  const arr=selected(),n=arr.length;
  const amount=n===1?60:n===2?100:n===3?150:0;
  price.textContent=amount?amount.toLocaleString('it-IT',{style:'currency',currency:'EUR'}):'—';
  quota.value=String(amount);
  workshopsText.value=arr.map(x=>x.dataset.workshop).join(' | ');
  return{arr,n,amount}
}

form.querySelectorAll('[data-workshop]').forEach(x=>x.addEventListener('change',recalc));
recalc();

form.addEventListener('submit',e=>{
  error.hidden=true;
  if(!form.reportValidity()){e.preventDefault();return}
  const {arr,n,amount}=recalc();
  if(!n){e.preventDefault();showError('Seleziona almeno un workshop.');return}
  if(!cfg.appsScriptUrl){e.preventDefault();showError('Il modulo non è ancora collegato all’archivio iscrizioni.');return}
  if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(cfg.appsScriptUrl)){
    e.preventDefault();showError('Configurazione del modulo non valida.');return
  }

  form.action=cfg.appsScriptUrl;
  lastSummary=arr.map(x=>x.dataset.workshop).join(', ')+' · Quota '+amount.toLocaleString('it-IT',{style:'currency',currency:'EUR'});
  submitted=true;
  btn.disabled=true;
  btn.textContent='INVIO IN CORSO…';
  clearTimeout(submitTimer);
  submitTimer=setTimeout(()=>{
    if(!submitted)return;
    submitted=false;btn.disabled=false;btn.textContent='CONFERMA ISCRIZIONE';
    showError('L’invio sta impiegando troppo tempo. Controlla la connessione e riprova.')
  },15000)
});


frame.addEventListener('load',()=>{
  if(!submitted)return;
  // Compatibilità con il primo deployment Apps Script, che restituisce solo testo.
  // Se una versione più nuova invia postMessage, quel risultato arriva prima.
  setTimeout(()=>{
    if(!submitted)return;
    clearTimeout(submitTimer);
    submitted=false;btn.disabled=false;btn.textContent='CONFERMA ISCRIZIONE';
    form.hidden=true;success.hidden=false;
    successText.textContent=lastSummary+'. Riceverai una conferma via e-mail.';
    success.scrollIntoView({behavior:'smooth',block:'center'})
  },700)
});

window.addEventListener('message',e=>{
  if(e.source!==frame.contentWindow)return;
  const data=e.data;
  if(!data||data.type!=='sf-course-submit'||!submitted)return;
  clearTimeout(submitTimer);
  submitted=false;btn.disabled=false;btn.textContent='CONFERMA ISCRIZIONE';
  if(!data.ok){
    showError(data.message||'Non è stato possibile registrare l’iscrizione. Riprova.');
    return
  }
  form.hidden=true;success.hidden=false;
  successText.textContent=lastSummary+'. Riceverai una conferma via e-mail.';
  success.scrollIntoView({behavior:'smooth',block:'center'})
});

document.getElementById('newRegistration').addEventListener('click',()=>{
  form.reset();recalc();success.hidden=true;form.hidden=false;error.hidden=true;
  window.scrollTo({top:0,behavior:'smooth'})
});

function showError(msg){
  error.textContent=msg;error.hidden=false;
  error.scrollIntoView({behavior:'smooth',block:'center'})
}
})();
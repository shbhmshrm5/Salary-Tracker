// v6.4 Send: money you send to a person (Kirti, family, friends) leaves your account but is not spending.
// It is a record in the "Sent to people" category, whose kind is "send": balances go down as for any outflow,
// while every spending total, chart and budget (all of which count kind "expense") leaves it out.
const V9_SENT='Sent to people';
let v9PendingPerson=null;
PATHS[V9_SENT]=PATHS[V9_SENT]||'M7 17L17 7M9 7h8v8';
function v9IsSend(r){return kind(r.category)==='send'}
function v9People(){
 const counts=new Map();for(const r of state.records)if(v9IsSend(r)&&r.person)counts.set(r.person,(counts.get(r.person)||0)+1);
 return [...counts].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
function v9SentIn(range){return state.records.filter(r=>v9IsSend(r)&&inRange(r.date,range))}
function v9SentPage(){v9CategoryPage([V9_SENT],{title:V9_SENT,groupBy:r=>r.person||'Someone',partsTitle:'People'})}

/* ---------- Add entry: a Send tab with a "To" field instead of categories ---------- */
function v9SendBlock(){
 if($('v9SendBlock'))return;const block=node('div','v9-send-block');block.id='v9SendBlock';block.hidden=true;
 const label=node('label',null,'To');label.htmlFor='v9SendPerson';const input=node('input');input.id='v9SendPerson';input.type='text';input.maxLength=40;input.placeholder='e.g. Kirti';input.autocomplete='off';
 const chips=node('div','v9-send-people');chips.id='v9SendPeople';block.append(label,input,chips,node('p','v9-hint','Not counted as spending. Your account balance goes down.'));
 const catLabel=$('categories').previousElementSibling;if(catLabel?.tagName==='LABEL')catLabel.classList.add('v9-category-label');(catLabel?.tagName==='LABEL'?catLabel:$('categories')).before(block);
 input.addEventListener('input',()=>{v9DrawPeople();v7UpdateSave()});
}
function v9DrawPeople(){
 const chips=$('v9SendPeople');if(!chips)return;chips.replaceChildren();const typed=$('v9SendPerson').value.trim().toLowerCase();
 for(const p of v9People().filter(p=>!typed||p.toLowerCase().includes(typed)).slice(0,6)){const b=action(p,()=>{$('v9SendPerson').value=p;v9DrawPeople();v9RememberAccount();v7UpdateSave()});b.type='button';b.className='v9-note-chip'+(p.toLowerCase()===typed?' selected':'');chips.append(b)}
}
function v9SendMode(){
 const on=page==='entry'&&kind(category)==='send';$('form').classList.toggle('v9-send-mode',on);$('v9SendBlock').hidden=!on;
 if(!on)return;v9DrawPeople();$('saveEntry').textContent='Save';
 for(const id of ['entryTitle','pageTitle'])if($(id))$(id).textContent=editing?'Edit send':'Send money';
}
// Save needs a person as well as an amount and account.
function v9SendSave(){if(page==='entry'&&kind(category)==='send'&&!$('v9SendPerson').value.trim())$('saveEntry').disabled=true}

// Older expenses such as "Paid to Kirti" were counted as spending; offer to move them once.
function v9SendCandidates(){
 let skipped=[];try{skipped=JSON.parse(localStorage.getItem('v9-send-skipped')||'[]')}catch{}
 const out=[];for(const r of state.records){if(kind(r.category)!=='expense'||r.refundOf||r.shared||r.paidBy==='other'||state.records.some(x=>x.refundOf===r.id)||skipped.includes(r.id))continue;
  const m=(r.note||'').trim().match(/^(?:paid|sent|send|gave|given|transfer(?:red)?)\s+(?:to\s+)?([A-Za-zऀ-ॿ][A-Za-zऀ-ॿ .]{0,38})$/i);if(m)out.push({r,person:canonicalPerson(m[1].replace(/\b\w/g,c=>c.toUpperCase()))})}
 return out;
}
function v9SendNotice(){
 const home=$('v8Home');$('v9SendNotice')?.remove();if(!home)return;const list=v9SendCandidates();if(!list.length)return;
 const b=action('',v9SendReview);b.id='v9SendNotice';b.className='v8-notice v8-notice-drafts';b.append(node('strong',null,list.length===1?'1 payment to a person counts as spending':list.length+' payments to people count as spending'),node('span',null,'Review ›'));
 let holder=home.querySelector('.v8-notices');if(!holder){holder=node('div','v8-notices');home.querySelector('.v8-hero')?.before(holder)}holder.append(b);
}
function v9SendReview(){
 const list=v9SendCandidates(),d=workflowDialog('Money sent to people');d.append(node('p','muted','These look like money you sent, not spending. Moved entries keep their amount, date, account and note.'));
 const picks=[];for(const {r,person} of list){const row=node('label','v9-send-review');const box=node('input');box.type='checkbox';box.checked=true;picks.push({box,r,person});const text=node('span','v8-row-text');text.append(node('strong',null,r.note),node('small',null,categoryLabel(r)+' · '+displayDate(r.date)+' · to '+person));row.append(box,text,node('strong','v8-amount',money(r.amount)));d.append(row)}
 const move=action('Move to '+V9_SENT,()=>{const chosen=new Map(picks.filter(p=>p.box.checked).map(p=>[p.r.id,p.person])),kept=picks.filter(p=>!p.box.checked).map(p=>p.r.id);
  if(kept.length){let skipped=[];try{skipped=JSON.parse(localStorage.getItem('v9-send-skipped')||'[]')}catch{}try{localStorage.setItem('v9-send-skipped',JSON.stringify([...new Set(skipped.concat(kept))]))}catch{}}
  if(!chosen.size){d.close();render();return}
  if(update({records:state.records.map(r=>chosen.has(r.id)?{...r,category:V9_SENT,subcategory:'',person:chosen.get(r.id),paidBy:'me'}:r)})){d.close();render();message(chosen.size===1?'1 entry moved':chosen.size+' entries moved')}});
 move.className='primary';d.append(move);
}

/* ---------- Where sends show: Home, Activity and Insights ---------- */
function v9SentRow(range,label){
 const list=v9SentIn(range);if(!list.length)return null;const total=list.reduce((n,r)=>n+cents(r.amount),0),people=new Map();for(const r of list)people.set(r.person||'Someone',(people.get(r.person||'Someone')||0)+cents(r.amount));
 const b=action('',v9SentPage);b.className='v8-link-row v9-sent-row';b.id='v9SentRow';
 b.append(node('span',null,label+' · '+money(total/100)),node('small',null,[...people].sort((a,c)=>c[1]-a[1]).slice(0,3).map(([p,v])=>p+' '+money(v/100)).join(' · ')+' · not spending'),node('i',null,'›'));return b;
}
function v9SentHome(){if(page!=='home')return;$('v9SentRow')?.remove();const row=v9SentRow(reportRange(),'Sent to people');if(row)$('v8Home')?.querySelector('.v8-spend')?.after(row)}
function v9SentActivity(){if(page!=='expenses')return;$('v9SentRow')?.remove();if(expenseView!=='expense')return;const row=v9SentRow(reportRange(),'Sent to people');if(row)($('v8ReportsRow')||$('modernSpendChart'))?.after(row)}

function initV9Send(){
 v9SendBlock();
 const priorLabel=categoryLabel;categoryLabel=function(r){return v9IsSend(r)?'Sent to '+(r.person||'someone'):priorLabel(r)};
 const priorType=entryType;entryType=function(k){if(k!=='send')return priorType(k);expandedCategories=false;pick(V9_SENT);v9SendMode()};
 // Send sits between Income and Transfer on the type switch.
 const types=$('typeSwitch');if(types&&!types.querySelector('[data-kind=send]')){const b=node('button',null,'Send');b.type='button';b.dataset.kind='send';b.onclick=()=>entryType('send');const transfer=types.querySelector('[data-kind=transfer]');if(transfer)transfer.before(b);else types.append(b)}
 const priorPick=pick;pick=function(...args){const result=priorPick(...args);v9SendMode();v9SendSave();return result};
 const priorOpen=openEntry;openEntry=function(id=null,...rest){const result=priorOpen(id,...rest);if(page==='entry'){const r=state.records.find(x=>x.id===id);$('v9SendPerson').value=r&&v9IsSend(r)?r.person||'':'';v9SendMode();v9SendSave();entrySnapshot=formSnapshot()}return result};
 const priorSaveState=v7UpdateSave;v7UpdateSave=function(...args){const result=priorSaveState(...args);v9SendSave();return result};$('form').addEventListener('input',v9SendSave);$('form').addEventListener('change',v9SendSave);
 // The person is added to the saved record; an empty note becomes "To <person>" so lists read clearly.
 const priorSubmit=$('form').onsubmit;$('form').onsubmit=function(e){
  if(kind(category)!=='send')return priorSubmit.call(this,e);
  const person=$('v9SendPerson').value.trim()?canonicalPerson($('v9SendPerson').value):'';if(!person){e.preventDefault();message('Enter who you sent it to');return}
  if(!$('note').value.trim())$('note').value='To '+person;v9PendingPerson=person;try{return priorSubmit.call(this,e)}finally{v9PendingPerson=null}};
 const priorUpdate=update;update=function(patch){
  if(v9PendingPerson&&patch?.records){const ids=new Set(state.records.map(r=>r.id));patch={...patch,records:patch.records.map(r=>v9IsSend(r)&&(r.id===editing||!ids.has(r.id))?{...r,person:v9PendingPerson,paidBy:'me',subcategory:''}:r)}}
  return priorUpdate(patch)};
 // Repeating a send also repeats who it went to.
 const priorFill=v9FillFrom;v9FillFrom=function(r){priorFill(r);if(v9IsSend(r)){$('v9SendPerson').value=r.person||'';v9DrawPeople();v7UpdateSave()}};
 const priorHome=v8HomeNotices;v8HomeNotices=function(){priorHome();v9SendNotice();v9SentHome()};
 const priorActivity=v8Activity;v8Activity=function(){priorActivity();v9SentActivity()};
 render();
}

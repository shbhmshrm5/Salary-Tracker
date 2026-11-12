// v6.3 faster entry: the pad is ready on a new entry, "Again" chips repeat a past entry in one tap,
// past notes are suggested while typing, and the account follows what you used last for that note or category.
// Every value still goes through the normal entry form and its validated save.
let v9AccountManual=false,v9Filling=false;
function v9Norm(s){return (s||'').trim().toLowerCase()}
// Past entries of one kind (expense, income or investment) that can be repeated as they are.
function v9Repeatable(mode){return state.records.filter(r=>kind(r.category)===mode&&!r.refundOf&&r.paidBy!=='other'&&!r.shared&&categoryNames(state).includes(r.category)&&r.date<=today())}
// The six repeats you make most, newest first among equals; amount and account are part of what repeats.
function v9AgainList(mode){
 const from=new Date(today()+'T12:00:00');from.setDate(from.getDate()-120);const since=from.toISOString().slice(0,10),groups=new Map();
 for(const r of v9Repeatable(mode)){if(r.date<since)continue;const key=[v9Norm(r.note),r.category,r.subcategory||'',cents(r.amount),r.accountId||''].join('|');const g=groups.get(key);if(!g)groups.set(key,{r,count:1});else{g.count++;if(r.date>g.r.date||r.date===g.r.date&&(r.createdAt||0)>(g.r.createdAt||0))g.r=r}}
 return [...groups.values()].sort((a,b)=>b.count-a.count||b.r.date.localeCompare(a.r.date)||(b.r.createdAt||0)-(a.r.createdAt||0)).slice(0,6).map(g=>g.r);
}
function v9AgainLabel(r){return (r.note||r.subcategory||r.category)+' · '+money(r.amount)}
function v9DrawAgain(){
 let row=$('v9Again');if(!row){row=node('div','v9-again');row.id='v9Again';row.setAttribute('role','group');row.setAttribute('aria-label','Repeat a past entry');$('form').querySelector('.entry-panel')?.after(row)}
 row.replaceChildren();if(editing||page!=='entry'){row.hidden=true;return}
 const list=v9AgainList(kind(category));row.hidden=!list.length;if(!list.length)return;
 row.append(node('span','v9-again-title','Again'));
 for(const r of list){const b=action('',()=>v9FillFrom(r));b.type='button';b.className='v9-again-chip';const glyph=node('span','v9-again-icon');glyph.innerHTML=icon(r.category);glyph.setAttribute('aria-hidden','true');b.append(glyph,node('span',null,v9AgainLabel(r)));b.setAttribute('aria-label','Repeat '+v9AgainLabel(r));row.append(b)}
}
// Fill the form from a past entry: amount, note, category, subcategory and account; the date stays today.
function v9FillFrom(r){
 v9Filling=true;try{
  v9Auto=true;try{pick(r.category)}finally{v9Auto=false}v9Manual=true;
  $('amount').value=String(r.amount);$('amount').dispatchEvent(new Event('input',{bubbles:true}));
  $('note').value=r.note||'';
  if(validSubcategory(r.category,r.subcategory,state)){$('entrySubcategory').value=r.subcategory||'';v7Subcategories()}
  if(r.accountId&&[...$('entryAccount').options].some(o=>o.value===r.accountId)){$('entryAccount').value=r.accountId;$('entryAccount').dispatchEvent(new Event('change',{bubbles:true}))}
  $('date').value=today();
 }finally{v9Filling=false}
 $('v9NoteSuggest')?.replaceChildren();$('v9Suggestion')?.remove();v9PadClose();v7UpdateSave();
 const hint=node('p','v9-suggestion','Filled from your last “'+(r.note||r.category)+'” · check and Save');hint.id='v9Suggestion';$('note').after(hint);
 $('saveEntry').focus({preventScroll:true});
}
// The account you last used for this note, or else for this category, unless you chose one yourself.
function v9RememberAccount(){
 if(v9Filling||v9AccountManual||editing||page!=='entry'||$('paidBy')?.value==='other')return;
 const options=new Set([...$('entryAccount').options].map(o=>o.value).filter(Boolean)),mode=kind(category),note=v9Norm($('note').value);
 const past=v9Repeatable(mode).filter(r=>options.has(r.accountId)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));
 const match=(note&&past.find(r=>v9Norm(r.note)===note))||past.find(r=>r.category===category);
 if(match&&$('entryAccount').value!==match.accountId){$('entryAccount').value=match.accountId;$('entryAccount').dispatchEvent(new Event('change',{bubbles:true}))}
}
// Up to four past notes that start with what you typed (then ones that contain it), most used first.
function v9NoteSuggestions(){
 let row=$('v9NoteSuggest');if(!row){row=node('div','v9-note-suggest');row.id='v9NoteSuggest';$('note').after(row)}
 row.replaceChildren();const text=v9Norm($('note').value);if(!text||editing||page!=='entry')return;
 const counts=new Map(),shown=new Map();for(const r of v9Repeatable(kind(category))){const n=v9Norm(r.note);if(!n||n===text)continue;counts.set(n,(counts.get(n)||0)+1);if(!shown.has(n))shown.set(n,r.note.trim())}
 const rank=[...counts].filter(([n])=>n.includes(text)).sort((a,b)=>Number(b[0].startsWith(text))-Number(a[0].startsWith(text))||b[1]-a[1]).slice(0,4);
 for(const [n] of rank){const b=action(shown.get(n),()=>{$('note').value=shown.get(n);row.replaceChildren();$('note').dispatchEvent(new Event('input',{bubbles:true}));v9RememberAccount()});b.type='button';b.className='v9-note-chip';row.append(b)}
}
/* ---------- Pay from: a sheet with each account's logo and balance ---------- */
function v9AccountSync(){
 const select=$('entryAccount'),btn=$('v9AccountPick');if(!select||!btn)return;const a=account(select.value);
 btn.innerHTML=(a?bankIcon(a):'')+'<span class="v9-account-name"></span><span class="v9-account-caret" aria-hidden="true">▾</span>';btn.querySelector('.v9-account-name').textContent=a?displayAccountName(a):select.selectedOptions[0]?.textContent||'Choose';btn.setAttribute('aria-label','Pay from '+(a?displayAccountName(a):'no account')+'. Change');
}
function v9AccountSheet(){
 const select=$('entryAccount'),d=workflowDialog('Pay from');d.classList.add('v9-account-sheet');
 for(const o of select.options){const a=account(o.value),b=action('',()=>{select.value=o.value;v9AccountManual=true;select.dispatchEvent(new Event('change',{bubbles:true}));d.close()});b.className='v8-row v9-account-row';b.setAttribute('aria-pressed',String(o.value===select.value));
  const logo=node('span','v9-account-logo');logo.innerHTML=a?bankIcon(a):'';const text=node('span','v8-row-text');text.append(node('strong',null,a?displayAccountName(a):o.textContent),node('small',null,a?(isCard(a)?money(Math.max(0,-balance(a)))+' due':money(balance(a))+' available'):''));
  b.append(logo,text);if(o.value===select.value)b.append(node('span','v9-account-check','✓'));d.append(b)}
}
function v9AccountPicker(){
 const select=$('entryAccount');if(!select||$('v9AccountPick'))return;const b=action('',v9AccountSheet);b.id='v9AccountPick';b.className='v9-account-pick';select.before(b);select.classList.add('v9-hidden-select');
 select.addEventListener('change',v9AccountSync);const prior=fillAccounts;fillAccounts=function(id,...args){const result=prior(id,...args);if(id==='entryAccount')v9AccountSync();return result};v9AccountSync();
}

/* ---------- Lists: swipe right to repeat an entry, left to delete it (Undo stays available) ---------- */
function v9SwipeRows(){
 let drag=null;const reset=el=>{el.style.transform='';el.classList.remove('v9-swiping','v9-swipe-repeat','v9-swipe-delete')};
 document.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-record]');if(!el||e.button>0)return;drag={el,x:e.clientX,y:e.clientY,dx:0,on:false}},{passive:true});
 document.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.on){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){drag=null;return}if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.5)return;drag.on=true;drag.el.classList.add('v9-swiping')}
  drag.dx=Math.max(-130,Math.min(130,dx));drag.el.style.transform='translateX('+drag.dx+'px)';drag.el.classList.toggle('v9-swipe-repeat',drag.dx>70);drag.el.classList.toggle('v9-swipe-delete',drag.dx<-70)},{passive:true});
 const end=()=>{if(!drag)return;const {el,dx,on}=drag;drag=null;if(!on)return;
  // The click that follows a swipe must not open the entry.
  el.addEventListener('click',ev=>{ev.stopImmediatePropagation();ev.preventDefault()},{capture:true,once:true});setTimeout(()=>reset(el),0);
  const r=state.records.find(x=>x.id===el.dataset.record);if(!r)return;
  if(dx>70){el.closest('dialog')?.close();openEntry(null,r.category);v9FillFrom(r)}
  else if(dx<-70){if((r.repayments||[]).length||state.records.some(x=>x.refundOf===r.id)){message('Open this entry to delete it: it has repayments or refunds.');return}
   if(update({records:state.records.filter(x=>x.id!==r.id)})){if(el.closest('dialog'))el.remove();render();message('Entry deleted')}}};
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',()=>{if(drag){reset(drag.el);drag=null}});
 // The full history list is built by the older list code, so its rows are labelled here.
 const priorRows=rows;rows=function(el,list){priorRows(el,list);const items=el.querySelectorAll(':scope > .row');items.forEach((row,i)=>{if(list[i])row.dataset.record=list[i].id})};
}
window.onAppShortcut=function(name){if(!state)return;if(name==='voice')openVoice();else openEntry()};

function initV9Entry(){
 v9AccountPicker();v9SwipeRows();
 const priorOpen=openEntry;openEntry=function(...args){
  v9AccountManual=false;const result=priorOpen(...args);
  if(page==='entry'){v9DrawAgain();$('v9NoteSuggest')?.replaceChildren();
   // A new entry starts with the pad ready, so the first tap is a digit.
   if(!editing&&!$('amount').value)setTimeout(()=>{if(page==='entry'&&!editing){$('amount').focus({preventScroll:true});v9PadOpen()}},0)}
  return result};
 const priorPick=pick;pick=function(...args){const before=kind(category),result=priorPick(...args);if(page==='entry'){if(kind(category)!==before)v9DrawAgain();if(!v9Auto)v9RememberAccount()}return result};
 $('entryAccount').addEventListener('change',e=>{if(e.isTrusted)v9AccountManual=true});
 $('note').addEventListener('input',()=>{v9NoteSuggestions();if(v9Norm($('note').value).length>=3)v9RememberAccount()});
 render();
}

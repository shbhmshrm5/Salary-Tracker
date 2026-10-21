// v5 screens: number-pad entry, Home · Activity · + · Leave · Wealth menu, and a shorter Settings.
// Everything below rearranges or adds presentation; saving still goes through the existing validated workflows.

/* ---------- Add entry: big amount, number pad, one-tap categories ---------- */
function v8EntryLayout(){
 const form=$('form'),panel=form.querySelector('.entry-panel'),amount=$('amount');
 // A text field keeps partial input such as "12." while the number pad types; saving still requires a positive number.
 amount.type='text';amount.setAttribute('inputmode','none');amount.placeholder='0';
 const note=$('note'),noteTile=note.closest('.modern-entry-tile');note.placeholder='Add a note';panel.append(note);noteTile.remove();
 const pad=node('div','v8-keypad');pad.id='v8Keypad';pad.setAttribute('role','group');pad.setAttribute('aria-label','Number pad');
 for(const key of ['1','2','3','4','5','6','7','8','9','.','0','⌫']){const b=action(key==='⌫'?'':key,()=>v8KeypadPress(key));b.className='v8-key';if(key==='⌫'){b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12zM18 9l-6 6M12 9l6 6"/></svg>';b.setAttribute('aria-label','Delete last digit')}pad.append(b)}
 $('modernEntryGrid').after(pad);
 // Account, date and payer sit together as one compact row of details.
 const meta=node('div','v8-entry-meta');meta.id='v8EntryMeta';for(const id of ['entryAccount','paidBy','date']){const tile=$(id).closest('.modern-entry-tile');if(tile)meta.append(tile)}$('modernEntryGrid').append(meta);
 const more=node('details','v8-entry-more');more.append(node('summary',null,'More options'));const tools=form.querySelector('.category-tools'),addAccount=[...form.querySelectorAll(':scope > .link-button')];more.append(...[tools,...addAccount].filter(Boolean));pad.after(more);
 const voice=document.querySelector('#entry .voice-entry-button');if(voice){voice.setAttribute('aria-label','Speak instead');voice.title='Speak instead'}
 const types=$('typeSwitch');const sip=types?.querySelector('[data-kind=aside]');if(sip)sip.textContent='Invest';if(types&&!types.querySelector('[data-kind=transfer]')){const t=action('Transfer',()=>openTransfer());t.dataset.kind='transfer';types.append(t)}
 form.querySelector('.form-actions button[type=button]')?.classList.add('v8-cancel');
}
function v8KeypadPress(key){
 const input=$('amount');let v=input.value||'';
 if(key==='⌫')v=v.slice(0,-1);else if(key==='.'){if(!v.includes('.'))v=(v||'0')+'.'}else{const [whole,dec]=v.split('.');if(dec!==undefined&&dec.length>=2)return;if(dec===undefined&&whole.replace(/^0+/,'').length>=9)return;v=v==='0'?key:v+key}
 input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));
}

/* ---------- Menu: Home · Activity · + · Leave · Wealth ---------- */
function v8Nav(){
 const nav=document.querySelector('nav[data-modern]');nav.replaceChildren();
 for(const [id,label,glyph,go] of [['home','Home','home',()=>show('home')],['expenses','Activity','Bills',()=>{expenseView='expense';categoryFilter=null;show('expenses')}],['add','Add','',()=>modernQuick()],['calendar','Leave','calendar',()=>{calendarPanel='leave';show('calendar')}],['invest','Wealth','Investments',()=>show('invest')]]){
  const b=action('',go);b.setAttribute('aria-label',id==='add'?'Add entry':label);const mark=node('span','modern-nav-icon');
  if(id==='add'){b.className='v8-nav-add';b.removeAttribute('data-page');mark.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'}else{b.dataset.page=id;mark.innerHTML=icon(glyph)}
  b.append(mark,node('span',null,label));nav.append(b)}
}
function v8ActivityTabs(){
 const current=page==='income'?'income':expenseView==='aside'?'aside':'expense',d=node('div','v8-activity-tabs');d.setAttribute('role','group');d.setAttribute('aria-label','Activity type');
 for(const [key,label] of [['expense','Spent'],['income','Income'],['aside','Invested']]){const b=action(label,()=>{if(key==='income'){salaryPanel='salary';show('income')}else{expenseView=key;categoryFilter=null;show('expenses')}});b.setAttribute('aria-pressed',String(current===key));d.append(b)}
 return d;
}
function v8Activity(){
 for(const id of ['expenses','income']){const section=$(id);section.querySelector(':scope > .v8-activity-tabs')?.remove();if(page===id)section.prepend(v8ActivityTabs())}
 if(salaryPanel==='cards')salaryPanel='salary';
 // Budget lives with spending now; it opens the existing monthly budgets manager.
 let budget=$('v8BudgetRow');if(!budget){budget=action('',()=>openBudgets());budget.id='v8BudgetRow';budget.className='v8-link-row'}
 const month=today().slice(0,7),overall=(state.budgets||[]).find(b=>b.month===month&&b.category==='All expenses'),spent=state.records.filter(r=>r.date.slice(0,7)===month&&kind(r.category)==='expense').reduce((n,r)=>n+reportCents(r),0);
 budget.replaceChildren(node('span',null,overall?'Budget this month':'Set a monthly budget'),node('small',null,overall?money(spent/100)+' of '+money(overall.amount/100)+(spent>overall.amount?' · over':' · '+money((overall.amount-spent)/100)+' left'):'Optional'),node('i',null,'›'));
 let reports=$('v8ReportsRow');if(!reports){reports=action('',()=>show('insights'));reports.id='v8ReportsRow';reports.className='v8-link-row';reports.append(node('span',null,'Reports & insights'),node('small',null,'Compare months and years'),node('i',null,'›'))}
 const chart=$('modernSpendChart');if(chart&&expenseView==='expense')chart.after(budget,reports);else{budget.remove();reports.remove()}
}
function v8Wealth(){
 if(page!=='invest')return;const el=$('invest');
 const plans=(state.schedules||[]).filter(s=>kind(s.category)==='aside'&&!s.paused).sort((a,b)=>a.date.localeCompare(b.date));
 const up=node('section','v8-card v8-wealth-up');up.append(node('h2',null,'Upcoming SIPs'));if(!plans.length)up.append(node('p','v8-empty','No SIP plans yet.'));
 for(const s of plans.slice(0,4)){const b=action('',()=>editSchedule(s));b.className='v8-row';const text=node('span','v8-row-text');text.append(node('strong',null,s.note||s.category),node('small',null,v8Day(s.date)+' · '+s.frequency));b.append(text,node('strong','v8-amount save',money(s.amount/100)));up.append(b)}
 up.append(Object.assign(action('+ Add SIP plan',()=>editSchedule({category:'SIP',frequency:'monthly',date:today(),anchor:Number(today().slice(-2)),amount:0,accountId:state.defaultAccount})),{className:'v8-text-button'}));
 const g=state.savingsGoal,goal=node('section','v8-card');goal.append(node('h2',null,g?.name||'Savings goal'));if(g){const pc=Math.max(0,Math.min(100,g.saved/g.target*100)),track=node('div','v8-track'),fill=node('i');fill.style.width=pc+'%';track.append(fill);goal.append(node('p','v8-sub',money(g.saved/100)+' of '+money(g.target/100)+' · '+pc.toFixed(0)+'%'),track)}else goal.append(node('p','v8-sub','Track progress towards something you are saving for.'));goal.append(Object.assign(action(g?'Edit goal':'Set a goal',modernGoal),{className:'v8-text-button'}));
 el.querySelector('.v7-invest-hero')?.after(up,goal);
}

/* ---------- Home extras: payments waiting for review, and a backup reminder ---------- */
function v8HomeNotices(){
 const home=$('v8Home');if(!home)return;const holder=node('div','v8-notices');
 let drafts=[];try{drafts=window.Android?.paymentDrafts?JSON.parse(Android.paymentDrafts()):[]}catch{}
 if(drafts.length){const b=action('',()=>openPaymentInbox());b.className='v8-notice v8-notice-drafts';b.append(node('strong',null,drafts.length+(drafts.length===1?' payment':' payments')+' to review'),node('span',null,'Review ›'));holder.append(b)}
 let cloud='';try{cloud=window.Android?.cloudStatus?String(Android.cloudStatus()):''}catch{}
 const last=backupPrefs().lastSaved,stale=!last||Number.isNaN(Date.parse(last))||Date.now()-Date.parse(last)>30*86400000,hasData=state.records.length+state.accounts.length>0;
 if(hasData&&stale&&!/connected|@/i.test(cloud)){const b=action('',()=>settingsBackupFromHome());b.className='v8-notice v8-notice-backup';b.append(node('strong',null,last?'No backup for over a month':'Your data is only on this phone'),node('span',null,'Back up ›'));holder.append(b)}
 if(holder.children.length)home.querySelector('.v8-hero')?.before(holder);
}
function settingsBackupFromHome(){show('more');settingsBackup()}

/* ---------- Settings: three short groups ---------- */
function v8Settings(){
 const pageEl=$('more');$('settingsSearch')?.setAttribute('hidden','');$('settingsEmpty')?.remove();$('modernBackupStatus')?.setAttribute('hidden','');
 const row=id=>$('setting-'+id),groups=[['Money',['accounts','categories','budgets','recurring','people']],['App',['capture','appearance','lock']],['Data',['backup','help']]];
 const old=[...pageEl.querySelectorAll(':scope > .settings-section')];
 for(const [title,ids] of groups){const section=node('section','settings-section v8-settings-section'),list=node('div','settings-list');section.append(node('h2','settings-section-title',title),list);for(const id of ids)if(row(id))list.append(row(id));pageEl.append(section)}
 for(const id of ['default','voice','import'])row(id)?.setAttribute('hidden','');for(const s of old)s.remove();
 for(const [id,label] of [['people','People & loans'],['capture','Auto-capture & voice'],['backup','Backup & export']])row(id).querySelector('.setting-title').textContent=label;
 settingsRows=settingsRows.filter(r=>r.el.isConnected&&!r.el.hidden);
 // Merged screens keep every original option, one level deeper.
 const capture=settingsOriginals.settingsCapture;settingsOriginals.settingsCapture=function(){capture();const d=[...document.querySelectorAll('dialog[open]')].at(-1);if(!d)return;d.querySelector('.dialog-head h2, h2')&&(d.querySelector('.dialog-head h2, h2').textContent='Auto-capture & voice');d.append(node('h3',null,'Voice entry'),settingsLink('Speaking language',$('voiceLanguage').selectedOptions[0]?.textContent||'',settingsVoiceLanguage,'settings','purple'),settingsLink('Start voice entry',window.Android?.startVoice?'Speak, then review':'Typed entry available',()=>openVoice(),'income','blue'))};
 const backup=settingsOriginals.settingsBackup;settingsOriginals.settingsBackup=function(){backup();const d=[...document.querySelectorAll('dialog[open]')].at(-1);if(!d)return;const h=d.querySelector('.dialog-head h2');if(h)h.textContent='Backup & export';d.append(settingsLink('Import CSV','Preview before saving',openImports,'Bills','green'),settingsLink('Reports & insights','Choose dates & compare',()=>{closeDialogs();show('insights')},'insights','orange'))};
 const people=settingsOriginals.settingsPeople;settingsOriginals.settingsPeople=function(){people();const h=[...document.querySelectorAll('dialog[open]')].at(-1)?.querySelector('.dialog-head h2');if(h)h.textContent='People & loans'};
 // Backup reminder is simply on or off.
 const freq=$('backupFrequency');if(freq){for(const o of freq.options){if(o.value==='30')o.textContent='On · remind me monthly';else if(o.value==='0')o.textContent='Off';else{o.textContent='On · remind me monthly';o.hidden=true}}const label=document.querySelector('label[for=backupFrequency]');if(label)label.textContent='Backup reminder'}
}
function v8SettingsValues(){
 if(!$('settingsProfileName')||!state)return;const choice=v8ThemeChoice();settingValue('appearance',choice==='auto'?'Auto':(v8Themes[choice]?.label||'Paper'));
 const last=backupPrefs().lastSaved,sub=document.querySelector('.settings-profile small');if(sub)sub.textContent=last&&!Number.isNaN(Date.parse(last))?'Last backup · '+new Date(last).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'Data on this phone · not backed up';
 const def=account(state.defaultAccount);settingValue('accounts',settingsCount(state.accounts.filter(a=>!a.archived).length,'account')+(def?' · default '+displayAccountName(def):''));settingValue('capture',settingsPaymentStatus());
}
function v8AccountsPage(){
 if(page!=='accounts')return;let row=$('v8DefaultRow');if(!row){row=settingsLink('Default for spending','',()=>settingsDefault(),'accounts','green');row.id='v8DefaultRow';$('accounts').prepend(row)}
 const def=account(state.defaultAccount);row.querySelector('.setting-value').textContent=def?displayAccountName(def):'Not set';
}
/* ---------- Recurring: suggest payments that repeat every month ---------- */
function v8RecurringSuggestions(){
 const since=new Date(today()+'T12:00:00');since.setMonth(since.getMonth()-6);const from=since.toISOString().slice(0,10),groups=new Map();
 for(const r of state.records){if(r.date<from||r.date>today()||kind(r.category)==='income'||r.refundOf||r.paidBy==='other')continue;const key=(r.note||r.category).trim().toLowerCase()+'|'+r.category+'|'+cents(r.amount);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)}
 const planned=new Set((state.schedules||[]).map(s=>s.category+'|'+s.amount));
 return [...groups.values()].filter(list=>new Set(list.map(r=>r.date.slice(0,7))).size>=2&&!planned.has(list[0].category+'|'+cents(list[0].amount))).map(list=>list.sort((a,b)=>b.date.localeCompare(a.date))[0]).slice(0,3);
}
function v8ScheduleFrom(r){const d=new Date(r.date+'T12:00:00');d.setMonth(d.getMonth()+1);while(d.toISOString().slice(0,10)<=today())d.setMonth(d.getMonth()+1);const next=d.toISOString().slice(0,10);editSchedule({note:r.note||r.category,category:r.category,subcategory:r.subcategory||'',amount:cents(r.amount),accountId:r.accountId||state.defaultAccount,date:next,anchor:Number(r.date.slice(-2)),frequency:'monthly'})}

function initV8Screens(){
 v8EntryLayout();v8Nav();v8Settings();
 const schedules=settingsOriginals.openSchedules;settingsOriginals.openSchedules=function(){schedules();const d=[...document.querySelectorAll('dialog[open]')].at(-1),ideas=v8RecurringSuggestions();if(!d||!ideas.length)return;const box=node('div','v8-suggest');box.append(node('h3',null,'Looks like it repeats'));for(const r of ideas)box.append(settingsLink((r.note||r.category)+' · '+money(r.amount),'Make recurring',()=>v8ScheduleFrom(r),'calendar','purple'));d.querySelector('.notice')?.after(box)};
 // AMOLED uses its mint accent; text follows the phone's own size setting.
 v7ApplyAccent=function(){const root=document.documentElement,a=v7Accents.mint;root.dataset.amoledAccent='mint';root.style.setProperty('--amoled-accent',a.color);root.style.setProperty('--amoled-tint',a.tint);if(root.dataset.theme==='amoled')palette=a.palette};
 const titles={expenses:'Activity',income:'Activity',calendar:'Leave',invest:'Wealth'};
 const priorRender=render;render=function(){priorRender();if(!state)return;document.documentElement.dataset.textSize='comfortable';
  if(calendarPanel==='budget')calendarPanel='leave';if(titles[page])$('pageTitle').textContent=titles[page];
  $('modernHeaderAdd').classList.toggle('hidden',!['calendar','invest'].includes(page));
  const target=['income','insights'].includes(page)?'expenses':page==='leaveEntry'?'calendar':page==='entry'?entryReturn==='income'?'expenses':entryReturn:page;for(const b of document.querySelectorAll('nav[data-modern] button[data-page]')){const on=b.dataset.page===target;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false')}
  for(const id of ['expenseLabel','incomePeriodLabel']){const el=$(id);if(el)el.textContent=el.textContent.replace(/\d{4}-\d{2}(?!-)/,v8PeriodLabel())}
  v8Activity();v8Wealth();v8HomeNotices();v8AccountsPage();v8SettingsValues()};
 const priorValues=renderSettingsValues;renderSettingsValues=function(){priorValues();v8SettingsValues()};
}

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
 for(const [id,label,glyph,go] of [['home','Home','home',()=>show('home')],['expenses','Activity','Bills',()=>{expenseView='expense';categoryFilter=null;show('expenses')}],['add','Add','',v8AddHere],['calendar','Leave','calendar',()=>{calendarPanel='leave';show('calendar')}],['invest','Wealth','Investments',()=>show('invest')]]){
  const b=action('',go);b.setAttribute('aria-label',id==='add'?'Add expense (hold for voice)':label);const mark=node('span','modern-nav-icon');
  if(id==='add'){b.className='v8-nav-add';b.removeAttribute('data-page');mark.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'}else{b.dataset.page=id;mark.innerHTML=icon(glyph)}
  if(id==='add')v8LongPress(b,()=>openVoice());
  b.append(mark,node('span',null,label));nav.append(b)}
}
// One tap on Add opens what the page is about: leave on Leave, an investment on Wealth, otherwise an expense.
function v8AddHere(){if(page==='calendar')openLeave();else if(page==='invest')openEntry(null,'SIP');else openEntry()}
// Holding Add starts voice entry; the click that follows a long press is ignored.
function v8LongPress(el,fn){let timer=0,fired=false;const cancel=()=>clearTimeout(timer);
 el.addEventListener('pointerdown',()=>{fired=false;timer=setTimeout(()=>{fired=true;fn()},550)});for(const t of ['pointerup','pointerleave','pointercancel'])el.addEventListener(t,cancel);
 el.addEventListener('click',e=>{if(fired){e.stopImmediatePropagation();e.preventDefault();fired=false}},true);el.addEventListener('contextmenu',e=>e.preventDefault())}
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
function settingsBackupFromHome(){show('more');if(window.Android?.connectDrive)return;settingsBackup()}

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

/* ---------- Floating Add expense (most used action) and Google account card ---------- */
function v8GoogleCard(){
 const card=$('v8GoogleCard');if(!card)return;card.replaceChildren();let current='';try{current=String(window.Android?.cloudStatus?.()||'')}catch{}
 const connected=current.startsWith('Connected:'),text=node('span','v8-google-text');
 text.append(node('strong',null,connected?'Google account connected':'Keep your data in Google'),node('small',null,connected?current.replace(/^Connected:\s*/,''):'Sign in once; your records back up to your Google Drive.'));
 const btn=action(connected?'Manage':'Sign in with Google',()=>{if(!connected&&window.Android?.connectDrive)Android.connectDrive();else openCloud()});btn.id='v8GoogleButton';btn.className=connected?'v8-text-button':'primary';
 card.append(node('span','v8-google-mark','G'),text,btn);
}
/* ---------- Recurring entries post themselves on their due date ---------- */
function v8AutoPost(){
 if(!state||!(state.schedules||[]).some(s=>!s.paused&&s.date<=today()))return 0;
 let records=state.records,schedules=state.schedules.map(s=>({...s})),added=0;const known=new Set(records.map(r=>r.occurrence).filter(Boolean));
 for(const s of schedules){let guard=0;while(!s.paused&&s.date<=today()&&guard++<36){const a=account(s.accountId);if(!a||a.archived)break;const token=s.id+':'+s.date;
  if(!known.has(token)){known.add(token);const r={id:uid(),createdAt:Date.now()+added,amount:s.amount/100,category:s.category,subcategory:s.subcategory||'',note:s.note||s.category,date:s.date,accountId:s.accountId,paidBy:'me',occurrence:token};if(kind(s.category)==='aside')r.investment={amc:s.provider||'Recurring plan',scheme:s.note||s.category,group:s.category};records=records.concat(r);added++}
  s.date=nextOccurrence(s.date,s.frequency,s.anchor)}}
 if(added&&update({records,schedules})){message(added===1?'1 recurring entry added':added+' recurring entries added');return added}return 0;
}
/* ---------- Investment types ---------- */
const v8InvestTypes=[['Mutual funds',['Equity','Debt','Hybrid','Index fund','ELSS']],['Stocks',[]],['PPF',[]],['EPF / VPF',['EPF','VPF']],['NPS',['Tier I','Tier II']],['Fixed deposit',[]],['Recurring deposit',[]],['Post office',['NSC','KVP','Monthly income (MIS)','Senior citizen (SCSS)','Time deposit','Post office RD']],['Sukanya Samriddhi',[]],['Gold',['Sovereign gold bond','Gold ETF','Digital gold','Physical gold']],['Bonds',[]],['Insurance (LIC)',[]]];
function v8EnsureInvestTypes(){
 if(!state)return;const taken=new Set(categoryNames(state).map(c=>c.toLocaleLowerCase())),missing=v8InvestTypes.filter(([n])=>!taken.has(n.toLocaleLowerCase()));
 if(missing.length)update({categoryDefinitions:[...(state.categoryDefinitions||[]),...missing.map(([name,subcategories])=>({name,kind:'aside',subcategories}))]});
}
function v8InvestChips(){
 if(kind(category)!=='aside')return;const holder=$('categories'),shown=new Set([...holder.querySelectorAll('button')].map(b=>b.textContent.trim()));
 for(const c of ['Mutual funds','Stocks','PPF','Fixed deposit','Post office','NPS','Gold']){if(shown.has(c)||!categoryNames(state).includes(c))continue;const b=action('',()=>pick(c));b.type='button';const glyph=node('span','v7-category-icon');glyph.innerHTML=icon(c==='Stocks'||c==='Mutual funds'?'Investments':c==='Gold'||c==='PPF'||c==='Post office'?'Savings':'SIP');b.append(glyph,node('span',null,c));b.setAttribute('aria-pressed','false');holder.append(b)}
 // The investment type doubles as its group; only the provider and plan need typing.
 const group=$('v7InvestCategory');if(group&&(!group.value||categoryNames(state).includes(group.value))){group.value=category}
}
/* ---------- Accounts: tap an account for its options ---------- */
function v8AccountSheet(card,a){
 const buttons=[...card.querySelectorAll('.account-actions button, .account-actions summary')].filter(b=>b.tagName==='BUTTON'),find=t=>buttons.find(b=>b.textContent.trim()===t);
 const d=workflowDialog(displayAccountName(a)),head=node('div','v8-sheet-balance');head.append(node('small',null,isCard(a)?'Outstanding':'Balance'),node('strong',null,money(isCard(a)?Math.max(0,-balance(a)):balance(a))));if(a.id===state.defaultAccount)head.append(node('span','pill','Default for spending'));if(a.archived)head.append(node('span','pill','Archived'));d.append(head);
 const list=node('div','settings-list v8-sheet-list');const row=(label,value,original,glyph,tone)=>{const b=original&&find(original);if(!b)return;list.append(settingsLink(label,value||'',()=>{d.close();b.click()},glyph,tone))};
 row('Record bill payment','',`Record bill payment`,'Bills','green');row('View history','All entries','History','insights','blue');row('Edit details','Name, bank, opening balance','Edit','settings','blue');
 if(a.id!==state.defaultAccount)row('Set as default','Used for new expenses','Use as default','accounts','green');row('Reconcile balance','Match with your bank','Reconcile','Bills','purple');row(a.archived?'Unarchive':'Archive',a.archived?'Show again in lists':'Hide without deleting',a.archived?'Unarchive':'Archive','settings','grey');
 d.append(list);const del=find('Delete');if(del){const b=action('Delete account',()=>{d.close();del.click()});b.className='v8-danger';d.append(b)}
}
function v8AccountsLayout(){
 const sec=$('accounts');if(!sec)return;let bar=$('v8AccountBar');if(!bar){bar=node('div','v8-account-bar');bar.id='v8AccountBar';const add=sec.querySelector('.quick-actions button[onclick="openAccount()"]'),transfer=$('transferButton'),cards=$('manageCreditCards');if(add){add.textContent='+ Add account';add.className='primary'}for(const b of [add,transfer,cards])if(b){b.classList.remove('link-button');bar.append(b)}sec.prepend(bar)}
 $('accountList')?.querySelectorAll(':scope > .card').forEach((card,i)=>{const a=state.accounts[i];if(!a||card.dataset.v8)return;card.dataset.v8='1';card.classList.add('v8-account-card');card.classList.toggle('v8-archived',!!a.archived);card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',displayAccountName(a)+' options');const open=e=>{if(e.target.closest('.account-actions'))return;v8AccountSheet(card,a)};card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();v8AccountSheet(card,a)}});const chev=node('span','v8-card-chevron','›');chev.setAttribute('aria-hidden','true');card.querySelector('.account-tile')?.append(chev)});
}
/* ---------- Lists: tap a row to edit; the menu keeps refund, split and delete ---------- */
function v8Rows(el){for(const row of el.querySelectorAll(':scope > .row')){const edit=[...row.querySelectorAll('button')].find(b=>b.textContent.trim()==='Edit'&&!b.closest('details'));if(!edit)continue;edit.classList.add('v8-row-edit');row.classList.add('v8-tap');row.addEventListener('click',e=>{if(e.target.closest('details,button,a,input,select'))return;edit.click()});const more=row.querySelector('.transaction-menu summary');if(more)more.textContent='⋯'}}
/* ---------- Investments use their type as the group, so only provider and plan are typed ---------- */
function v8InvestForm(){const aside=kind(category)==='aside',group=$('v7InvestCategory');if(aside&&group&&(!group.value||categoryNames(state).includes(group.value)))group.value=category;if(aside)for(const id of ['entryTitle','pageTitle'])if($(id)&&/SIP|savings|investment/i.test($(id).textContent))$(id).textContent=(editing?'Edit':'Add')+' investment';if(aside&&$('saveEntry'))$('saveEntry').textContent='Save investment';const fields=$('v7InvestmentFields');if(fields&&$('modernEntryGrid')&&fields.nextElementSibling!==$('v8EntryMeta')){$('v8EntryMeta')?.before(fields)}}
let v8Posting=false;
function initV8Screens(){
 const rowsBefore=rows;rows=function(el,list){rowsBefore(el,list);v8Rows(el)};
 // The settings icon opens Settings directly.
 const gear=document.querySelector('header .header-settings');if(gear){gear.onclick=()=>show('more');gear.setAttribute('aria-label','Settings');gear.innerHTML=icon('settings')}
 v8EnsureInvestTypes();const pickBefore=pick;pick=function(c){pickBefore(c);v8InvestChips();v8InvestForm()};const openBefore=openEntry;openEntry=function(...args){const result=openBefore(...args);if(page==='entry'){v8InvestChips();v8InvestForm();entrySnapshot=formSnapshot()}return result};
 for(const [id,label,ph] of [['v7AMC','Provider','Bank, AMC or post office'],['v7Scheme','Plan / scheme','e.g. Nifty 50 index fund, NSC 5 yr'],['v7InvestCategory','Investment type','']]){const input=$(id);if(!input)continue;const l=document.querySelector('label[for='+id+']');if(l)l.textContent=label;if(ph)input.placeholder=ph}
 v8EntryLayout();v8Nav();v8Settings();
 const google=node('section','v8-google');google.id='v8GoogleCard';document.querySelector('#more .settings-profile')?.after(google);
 const schedules=settingsOriginals.openSchedules;settingsOriginals.openSchedules=function(){schedules();{const n=[...document.querySelectorAll('dialog[open]')].at(-1)?.querySelector('.notice');if(n)n.textContent='Each entry is added automatically on its date and reduces the account balance. Edit or delete it like any other entry.'}const d=[...document.querySelectorAll('dialog[open]')].at(-1),ideas=v8RecurringSuggestions();if(!d||!ideas.length)return;const box=node('div','v8-suggest');box.append(node('h3',null,'Looks like it repeats'));for(const r of ideas)box.append(settingsLink((r.note||r.category)+' · '+money(r.amount),'Make recurring',()=>v8ScheduleFrom(r),'calendar','purple'));d.querySelector('.notice')?.after(box)};
 // Google Drive: offer sign-in on the phone; Google rejects it until the app is registered (docs/GOOGLE_DRIVE_SETUP.md).
 const cloud=settingsOriginals.openCloud;settingsOriginals.openCloud=function(){cloud();const d=[...document.querySelectorAll('dialog[open]')].at(-1),status=$('cloudStatus');if(!d||!status||!window.Android?.connectDrive)return;let current='';try{current=String(Android.cloudStatus?.()||'')}catch{}if(current.startsWith('Connected:'))return;
  status.textContent='Not connected';const note=status.nextElementSibling;if(note)note.textContent='Sign in with Google to keep your records in your Google account and restore them on a new phone. Save a backup file first.';
  const connect=action('Connect Google account',()=>Android.connectDrive());connect.className='primary';connect.id='connectGoogle';(note||status).after(connect)};
 // AMOLED uses its mint accent; text follows the phone's own size setting.
 v7ApplyAccent=function(){const root=document.documentElement,a=v7Accents.mint;root.dataset.amoledAccent='mint';root.style.setProperty('--amoled-accent',a.color);root.style.setProperty('--amoled-tint',a.tint);if(root.dataset.theme==='amoled')palette=a.palette};
 const titles={expenses:'Activity',income:'Activity',calendar:'Leave',invest:'Wealth'};
 const priorRender=render;render=function(){priorRender();if(!state)return;document.documentElement.dataset.textSize='comfortable';
  if(calendarPanel==='budget')calendarPanel='leave';if(titles[page])$('pageTitle').textContent=titles[page];
  $('modernHeaderAdd').classList.add('hidden');
  const target=['income','insights'].includes(page)?'expenses':page==='leaveEntry'?'calendar':page==='entry'?entryReturn==='income'?'expenses':entryReturn:page;for(const b of document.querySelectorAll('nav[data-modern] button[data-page]')){const on=b.dataset.page===target;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'page':'false')}
  for(const id of ['expenseLabel','incomePeriodLabel']){const el=$(id);if(el)el.textContent=el.textContent.replace(/\d{4}-\d{2}(?!-)/,v8PeriodLabel())}
  if(!v8Posting){v8Posting=true;try{v8EnsureInvestTypes();if(v8AutoPost())priorRender()}finally{v8Posting=false}}
  v8AccountsLayout();v8Activity();v8Wealth();v8HomeNotices();v8AccountsPage();v8SettingsValues();v8GoogleCard()};
 const resume=window.onAppResume;window.onAppResume=function(){resume?.();render()};
 const priorValues=renderSettingsValues;renderSettingsValues=function(){priorValues();v8SettingsValues()};
}

// Presentation-only Settings layer: all ledger writes use the existing validated workflows.
let settingsTrail=[],settingsRouting=false,settingsOriginals={},settingsMoved=[],settingsRows=[];
function settingsSnapshot(d){return JSON.stringify([...d.querySelectorAll(d.id==='voiceDialog'?'input,select,textarea':'form input,form select,form textarea,input[type=checkbox]')].map(x=>[x.id,x.value,x.checked]))}
function settingsRestorePanels(){for(const n of settingsMoved)$('settingsLegacy').append(n);settingsMoved=[]}
function settingsMove(n,d){settingsMoved.push(n);d.append(n)}
function settingsDirty(){return [...document.querySelectorAll('dialog[open]')].some(d=>d.dataset.settingsBaseline!==undefined&&settingsSnapshot(d)!==d.dataset.settingsBaseline)}
function settingsDecorate(){if(!document.body.classList.contains('settings-scope'))return;for(const d of document.querySelectorAll('dialog[open]')){d.classList.add('settings-screen');if(d.dataset.settingsBaseline===undefined)d.dataset.settingsBaseline=settingsSnapshot(d);const b=d.querySelector('.dialog-head button');if(b){b.textContent='‹ Back';b.setAttribute('aria-label','Back');b.classList.add('settings-back')}}}
function settingsRun(name,args=[]){
 if(settingsRouting)return settingsOriginals[name](...args);
 if(!document.body.classList.contains('settings-scope'))return settingsOriginals[name](...args);
 const open=document.querySelector('dialog[open]');
 if(open&&name!=='previewImport'&&settingsDirty()&&!confirm('Discard these unsaved changes?'))return;
 const key=name+JSON.stringify(args),i=settingsTrail.findIndex(r=>r.key===key);
 if(i>=0)settingsTrail=settingsTrail.slice(0,i+1);else settingsTrail.push({name,args,key});
 settingsRouting=true;settingsRestorePanels();closeDialogs();for(const d of document.querySelectorAll('dialog'))delete d.dataset.settingsBaseline;
 try{return settingsOriginals[name](...args)}finally{settingsRouting=false;settingsDecorate();renderSettingsValues()}
}
function settingsBack(){
 if(settingsDirty()&&!confirm('Discard these unsaved changes?'))return true;
 settingsTrail.pop();settingsRestorePanels();closeDialogs();
 const parent=settingsTrail.at(-1);if(parent){settingsRouting=true;for(const d of document.querySelectorAll('dialog'))delete d.dataset.settingsBaseline;try{settingsOriginals[parent.name](...parent.args)}finally{settingsRouting=false;settingsDecorate()}}else renderSettingsValues();
 return true;
}
function settingsLink(title,value,fn,glyph='settings',tone='blue'){
 const b=node('button','setting-item');b.type='button';const mark=node('span','setting-icon '+tone);mark.innerHTML=icon(glyph);mark.setAttribute('aria-hidden','true');
 b.append(mark,node('span','setting-title',title),node('span','setting-value',value||''),node('span','setting-chevron','›'));b.onclick=fn;return b;
}
function settingValue(id,value){const el=$('setting-'+id)?.querySelector('.setting-value');if(el)el.textContent=value}
function settingsCount(n,singular,plural=singular+'s'){return n+' '+(n===1?singular:plural)}
function settingsPaymentStatus(){if(!window.Android?.paymentSettings)return 'Android only';try{const s=JSON.parse(Android.paymentSettings());return s.enabled?'Requested':'Off'}catch{return 'Unavailable'}}
function settingsLockStatus(){if(!window.Android?.appLockEnabled)return 'Android only';try{return Android.appLockEnabled()?'On':'Off'}catch{return 'Unavailable'}}
function renderSettingsValues(){if(!$('settingsSearch')||!state)return;
 $('settingsProfileName').textContent=state.profile?.name?.trim()||'Your profile';
 $('settingsProfileInitial').textContent=state.profile?.name?.trim()?.slice(0,1).toUpperCase()||'○';
 const accounts=state.accounts.filter(a=>!a.archived);settingValue('accounts',settingsCount(accounts.length,'account'));
 settingValue('default',account(state.defaultAccount)?displayAccountName(account(state.defaultAccount)):'Not set');settingValue('categories',String(categoryNames(state).length));
 const month=today().slice(0,7);settingValue('budgets',settingsCount((state.budgets||[]).filter(x=>x.month===month).length,'this month','this month'));
 settingValue('recurring',settingsCount((state.schedules||[]).filter(x=>!x.paused).length,'active','active'));
 const persons=new Set([...(state.moneyMoves||[]).map(x=>x.person),...state.records.flatMap(r=>[r.person,r.shared?.person])].filter(Boolean));settingValue('people',settingsCount(persons.size,'person','people'));
 settingValue('capture',settingsPaymentStatus());settingValue('voice',$('voiceLanguage').selectedOptions[0]?.textContent||'Review first');settingValue('appearance',({blue:'Soft sage',teal:'Muted teal',amoled:'AMOLED black'})[document.documentElement.dataset.theme]||'Light');
 const last=backupPrefs().lastSaved;settingValue('backup',last&&!Number.isNaN(Date.parse(last))?new Date(last).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Not yet saved');
 settingValue('import','JSON · CSV');settingValue('lock',settingsLockStatus());settingValue('help','Version 5.7');
}
function filterSettings(){const q=$('settingsSearch').value.trim().toLocaleLowerCase();let count=0;for(const r of settingsRows){const match=!q||(r.search+' '+r.el.textContent).toLocaleLowerCase().includes(q);r.el.hidden=!match;if(match)count++}for(const g of document.querySelectorAll('.settings-section'))g.hidden=![...g.querySelectorAll('.setting-item')].some(x=>!x.hidden);$('settingsEmpty').hidden=count>0;}
function settingsDefault(){const d=workflowDialog('Default spending account');d.classList.add('settings-picker');const a=state.accounts.filter(x=>!x.archived);if(!a.length)d.append(node('p','notice','Add an account first.'),settingsLink('Add an account','',()=>{closeDialogs();openAccount()},'accounts'));for(const x of a)d.append(settingsLink(displayAccountName(x),x.id===state.defaultAccount?'Selected':'',()=>{changeDefault(x.id);settingsDefault()},'accounts'));}
function settingsAppearance(){const d=workflowDialog('Appearance');d.classList.add('settings-picker');for(const [key,title] of [['blue','Soft sage'],['teal','Muted teal'],['amoled','AMOLED black']])d.append(settingsLink(title,document.documentElement.dataset.theme===key?'Selected':'',()=>{setTheme(key);settingsAppearance()},'settings'));}
function settingsPeople(){const d=workflowDialog('People & settlements');d.append(settingsLink('Paid by others','Expenses & repayments',openPeople,'Family','orange'),settingsLink('Reimbursements','Money owed to you',openReimbursements,'income','green'),settingsLink('Lending & borrowing','Loans & settlements',openLoans,'accounts','purple'));}
function settingsCapture(){const d=workflowDialog('Payment capture');d.append(settingsLink('Payment inbox','Review before saving',openPaymentInbox,'Bills','green'),settingsLink('Notification access',settingsPaymentStatus(),openPaymentSettings,'settings','orange'),settingsLink('Paste a payment receipt','Create a draft',openPaymentText,'Bills','blue'));if(!window.Android?.paymentSettings)d.append(node('p','notice','Notification access is available only in the Android app.'));else d.append(node('p','notice','Capture depends on readable payment notifications. Always review drafts.'));}
function settingsVoice(){const d=workflowDialog('Voice entry');d.append(settingsLink('Speaking language',$('voiceLanguage').selectedOptions[0].textContent,settingsVoiceLanguage,'settings','purple'),settingsLink('Start voice entry',window.Android?.startVoice?'Speak, then review':'Typed entry available',()=>openVoice(),'income','blue'));if(!window.Android?.startVoice)d.append(node('p','notice','Native speech is available in the Android app. You can type a command in this preview.'));}
function settingsVoiceLanguage(){const d=workflowDialog('Speaking language');d.classList.add('settings-picker');for(const o of $('voiceLanguage').options)d.append(settingsLink(o.textContent,$('voiceLanguage').value===o.value?'Selected':'',()=>{$('voiceLanguage').value=o.value;$('voiceLanguage').onchange();settingsVoiceLanguage()},'settings'));}
function settingsBackup(){const d=workflowDialog('Backup');const panel=$('backupFrequency').closest('.card');settingsMove(panel,d);panel.querySelector('h2').textContent='Save & restore';d.append(settingsLink('Google Drive','Connection status',openCloud,'accounts','blue'));renderBackupStatus();}
function settingsImport(){const d=workflowDialog('Import/export');d.append(settingsLink('Import CSV','Preview before saving',openImports,'Bills','green'),settingsLink('Export financial CSV','Selected report period',()=>csv(),'Bills','blue'),settingsLink('Full backup & restore','JSON',settingsBackup,'accounts','purple'),settingsLink('Insights & reports','Choose dates & compare',()=>{closeDialogs();show('insights')},'insights','orange'));}
function settingsHelp(){const d=workflowDialog('Help & app information');d.append(node('h3',null,'Money Map'),node('p','notice','Version 5.7'),node('p','notice','Records save on this device. Export a backup to keep a separate copy.'));for(const [title,body] of [['Accounts & cards','Add bank, cash and wallet balances under Accounts & cards. Credit-card balances represent debt, separately from available cash.'],['Transfers & card bills','Record movement between your accounts as a transfer. A card-bill payment is not a second expense.'],['People & settlements','Track expenses paid by someone else, reimbursements and loans separately.'],['Voice & payment capture','Both prepare drafts. Check the amount, date, category and account before saving.'],['Google Drive','Settings → Backup & export → Google Drive → Connect Google account. Sign-in works once the app is registered with Google; manual backup files always work.']]){const details=node('details');details.append(node('summary',null,title),node('p','notice',body));d.append(details)}d.append(settingsLink('Insights & reports','Charts & date filters',()=>{closeDialogs();show('insights')},'insights'));}
function settingsAccounts(){closeDialogs();show('accounts');$('pageTitle').textContent='Accounts & cards';}
function initCompactSettings(){
 const pageEl=$('more'),legacy=node('div','hidden');legacy.id='settingsLegacy';legacy.append(...pageEl.childNodes);pageEl.append(legacy);
 const profile=node('button','settings-profile');profile.type='button';profile.innerHTML='<span id="settingsProfileInitial" aria-hidden="true"></span><span><strong id="settingsProfileName"></strong><small>Personal details</small></span><span class="setting-chevron">›</span>';profile.onclick=()=>openProfile();pageEl.append(profile);
 const search=node('input','settings-search');search.id='settingsSearch';search.type='search';search.placeholder='Search settings';search.setAttribute('aria-label','Search settings');search.oninput=filterSettings;pageEl.append(search);
 const sections=[['Accounts',[
 ['accounts','Accounts & cards','bank cash wallet transfer reconcile archive',settingsAccounts,'accounts','blue'],['default','Default spending account','bank automatic payments',settingsDefault,'accounts','green'],['categories','Categories','income expense sip savings',settingsCategories,'Food','orange']]],
 ['Planning',[
 ['budgets','Budgets','limits monthly',openBudgets,'insights','green'],['recurring','Recurring entries','repeat salary bills rent sip',openSchedules,'calendar','purple'],['people','People & settlements','paid by others repayments loans borrow reimbursements',settingsPeople,'Family','orange']]],
 ['Preferences',[
 ['capture','Payment capture','notifications inbox google pay phonepe cred paytm receipt',settingsCapture,'Bills','green'],['voice','Voice entry','speech hindi english language',settingsVoice,'income','blue'],['appearance','Appearance','theme dark amoled light',settingsAppearance,'settings','purple']]],
 ['Data & security',[
 ['backup','Backup','save restore google drive recovery',settingsBackup,'accounts','blue'],['import','Import/export','csv json reports insights',settingsImport,'Bills','green'],['lock','App lock','privacy screen pin security',openPrivacy,'settings','grey']]],
 ['Help',[
 ['help','Help & app information','about version support',settingsHelp,'settings','grey']]]];
 for(const [title,items] of sections){const section=node('section','settings-section');section.append(node('h2','settings-section-title',title));const list=node('div','settings-list');for(const [id,label,keywords,fn,glyph,tone] of items){const row=settingsLink(label,'',()=>window[fn.name](),glyph,tone);row.id='setting-'+id;settingsRows.push({el:row,search:title+' '+label+' '+keywords});list.append(row)}section.append(list);pageEl.append(section)}
 const empty=node('p','empty','No matching settings. Try “backup”, “card” or “theme”.');empty.id='settingsEmpty';empty.hidden=true;empty.setAttribute('role','status');pageEl.append(empty);
 const names=['openProfile','openCloud','openCards','openCard','openBudgets','editBudget','openSchedules','editSchedule','openLoans','editLoan','openReimbursements','openSharedExpense','collectReimbursement','openPeople','openRepayment','openPersonRepayment','openPaymentInbox','openPaymentSettings','openImports','previewImport','openPaymentText','openPrivacy','openVoice','settingsDefault','settingsAppearance','settingsCategories','categoryDetails','addCategoryForm','settingsPeople','settingsCapture','settingsVoice','settingsVoiceLanguage','settingsBackup','settingsImport','settingsHelp','settingsAccounts','openHistory','openReconcile','openAdjustments'];
 for(const name of names){if(typeof window[name]!=='function')continue;settingsOriginals[name]=window[name];window[name]=function(...args){return settingsRun(name,args)}}
 // Shared dialog layouts become full screens only while navigating Settings.
 const oldDialog=workflowDialog;workflowDialog=function(title){settingsRestorePanels();const d=oldDialog(title);d.classList.remove('settings-picker');delete d.dataset.settingsBaseline;queueMicrotask(settingsDecorate);return d};
 document.addEventListener('click',e=>{if(!document.body.classList.contains('settings-scope'))return;const button=e.target.closest('dialog.settings-screen .dialog-head button');if(button){e.preventDefault();e.stopImmediatePropagation();settingsBack()}},true);
 document.addEventListener('cancel',e=>{if(e.target.matches('dialog.settings-screen')){e.preventDefault();e.stopImmediatePropagation();settingsBack()}},true);
 // Preserve a draft if the user cancels Back; only actual field changes trigger the guard.
 const oldBack=window.handleAppBack;window.handleAppBack=function(){if(document.body.classList.contains('settings-scope')&&document.querySelector('dialog.settings-screen[open]'))return settingsBack();return oldBack()};
 const oldShow=show;show=function(next){const result=oldShow(next);if(result===false)return result;document.body.classList.toggle('entry-focus',page==='entry');const scope=['more','accounts','accountEntry','transferEntry'].includes(page);document.body.classList.toggle('settings-scope',scope);document.body.classList.toggle('settings-root',page==='more');if(!scope){settingsTrail=[];settingsRestorePanels()}$('settingsPageBack').classList.toggle('hidden',!['accounts','accountEntry','transferEntry','insights','entry'].includes(page));if(page==='accounts')$('pageTitle').textContent='Accounts & cards';renderSettingsValues();return result};
 const back=node('button','hidden');back.id='settingsPageBack';back.type='button';back.textContent='‹';back.setAttribute('aria-label','Back');back.onclick=()=>window.handleAppBack();document.querySelector('header').prepend(back);
 const cardsButton=action('Credit cards',()=>openCards());cardsButton.id='manageCreditCards';$('accounts').prepend(cardsButton);
 const oldRender=render;render=function(){oldRender();renderSettingsValues()};
 document.addEventListener('close',e=>{if(!e.target.matches('dialog'))return;queueMicrotask(()=>{if(!document.querySelector('dialog[open]')){settingsRestorePanels();settingsTrail=[]}renderSettingsValues()})},true);
 // True device state, never an optimistic status after requesting permission.
 const oldResume=window.onAppResume;window.onAppResume=function(){oldResume?.();renderSettingsValues()};
 renderSettingsValues();
}

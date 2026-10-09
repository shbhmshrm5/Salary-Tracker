let repaymentRecord=null;
function initDesign(){
  $('form').onsubmit=saveExpenseEntry;
  $('home').innerHTML=`<div class="balance-hero"><small>Available balance · today</small><strong id="left">₹0</strong></div>
    <div id="homeAccounts" class="account-stack"></div><div id="accountNotice" class="notice"></div>
    <button class="accounts-link" onclick="show('accounts')" id="allAccountsLink">View accounts →</button>
    <div class="spending-card"><h2>Spending breakdown</h2><small id="homePeriodLabel"></small><div id="homeDonut"></div>
    <div id="paidOthersSummary" class="paid-others hidden"></div><button class="insights-link" onclick="show('insights')">See insights →</button></div>
    <div class="section-head"><h2>Recent transactions</h2><button class="link-button" onclick="show('expenses')">View all</button></div><div id="recentRows"></div>
    <div class="hidden" aria-hidden="true"><span id="spent"></span><div id="expenseTiles"></div><button id="allCategoryTiles"></button></div>
    <div class="action-dock"><button class="floating" onclick="openEntry()">+ Add expense</button></div>`;
  const settings=node('button','header-settings');settings.type='button';settings.setAttribute('aria-label','Settings');settings.innerHTML=icon('settings');settings.onclick=()=>show('more');document.querySelector('header').append(settings);
  const appearance=document.querySelector('.theme-choices');appearance.innerHTML=[['blue','Soft blue','Light & clear'],['teal','Muted teal','Light & calm'],['amoled','AMOLED black','True black']].map(([key,title,desc])=>`<button class="theme-choice" data-theme-choice="${key}" onclick="setTheme('${key}')"><div class="theme-swatch ${key}">₹</div><strong>${title}</strong><small>${desc}</small></button>`).join('');
  const more=$('more'),people=node('button','settings-row'),cal=node('button','settings-row');
  people.innerHTML='<span>Paid by others<small>People, outstanding amounts and repayments</small></span>→';people.onclick=openPeople;
  cal.innerHTML='<span>Leave calendar<small>Record and review your time off</small></span>→';cal.onclick=()=>show('calendar');more.prepend(people,cal);
  const payer=node('div');payer.id='payerFields';payer.innerHTML=`<label for="paidBy">Paid by</label><select id="paidBy" onchange="syncPayer()"><option value="me">Me</option><option value="other">Someone else</option></select><div id="otherPayerFields" class="hidden"><label for="payerName">Who paid?</label><input id="payerName" list="payerNames" maxlength="40" placeholder="e.g. Father"><datalist id="payerNames"></datalist><label for="repayNeeded">Repayment</label><select id="repayNeeded"><option value="no">No repayment needed</option><option value="yes">I’ll repay them</option></select><p class="notice">Included in your spending. Your account balance stays unchanged until you repay.</p></div>`;
  $('entryAccountLabel').before(payer);
  document.querySelector('main').insertAdjacentHTML('beforeend',`<dialog id="peopleDialog" aria-labelledby="peopleTitle"><div class="dialog-head"><h2 id="peopleTitle">Paid by others</h2><button onclick="$('peopleDialog').close()" aria-label="Close paid by others">✕</button></div><p class="notice">All dates · amounts outstanding as of today. Tap an expense to see or record repayments.</p><div id="peopleRows"></div></dialog><dialog id="repayDialog" aria-labelledby="repayTitle"><div class="dialog-head"><h2 id="repayTitle">Repayment</h2><button onclick="$('repayDialog').close()" aria-label="Close repayment">✕</button></div><p id="repayContext" class="notice"></p><form id="repayForm"><label for="repayAccount">Pay from</label><select id="repayAccount" required></select><label for="repayAmount">Amount in rupees</label><input id="repayAmount" type="number" inputmode="decimal" min="0.01" step="0.01" required><label for="repayDate">Date</label><input id="repayDate" type="date" required><p class="notice">Reduces this account’s balance. This is not counted as another expense.</p><button class="primary" type="submit">Save repayment</button></form><div id="repayHistory"></div></dialog>`);
  $('repayForm').onsubmit=saveRepayment;
  // A single source filter and search work across the existing expense history.
  $('clearFilter').after(Object.assign(node('input','transaction-search'),{id:'expenseSearch',type:'search',placeholder:'Search expenses',ariaLabel:'Search expenses'}));
  $('expenseSearch').oninput=()=>render();
}
function setTheme(name,save=true){
  // Upgrade older appearance preferences without changing ledger data.
  name=({ink:'amoled',tangerine:'blue'}[name]||name);if(!['blue','teal','amoled'].includes(name))name='blue';
  if(save)try{localStorage.setItem('salary-theme',name)}catch{message('Could not save theme');return}
  document.documentElement.dataset.theme=name;
  palette=name==='teal'?['#236671','#4995a0','#8dc4cc','#c3e2e7']:name==='amoled'?['#a9caff','#739bce','#46678e','#2c4059']:['#365d90','#588ccc','#97bcec','#c8ddf7'];
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.themeChoice===name));
  if(window.Android&&typeof Android.setTheme==='function')Android.setTheme(name);
  if($('month')?.value&&$('homeDonut')&&state)render();
}
function preparePayer(r){
  $('paidBy').value=r?.paidBy==='other'?'other':'me';$('payerName').value=r?.person||'';$('repayNeeded').value=r?.repayNeeded?'yes':'no';
  $('payerNames').replaceChildren();for(const name of new Set(['Father','Mother','Wife',...state.records.filter(x=>x.paidBy==='other').map(x=>x.person)])){$('payerNames').append(Object.assign(node('option'),{value:name}))}
  syncPayer();
}
function syncPayer(){
  const expense=kind(category)==='expense',other=expense&&$('paidBy').value==='other',original=state?.records.find(r=>r.id===editing);
  $('payerFields').classList.toggle('hidden',!expense);$('otherPayerFields').classList.toggle('hidden',!other);
  $('payerName').required=other;$('payerName').disabled=!other;$('repayNeeded').disabled=!other;
  for(const id of ['entryAccountLabel','entryAccount','entryAccountHint'])$(id).classList.toggle('hidden',other);
  $('entryAccount').disabled=other;$('entryAccount').required=!other&&!(original&&!original.accountId&&original.paidBy!=='other');
  if(!other&&!state?.accounts.length)$('entryAccountHint').innerHTML='Add an account in More → Accounts, or select Someone else if they paid.';
}
function saveExpenseEntry(e){
  e.preventDefault();const amount=cents(Number($('amount').value)),date=$('date').value,other=kind(category)==='expense'&&$('paidBy').value==='other';
  if(!Number.isSafeInteger(amount)||amount<=0||!validDate(date))return;
  const old=state.records.find(r=>r.id===editing),accountId=other?null:$('entryAccount').value||null;
  if(!other&&!accountId&&!(old&&!old.accountId&&old.paidBy!=='other')){message('Choose an account in More → Accounts first');return}
  const r={...old,id:editing||uid(),createdAt:old?.createdAt||Date.now(),amount:amount/100,category,date,note:$('note').value.trim(),accountId,paidBy:other?'other':'me'};
  if(other){r.person=canonicalPerson($('payerName').value);r.repayNeeded=$('repayNeeded').value==='yes';if(!r.person){message('Enter who paid');return}}
  if((old?.repayments||[]).length){
    if(!other||!r.repayNeeded){message('This expense has repayments. Keep Someone else and repayment enabled, or remove those repayments first.');return}
    r.repayments=old.repayments;
    if(amount<repaidCents(old)||r.repayments.some(p=>p.date<date)){message('The expense must cover repayments and be dated on or before them.');return}
  }
  if(!other&&!confirmOutflow(accountId,kind(category)==='income'?-amount:amount,date,'record',editing))return;if(update({records:state.records.filter(x=>x.id!==editing).concat(r)})){reportMode='month';$('month').value=date.slice(0,7);categoryFilter=null;$('expenseSearch').value='';$('note').value='';$('amount').value='';$('date').value=today();editing=null;show(entryReturn);message('Entry saved')}
}
function renderDesign(list){
  $('pageTitle').textContent=page==='home'?'Hi, Shubham':page==='more'?'Settings':$('pageTitle').textContent;
  $('headerSubtitle').classList.toggle('hidden',page==='home');
  $('allAccountsLink').textContent=state.accounts.length+' accounts · View all →';$('allAccountsLink').classList.toggle('hidden',!state.accounts.length);
  // Turn the same account tiles into compact swipeable cards on Home only.
  for(const tile of $('homeAccounts').children){tile.setAttribute('role','button');tile.tabIndex=0;tile.onclick=()=>show('accounts');tile.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();show('accounts')}}}
  $('homePeriodLabel').textContent=(reportMode==='month'?new Date($('month').value+'-01T12:00:00').toLocaleDateString('en-IN',{month:'long'}):reportRange().label)+' · share of expenses';
  const expenses=list.filter(r=>kind(r.category)==='expense');drawHomeDonut(expenses);
  const outside=expenses.filter(r=>r.paidBy==='other').reduce((s,r)=>s+cents(r.amount),0),owed=state.records.reduce((s,r)=>s+owedCents(r),0);
  const details=$('paidOthersSummary');details.replaceChildren();details.classList.toggle('hidden',!outside&&!owed);
  if(outside)details.append(node('span',null,'Includes '+money(outside/100)+' paid by others'));
  if(owed){const b=node('button','link-button',money(owed/100)+' to repay · View');b.onclick=openPeople;details.append(b)}
  const recent=$('recentRows');recent.replaceChildren();if(!list.length)recent.append(node('p','empty','Your recent entries will appear here.'));
  for(const r of list.slice(0,3)){
    const row=node('button','recent-row');row.type='button';const glyph=node('span','transaction-icon');glyph.innerHTML=icon(r.category);
    const text=node('span','transaction-text');text.append(node('strong',null,r.note||r.category),node('small',null,r.category+' · '+(r.paidBy==='other'?'Paid by '+r.person:(account(r.accountId)?displayAccountName(account(r.accountId)):'Unassigned'))));
    row.append(glyph,text,node('strong','transaction-amount',(kind(r.category)==='income'?'+':'−')+money(r.amount)));row.onclick=()=>openEntry(r.id);recent.append(row);
  }
  const query=($('expenseSearch')?.value||'').trim().toLowerCase();if(query)rows($('expenseRows'),list.filter(r=>kind(r.category)===expenseView&&(!categoryFilter||r.category===categoryFilter)&&[r.note,r.category,r.person,account(r.accountId)?.name].join(' ').toLowerCase().includes(query)));
  $('accountCount').textContent=state.accounts.length+' bank, cash and wallet accounts';
}
function drawHomeDonut(expenses){
  const holder=$('homeDonut');holder.replaceChildren();const sums=new Map();for(const r of expenses)sums.set(r.category,(sums.get(r.category)||0)+cents(r.amount));
  let values=[...sums].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value),total=values.reduce((s,v)=>s+v.value,0);
  if(values.length>4)values=[...values.slice(0,3),{label:'Other categories',value:values.slice(3).reduce((s,v)=>s+v.value,0)}];
  if(!total){holder.append(node('p','empty','Add your first expense to see where your money goes.'));return}
  const chart=node('div','donut'),legend=node('div','donut-legend');let offset=0;const segments=values.map((v,i)=>{const pct=v.value/total*100;const svg=`<circle cx="80" cy="80" r="61" pathLength="100" fill="none" stroke="${palette[i]}" stroke-width="19" stroke-dasharray="${Math.max(.05,pct-(values.length>1?.7:0))} ${100-Math.max(.05,pct-(values.length>1?.7:0))}" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"/>`;offset+=pct;return svg}).join('');
  chart.innerHTML=`<svg viewBox="0 0 160 160" role="img" aria-label="Spending by category; amounts and percentages beside the chart">${segments}</svg><div class="donut-centre"><strong>${money(total/100)}</strong><small>Spent</small></div>`;
  values.forEach((v,i)=>{const row=node('button','donut-item'),dot=node('i','dot');dot.style.background=palette[i];const text=node('span','donut-label');text.append(node('span',null,v.label),node('small',null,money(v.value/100)));row.append(dot,text,node('strong',null,(v.value/total*100).toFixed(1)+'%'));row.onclick=()=>{expenseView='expense';categoryFilter=v.label==='Other categories'?'__other':v.label;otherCategoryNames=[...sums.keys()].filter(c=>!values.slice(0,3).some(v=>v.label===c));show('expenses')};legend.append(row)});
  holder.append(chart,legend);
}
function openPeople(){
  const el=$('peopleRows');el.replaceChildren();const list=state.records.filter(r=>r.paidBy==='other').sort((a,b)=>b.date.localeCompare(a.date));
  el.append(node('div','owed-total','To repay · '+money(list.reduce((s,r)=>s+owedCents(r),0)/100)));
  if(!list.length)el.append(node('p','empty','Choose Someone else while adding an expense.'));
  for(const r of list){const row=node('button','person-row');const text=node('span');text.append(node('strong',null,r.person),node('small',null,(r.note||r.category)+' · '+displayDate(r.date)),node('small',null,r.repayNeeded?(r.date>today()?'Future expense':owedCents(r)>0?money(owedCents(r)/100)+' to repay':'Repaid'):'No repayment needed'));row.append(text,node('strong',null,money(r.amount)));row.onclick=()=>{if(r.repayNeeded){$('peopleDialog').close();openRepayment(r.id)}else{$('peopleDialog').close();openEntry(r.id)}};el.append(row)}
  if(!$('peopleDialog').open)$('peopleDialog').showModal();
}
function openRepayment(id){
  const r=state.records.find(r=>r.id===id);if(!r||!r.repayNeeded)return;repaymentRecord=id;
  const left=owedCents(r);$('repayTitle').textContent='Repay '+r.person;$('repayContext').textContent=(r.note||r.category)+' · '+money(r.amount)+' originally · '+money(left/100)+' outstanding';
  fillAccounts('repayAccount',state.defaultAccount);$('repayAmount').value=left/100;$('repayAmount').max=left/100;$('repayDate').value=today();$('repayDate').max=today();$('repayDate').min=r.date;
  $('repayForm').classList.toggle('hidden',!left||!state.accounts.length);
  const history=$('repayHistory');history.replaceChildren();if(!state.accounts.length&&left)history.append(node('p','notice','Add a bank, cash or wallet account in Settings before recording a repayment.'));
  for(const p of r.repayments||[]){const row=node('div','repay-row'),text=node('span');text.append(node('strong',null,money(p.amount/100)),node('small',null,account(p.accountId)?.name+' · '+displayDate(p.date)));const del=node('button','link-button','Remove');del.onclick=()=>{if(confirm('Remove this repayment? Its amount will return to the account balance.')&&update({records:state.records.map(x=>x.id===id?{...x,repayments:x.repayments.filter(y=>y.id!==p.id)}:x)})){render();openRepayment(id)}};row.append(text,del);history.append(row)}
  if(!$('repayDialog').open)$('repayDialog').showModal();
}
function saveRepayment(e){
  e.preventDefault();const r=state.records.find(x=>x.id===repaymentRecord),a=account($('repayAccount').value),amount=cents(Number($('repayAmount').value)),date=$('repayDate').value;
  if(!r||!a||!Number.isSafeInteger(amount)||amount<=0||amount>cents(r.amount)-repaidCents(r)||!validDate(date)||date>today()||date<r.date||date<a.date){message('Check amount and date. Repayment must be after the expense and account opening.');return}
  const p={id:uid(),accountId:a.id,amount,date};if(update({records:state.records.map(x=>x.id===r.id?{...x,repayments:[...(x.repayments||[]),p]}:x)})){render();openRepayment(r.id);message('Repayment saved')}
}
function exportFinancialCsv(){
  if(!state)return;const range=reportRange(),data=[];
  for(const r of state.records){if(inRange(r.date,range))data.push([r.date,r.category,kind(r.category),r.amount,account(r.accountId)?.name||'', '',r.note,r.paidBy==='other'?r.person:'Me',r.paidBy==='other'?(r.repayNeeded?'Yes':'No'):'',r.id]);for(const p of r.repayments||[])if(inRange(p.date,range))data.push([p.date,'Repayment','repayment',p.amount/100,account(p.accountId)?.name||'',r.person,'Repayment for '+r.category,'Me','',r.id])}
  for(const t of state.transfers.filter(t=>inRange(t.date,range)))data.push([t.date,'Transfer','transfer',t.amount/100,account(t.from).name,account(t.to).name,'','Me','','']);
  data.sort((a,b)=>a[0].localeCompare(b[0]));download('Salary-'+range.label.replace(/[^a-z0-9-]/gi,'_')+'.csv',csvText(['Date','Category','Type','Amount INR','Account','To account or person','Note','Paid by','Repayment needed','Expense ID'],data),'text/csv');
}

// v4 presentation and optional investment labels. Ledger balances still use the existing records.
let v7InvestView='amc',v7SpendExpanded=false;
function v7ExpenseCategories(){
 const holder=$('categories'),selected=category,mode=kind(category),names=categoryNames(state).filter(c=>kind(c)===mode);
 holder.replaceChildren();holder.className='categories v7-category-grid';
 const featured=mode==='income'?['Salary','Bonus','Freelance','Interest','Gift','Other income']:mode==='aside'?['SIP','Investments','Savings']:['Food','Groceries','Travel','Shopping','Bills','Health'];
 const shown=[...new Set([...featured.filter(c=>names.includes(c)),...(featured.includes(selected)?[]:[selected])])];
 for(const c of shown){const b=action('',()=>pick(c));b.type='button';b.className=c===selected?'selected':'';const glyph=node('span','v7-category-icon');glyph.innerHTML=icon(c);b.append(glyph,node('span',null,c==='Other income'?'Other':c));b.setAttribute('aria-pressed',String(c===selected));holder.append(b)}
 const more=$('moreCategories');more.classList.remove('hidden');more.textContent='All categories';more.onclick=()=>{const d=workflowDialog('Choose category');const search=node('input');search.type='search';search.placeholder='Search categories';d.append(search);const list=node('div','v7-choice-list');d.append(list);const draw=()=>{list.replaceChildren();for(const c of names.filter(x=>x.toLowerCase().includes(search.value.toLowerCase()))){const b=action(c,()=>{d.close();pick(c)});list.append(b)}};search.oninput=draw;draw()};
 v7Subcategories();v7InvestmentVisibility();
}
function v7Subcategories(){
 const group=$('entrySubcategoryGroup'),select=$('entrySubcategory');let chips=$('v7SubcategoryChips');if(!chips){chips=node('div','v7-chips');chips.id='v7SubcategoryChips';group.append(chips)}chips.replaceChildren();
 const children=categoryChildren(category);group.hidden=!children.length;for(const s of children){const b=action(s,()=>{select.value=select.value===s?'':s;v7Subcategories()});b.type='button';b.classList.toggle('selected',select.value===s);b.setAttribute('aria-pressed',String(select.value===s));chips.append(b)}
}
function v7InvestmentVisibility(){const el=$('v7InvestmentFields');if(!el)return;el.hidden=kind(category)!=='aside';for(const input of el.querySelectorAll('input'))input.required=!el.hidden}
function v7Home(list){
 const liquid=state.accounts.filter(a=>!a.archived&&!isCard(a)),sum=arr=>arr.reduce((n,a)=>n+cents(balance(a)),0)/100;
 $('left').textContent=money(sum(liquid));const wallet=a=>['Google Pay','CRED','PhonePe','Other wallet'].includes(a.bank);const groups=[['Bank accounts',liquid.filter(a=>a.bank!=='Cash'&&!wallet(a))],['Wallets',liquid.filter(wallet)],['Cash',liquid.filter(a=>a.bank==='Cash')],['Credit cards',state.accounts.filter(a=>!a.archived&&isCard(a))]];
 const stack=$('homeAccounts');stack.replaceChildren();for(const [label,arr] of groups){const value=label==='Credit cards'?arr.reduce((n,a)=>n+Math.max(0,-cents(balance(a))),0)/100:sum(arr),b=action('',()=>{if(label==='Credit cards'){salaryPanel='cards';show('income')}else{v7AccountType=label;show('accounts')}});b.className='v7-money-cell';const glyph=node('span','v7-money-icon');glyph.innerHTML=icon(label==='Bank accounts'?'accounts':label==='Wallets'?'wallet':label==='Cash'?'income':'Bills');b.append(glyph,node('span','v7-money-label',label),node('strong',null,money(value)));if(label==='Credit cards')b.append(node('small','v7-owed','owed'));stack.append(b)}
 const chart=$('homeDonut');modernRing(chart,state.records.filter(r=>inRange(r.date,reportRange())&&kind(r.category)==='expense'));chart.querySelector('h2')?.remove();const head=$('home').querySelector('.spending-card>h2');if(head)head.textContent='Spending · '+reportRange().label;
}
let v7AccountType='';
function v7Accounts(){const list=$('accountList');if(!list)return;for(const card of [...list.children]){const a=state.accounts[[...list.children].indexOf(card)];if(!a)continue;const bank=a.bank==='Cash'?'Cash':['Google Pay','CRED','PhonePe','Other wallet'].includes(a.bank)?'Wallets':isCard(a)?'Credit cards':'Bank accounts';card.hidden=!!v7AccountType&&v7AccountType!==bank}const title=$('accountCount');if(title&&v7AccountType)title.textContent=v7AccountType+' · '+[...list.children].filter(c=>!c.hidden).length}
function v7Salary(){
 const body=$('modernSalaryBody'),fy=$('modernFY');let history=$('v7SalaryHistory');if(!history){history=node('details','v7-history');history.id='v7SalaryHistory';history.append(node('summary',null,'Income history & financial year'));body.append(history);history.append(fy)}
 const rowsEl=$('incomeRows'),data=modernRecords().filter(r=>kind(r.category)==='income');rowsEl.replaceChildren();rows(rowsEl,data.slice(0,3));const full=$('v7SalaryEntries')||node('div');full.id='v7SalaryEntries';full.replaceChildren();rows(full,data);if(full.parentElement!==history)history.prepend(full);
 const latest=$('modernSalaryHero');const schedule=(state.schedules||[]).some(s=>s.category==='Salary'&&!s.paused);const set=latest.querySelector('.link-button');if(set&&!schedule)set.remove();
}
function v7Spend(){
 const section=$('expenses'),source=$('expenseRows');let preview=$('v7RecentSpend'),history=$('v7SpendHistory');if(!preview){preview=node('div');preview.id='v7RecentSpend';history=node('details','v7-history');history.id='v7SpendHistory';history.append(node('summary',null,'View all transactions'));section.append(preview,history);history.append($('expenseSearch'),$('clearFilter'),source)}
 const q=$('expenseSearch').value.trim().toLowerCase(),data=modernRecords().filter(r=>kind(r.category)==='expense'&&(!categoryFilter||(categoryFilter==='__other'?otherCategoryNames.includes(r.category):r.category===categoryFilter))&&(!q||[r.note,r.category,r.subcategory,r.person,account(r.accountId)?.name,r.amount,r.date].join(' ').toLowerCase().includes(q)));
 preview.replaceChildren();if(!data.length)preview.append(node('p','empty','No expenses in this period.'));else{rows(preview,data.slice(0,3));const heading=node('h2',null,'Recent expenses');preview.prepend(heading)}
 if(q||categoryFilter)history.open=true;
}
function v7Calendar(){
 const leave=$('modernLeaveBody');let details=$('v7LeaveHistory');if(!details){details=node('details','v7-history');details.id='v7LeaveHistory';details.append(node('summary',null,'Leave history & reports'));leave.append(details);for(const id of ['leavePeriodSwitch','leaveYearRow','leaveCustom','leavePeriodCaption','leaveRows'])details.append($(id));const section=[...leave.querySelectorAll('.section-head')].find(x=>x.textContent.includes('Leave entries'));if(section)details.prepend(section)}
}
function v7InvestmentForm(){
 let wrap=$('v7InvestmentFields');if(!wrap){wrap=node('div','v7-investment-fields');wrap.id='v7InvestmentFields';for(const [id,label,placeholder] of [['v7AMC','AMC / provider','e.g. HDFC Mutual Fund'],['v7Scheme','Scheme / investment','e.g. Nifty 50 Index Fund'],['v7InvestCategory','Investment category','e.g. Index fund']]){const l=node('label',null,label),input=node('input');input.id=id;input.type='text';input.maxLength=60;input.placeholder=placeholder;l.htmlFor=id;wrap.append(l,input)}$('modernEntryGrid').before(wrap)}v7InvestmentVisibility();
}
function v7Invest(){
 const el=$('invest'),records=state.records.filter(r=>kind(r.category)==='aside'&&r.date<=today()),total=records.reduce((n,r)=>n+reportCents(r),0),month=records.filter(r=>r.date.slice(0,7)===today().slice(0,7)).reduce((n,r)=>n+reportCents(r),0);el.replaceChildren();
 const hero=node('div','v7-invest-hero');hero.append(node('small',null,'Invested · recorded manually'),node('strong',null,money(total/100)),node('span',null,money(month/100)+' added this month'));el.append(hero);
 el.append(modernTabs([['amc','By AMC'],['category','By category']],v7InvestView,k=>{v7InvestView=k;v7Invest()}));
 const map=new Map();for(const r of records){const name=(v7InvestView==='amc'?r.investment?.amc:r.investment?.group)||'Uncategorised';if(!map.has(name))map.set(name,{sum:0,schemes:new Set()});const g=map.get(name);g.sum+=reportCents(r);g.schemes.add(r.investment?.scheme||r.category)}
 if(!map.size)el.append(node('p','empty','Record an investment to see it here.'));
 for(const [name,g] of [...map].sort((a,b)=>b[1].sum-a[1].sum)){const b=action('',()=>v7InvestmentDetail(name,records));b.className='v7-invest-row';b.append(node('span',null,name),node('small',null,g.schemes.size+' '+(g.schemes.size===1?'scheme':'schemes')),node('strong',null,money(g.sum/100)));el.append(b)}
 const plans=(state.schedules||[]).filter(s=>kind(s.category)==='aside');const plan=action('SIP plans · '+plans.length+'  ›',()=>openSchedules());plan.className='v7-compact-link';el.append(plan,action('Investment history  ›',()=>v7InvestmentDetail(null,records)));el.lastChild.className='v7-compact-link';
}
function v7InvestmentDetail(name,records){const d=workflowDialog(name||'Investment history'),list=records.filter(r=>!name||((v7InvestView==='amc'?r.investment?.amc:r.investment?.group)||'Uncategorised')===name).sort((a,b)=>b.date.localeCompare(a.date));for(const r of list){const b=action('',()=>{d.close();openEntry(r.id)});b.className='v7-invest-row';b.append(node('span',null,r.investment?.scheme||r.category),node('small',null,displayDate(r.date)+' · '+(r.investment?.amc||'Uncategorised')),node('strong',null,money(r.amount)));d.append(b)}if(!list.length)d.append(node('p','empty','No entries yet.'))}
function v7SaveEntry(e){
 e.preventDefault();const amount=cents(Number($('amount').value)),date=$('date').value,other=kind(category)==='expense'&&$('paidBy').value==='other';if(!Number.isSafeInteger(amount)||amount<=0||!validDate(date))return;
 const old=state.records.find(r=>r.id===editing),accountId=other?null:$('entryAccount').value||null;if(!other&&!accountId&&!(old&&!old.accountId&&old.paidBy!=='other')){message('Choose an account first');return}
 const r={...old,id:editing||uid(),createdAt:old?.createdAt||Date.now(),amount:amount/100,category,subcategory:$('entrySubcategory')?.value||'',date,note:$('note').value.trim(),accountId,paidBy:other?'other':'me'};
 if(typeof paymentDraftOrigin!=='undefined'&&paymentDraftOrigin&&!editing){r.paymentDraftId=paymentDraftOrigin.id;r.paymentReference=paymentDraftOrigin.reference||''}
 if(other){r.person=canonicalPerson($('payerName').value);r.repayNeeded=$('repayNeeded').value==='yes';if(!r.person){message('Enter who paid');return}}
 if((old?.repayments||[]).length){if(!other||!r.repayNeeded){message('This expense has repayments. Keep the repayment setting or remove those repayments first.');return}r.repayments=old.repayments;if(amount<repaidCents(old)||r.repayments.some(p=>p.date<date)){message('Check the amount and date against existing repayments.');return}}
 if(kind(category)==='aside'){const amc=$('v7AMC').value.trim(),scheme=$('v7Scheme').value.trim(),group=$('v7InvestCategory').value.trim();if(!amc||!scheme||!group){message('Enter AMC, scheme and category.');return}r.investment={amc,scheme,group}}else delete r.investment;
 if(!other&&!confirmOutflow(accountId,kind(category)==='income'?-amount:amount,date,'record',editing))return;
 if(update({records:state.records.filter(x=>x.id!==editing).concat(r)})){reportMode='month';$('month').value=date.slice(0,7);categoryFilter=null;$('expenseSearch').value='';$('note').value='';$('amount').value='';$('date').value=today();editing=null;entrySnapshot=formSnapshot();show(entryReturn);message('Entry saved')}
}
function initV7(){
 const previousPick=pick;pick=function(c){previousPick(c);v7ExpenseCategories();v7UpdateSave()};
 const previousOpen=openEntry;openEntry=function(...args){const result=previousOpen(...args);if(page==='entry'){const item=state.records.find(r=>r.id===editing);for(const [id,key] of [['v7AMC','amc'],['v7Scheme','scheme'],['v7InvestCategory','group']])$(id).value=item?.investment?.[key]||'';v7InvestmentVisibility();v7UpdateSave();entrySnapshot=formSnapshot()}return result};
 const previousVoiceReview=reviewVoice;reviewVoice=function(...args){const result=previousVoiceReview(...args);if(page==='entry'){v7Subcategories();v7UpdateSave();entrySnapshot=formSnapshot()}return result};
 const previousPaymentReview=reviewPaymentDraft;reviewPaymentDraft=function(...args){const result=previousPaymentReview(...args);if(page==='entry')v7UpdateSave();return result};
 v7InvestmentForm();$('form').onsubmit=v7SaveEntry;$('form').addEventListener('input',v7UpdateSave);$('form').addEventListener('change',v7UpdateSave);$('amount').before(node('span','v7-rupee','₹'));
 const defaults=['Interest','Gift'].filter(c=>!categoryNames(state).some(x=>x.toLowerCase()===c.toLowerCase()));if(defaults.length)update({categoryDefinitions:[...(state.categoryDefinitions||[]),...defaults.map(name=>({name,kind:'income',subcategories:[]}))]});
 const priorRender=render;render=function(){priorRender();if(!state)return;v7Home(modernRecords());v7Salary();v7Spend();v7Calendar();v7Accounts();if(page==='invest')v7Invest()};
 const priorShow=show;show=function(...args){const result=priorShow(...args);if(page!=='accounts')v7AccountType='';return result};
 const priorHeader=modernHeaderAdd;modernHeaderAdd=function(){if(page==='expenses')openEntry();else if(page==='income'&&salaryPanel==='salary')openEntry(null,'Salary');else priorHeader()};$('modernHeaderAdd').onclick=modernHeaderAdd;
 // Keep the user's selected appearance. Fresh installs use the soft Google-inspired light style.
 if(!localStorage.getItem('salary-theme'))setTheme('blue',false);
 render();
}
function v7UpdateSave(){const amount=Number($('amount').value),other=kind(category)==='expense'&&$('paidBy').value==='other';$('saveEntry').disabled=!(Number.isFinite(amount)&&amount>0&&validDate($('date').value)&&(other?!!$('payerName').value.trim():!!$('entryAccount').value)&&(kind(category)!=='aside'||!!($('v7AMC').value.trim()&&$('v7Scheme').value.trim()&&$('v7InvestCategory').value.trim())))}

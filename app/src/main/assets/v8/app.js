// v5 "Paper" design: four themes plus Auto, and a Home built around available money and where it was spent.
// Ledger reads and writes still go through the existing helpers; older Home elements stay hidden for compatibility.
const v8Themes={blue:{label:'Paper',note:'Light · cream and green',dark:false,bar:'#FAF8F4'},teal:{label:'Ocean',note:'Light · cool blue',dark:false,bar:'#F5F7FB'},night:{label:'Night',note:'Dark · soft charcoal',dark:true,bar:'#16181B'},amoled:{label:'AMOLED',note:'Dark · pure black',dark:true,bar:'#000000'}};
const v8Palettes={blue:['#1E5B45','#D08A55','#7F9BC0','#C9AE6E','#9C7CB0','#B9B4A9'],teal:['#2F55D4','#E0915C','#3FA389','#C9A33E','#9C7CB0','#B8BFCC'],night:['#7CC8A4','#F0A07A','#8DB4F0','#E3C77A','#C3A0E0','#5E636B'],amoled:['#8DE8C1','#61B795','#397F64','#244D3E','#B7F2D9','#1C3329']};
let v8HomeView='category';
function v8SystemDark(){try{if(window.Android&&typeof Android.isSystemDark==='function')return !!Android.isSystemDark()}catch{}try{return matchMedia('(prefers-color-scheme: dark)').matches}catch{return false}}
function v8ThemeChoice(){try{return localStorage.getItem('salary-theme')||'blue'}catch{return 'blue'}}
setTheme=function(name,save=true){
 name=({ink:'amoled',tangerine:'blue',paper:'blue',ocean:'teal'}[name]||name);if(name!=='auto'&&!v8Themes[name])name='blue';
 if(save)try{localStorage.setItem('salary-theme',name)}catch{message('Could not save theme');return}
 const resolved=name==='auto'?(v8SystemDark()?'night':'blue'):name,root=document.documentElement;
 root.dataset.theme=resolved;root.dataset.themeChoice=name;palette=v8Palettes[resolved].slice(0,4);
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.themeChoice===name));
 // The native side paints the status bar and the strip under the menu with the same colour as the page.
 if(window.Android&&typeof Android.setTheme==='function')Android.setTheme(resolved);
 if($('month')?.value&&$('homeDonut')&&state)render();
};
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(v8ThemeChoice()==='auto')setTheme('auto',false)})}catch{}
modernAppearance=function(){
 const d=workflowDialog('Appearance'),choice=v8ThemeChoice(),grid=node('div','v8-theme-grid');
 for(const [key,t] of [...Object.entries(v8Themes),['auto',{label:'Auto',note:'Follows your phone'}]]){const b=action('',()=>{setTheme(key);modernAppearance()});b.className='v8-theme-choice';b.dataset.swatch=key;b.setAttribute('aria-pressed',String(choice===key));const sw=node('span','v8-theme-swatch');sw.setAttribute('aria-hidden','true');b.append(sw,node('strong',null,t.label),node('small',null,t.note));grid.append(b)}
 d.append(grid,node('p','v8-sub','Text size follows your phone’s display settings.'));
};
settingsOriginals.settingsAppearance=modernAppearance;
function v8PeriodLabel(){if(reportMode==='month'){const [y,m]=$('month').value.split('-').map(Number);if(y&&m)return new Date(y,m-1,1).toLocaleString('en-IN',{month:'long',year:'numeric'})}return reportRange().label}
function v8Short(date){const d=new Date(date+'T12:00:00'),same=date.slice(0,4)===today().slice(0,4);return d.toLocaleDateString('en-IN',same?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'numeric'})}
function v8Day(date){const t=today(),d=new Date(t+'T12:00:00');d.setDate(d.getDate()-1);const y=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return date===t?'Today':date===y?'Yesterday':v8Short(date)}
function v8Home(){
 let el=$('v8Home');if(!el){el=node('div');el.id='v8Home';$('home').prepend(el)}el.replaceChildren();
 const live=state.accounts.filter(a=>!a.archived),liquid=live.filter(a=>!isCard(a)),wallet=a=>['Google Pay','CRED','PhonePe','Other wallet'].includes(a.bank),sum=arr=>arr.reduce((n,a)=>n+cents(balance(a)),0),dues=live.filter(isCard).reduce((n,a)=>n+Math.max(0,-cents(balance(a))),0),available=sum(liquid)-dues;
 // Available money: everything in bank, cash and wallets minus what is owed on credit cards.
 const hero=node('div','v8-hero'),first=state.profile?.name?.trim().split(/\s+/)[0];if(first)hero.append(node('p','v8-greeting','Hi, '+first));hero.append(node('small','v8-eyebrow','Available to spend'));const big=node('strong','v8-big',(available<0?'−':'')+money(Math.abs(available)/100));big.id='v8Available';hero.append(big);
 const salary=state.records.filter(r=>r.category==='Salary'&&r.date<=today()).sort((a,b)=>b.date.localeCompare(a.date))[0],notes=[];if(dues)notes.push('After '+money(dues/100)+' card dues');if(salary)notes.push('salary '+money(salary.amount)+' on '+v8Short(salary.date));
 if(notes.length){const sub=node('p','v8-sub',notes.join(' · '));sub.textContent=sub.textContent.charAt(0).toUpperCase()+sub.textContent.slice(1);hero.append(sub)}
 el.append(hero);
 const tiles=node('div','v8-accounts');for(const [label,value,go] of [['Bank',sum(liquid.filter(a=>a.bank!=='Cash'&&!wallet(a))),()=>{v7AccountType='Bank accounts';show('accounts')}],['Cash & wallets',sum(liquid.filter(a=>a.bank==='Cash'||wallet(a))),()=>{v7AccountType='';show('accounts')}],['Cards due',dues,()=>openCards()]]){const b=action('',go);b.className='v8-tile';b.append(node('small',null,label),node('strong',null,money(value/100)));tiles.append(b)}
 el.append(tiles);if(!live.length){const add=action('+ Add your bank, cash or wallet',()=>openAccount());add.className='v8-empty-action';el.append(add)}
 el.append(v8SpendCard(),v8Recent());
}
function v8SpendCard(){
 const card=node('section','v8-card v8-spend');card.setAttribute('aria-labelledby','v8SpendTitle');const range=reportRange(),expenses=state.records.filter(r=>inRange(r.date,range)&&kind(r.category)==='expense');
 const head=node('div','v8-spend-head'),title=node('h2',null,'Spent in '+v8PeriodLabel());title.id='v8SpendTitle';head.append(title);
 const tabs=node('div','v8-seg');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Group spending by');for(const [key,label] of [['category','Category'],['account','Paid from']]){const b=action(label,()=>{v8HomeView=key;v8Home()});b.setAttribute('aria-pressed',String(v8HomeView===key));tabs.append(b)}head.append(tabs);card.append(head);
 const groups=new Map();for(const r of expenses){const key=v8HomeView==='account'?(r.paidBy==='other'?'__others':r.accountId||'__none'):r.category;groups.set(key,(groups.get(key)||0)+reportCents(r))}
 const name=key=>v8HomeView==='account'?(key==='__others'?'Paid by others':key==='__none'?'No account':displayAccountName(account(key)||{name:'Removed account'})):key;
 const all=[...groups].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]),total=all.reduce((n,x)=>n+x[1],0),net=expenses.reduce((n,r)=>n+reportCents(r),0);
 if(!total){card.append(node('p','v8-empty','No expenses yet in '+v8PeriodLabel()+'.'));const add=action('+ Add expense',()=>openEntry());add.className='v8-empty-action';card.append(add);if(net)card.append(node('p','v8-note','Net after refunds: '+money(net/100)));return card}
 const shown=all.length>6?all.slice(0,5).concat([['__rest',all.slice(5).reduce((n,x)=>n+x[1],0)]]):all,colors=v8Palettes[document.documentElement.dataset.theme]||v8Palettes.blue;
 // Donut drawn as SVG arcs so it stays sharp; every value is repeated in the list below for screen readers.
 const body=node('div','v8-spend-body'),svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 120 120');svg.setAttribute('class','v8-donut');svg.setAttribute('role','img');svg.setAttribute('aria-label','Spending breakdown. Amounts are listed next to the chart.');
 const R=48,C=2*Math.PI*R;let offset=0;const track=document.createElementNS(svgNS,'circle');for(const [k,v] of [['cx',60],['cy',60],['r',R]])track.setAttribute(k,v);track.setAttribute('class','v8-donut-track');svg.append(track);
 shown.forEach(([,v],i)=>{const arc=document.createElementNS(svgNS,'circle'),len=v/total*C,gap=shown.length>1?Math.min(2,len/3):0;for(const [k,val] of [['cx',60],['cy',60],['r',R]])arc.setAttribute(k,val);arc.setAttribute('stroke-dasharray',Math.max(0,len-gap)+' '+(C-Math.max(0,len-gap)));arc.setAttribute('stroke-dashoffset',String(-offset));arc.style.stroke=i===shown.length-1&&shown[i][0]==='__rest'?colors[5]:colors[i];svg.append(arc);offset+=len});
 const centre=node('div','v8-donut-wrap'),label=node('div','v8-donut-centre');label.append(node('strong',null,money(total/100)),node('small',null,expenses.length+(expenses.length===1?' entry':' entries')));centre.append(svg,label);body.append(centre);
 const legend=node('div','v8-legend');shown.forEach(([key,v],i)=>{const rest=key==='__rest',b=action('',()=>{if(v8HomeView==='account'){if(rest||key==='__others'||key==='__none')return show('expenses');modernAccount=key;expenseView='expense';categoryFilter=null;show('expenses')}else{expenseView='expense';categoryFilter=rest?'__other':key;otherCategoryNames=all.slice(5).map(x=>x[0]);show('expenses')}});b.className='v8-legend-row';const dot=node('i');dot.style.background=rest?colors[5]:colors[i];const pct=Math.round(v/total*100);b.append(dot,node('span',null,rest?(v8HomeView==='account'?'Other accounts':'Other categories'):name(key)),node('strong',null,money(v/100)),node('small',null,(pct<1?'<1':pct)+'%'));b.setAttribute('aria-label',(rest?'Other':name(key))+' '+money(v/100)+', '+pct+' percent');legend.append(b)});
 body.append(legend);card.append(body);if(net!==total)card.append(node('p','v8-note','Net after refunds: '+money(net/100)));return card;
}
function v8Recent(){
 const wrap=node('section','v8-recent'),head=node('div','v8-recent-head');head.append(node('h2',null,'Recent'),action('See all',()=>v7AllEntries()));wrap.append(head);
 const list=modernRecords(reportRange()).slice(0,5);if(!list.length){wrap.append(node('p','v8-empty','Your entries for '+v8PeriodLabel()+' will appear here.'));return wrap}
 let day='';for(const r of list){if(r.date!==day){day=r.date;wrap.append(node('h3','v8-day',v8Day(day)))}const b=action('',()=>openEntry(r.id));b.className='v8-row';const glyph=node('span','v8-row-icon');glyph.innerHTML=icon(r.category);glyph.setAttribute('aria-hidden','true');const text=node('span','v8-row-text'),acc=r.paidBy==='other'?'Paid by '+(r.person||'others'):account(r.accountId)?displayAccountName(account(r.accountId)):'';text.append(node('strong',null,r.note||r.category),node('small',null,[categoryLabel(r),acc].filter(Boolean).join(' · ')));const credit=recordCredit(r),amount=node('strong','v8-amount'+(credit?' plus':kind(r.category)==='aside'?' save':''),(credit?'+':'−')+money(r.amount));b.append(glyph,text,amount);wrap.append(b)}
 return wrap;
}
function initV8(){
 message=function(s){clearTimeout(statusTimer);$('status').textContent=s;statusTimer=setTimeout(()=>{$('status').textContent=''},3000)};
 document.body.classList.add('v8');document.getElementById('v7HomeActions')?.remove();
 const priorRender=render;render=function(){priorRender();if(!state)return;document.body.dataset.page=page;const prior=modernAccount;modernAccount='';try{v8Home()}finally{modernAccount=prior}};
 const priorShow=show;show=function(...args){const result=priorShow(...args);document.body.dataset.page=page;return result};
 initV8Screens();setTheme(v8ThemeChoice(),false);render();
}

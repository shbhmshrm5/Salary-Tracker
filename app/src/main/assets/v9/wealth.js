// v6.1 Wealth: investments you already hold (mutual funds, PPF, FDs, stocks ...) at their latest value.
// Holdings sit apart from accounts and monthly totals, so adding one never changes a balance or "Left".
function v9Holdings(){return state.holdings||[]}
// Same icon families as the investment chips on Add investment.
function v9InvestIcon(c){return icon(['Stocks','Mutual funds','Bonds'].includes(c)?'Investments':['Gold','PPF','Post office','Fixed deposit','Recurring deposit','Sukanya Samriddhi'].includes(c)?'Savings':'SIP')}
function v9InvestTypes(){const names=categoryNames(state).filter(c=>kind(c)==='aside'&&c!=='SIP');return names.length?names:['Investments']}
function v9HoldingForm(h=null){
 const {d,f}=featureForm(h?'Edit investment':'Add existing investment','Enter what it is worth today. It is added to Wealth only: account balances, spending and "Left" do not change. SIPs you add after this date are counted on top.');
 const types=v9InvestTypes(),type=field(f,'Type','text',h?.category||(types.includes('Mutual funds')?'Mutual funds':types[0]),types.map(c=>[c,c]));
 const name=field(f,'Name','text',h?.name||'');name.maxLength=60;name.placeholder='e.g. Parag Parikh Flexi Cap';
 const provider=field(f,'Provider · optional','text',h?.provider||'');provider.maxLength=60;provider.required=false;provider.placeholder='e.g. Zerodha, HDFC AMC, Post office';
 const value=field(f,'Current value (₹)','number',h?h.value/100:'');value.min='0';value.placeholder='What it is worth today';
 const invested=field(f,'Amount you put in (₹) · optional','number',h?.invested!=null?h.invested/100:'');invested.min='0';invested.required=false;invested.placeholder='Shows your gain or loss';
 const date=field(f,'Value as of','date',h?.date||today());date.max=today();
 submitButton(f,h?'Save changes':'Add investment',()=>{
  const v=cents(Number(value.value)),put=invested.value.trim()===''?null:cents(Number(invested.value));
  if(!name.value.trim())throw Error('Enter a name.');if(!Number.isSafeInteger(v)||v<=0)throw Error('Enter the current value.');if(put!=null&&(!Number.isSafeInteger(put)||put<0))throw Error('Check the amount you put in.');if(!validDate(date.value)||date.value>today())throw Error('Choose a date up to today.');
  const item={id:h?.id||uid(),category:type.value,name:name.value.trim(),provider:provider.value.trim(),value:v,date:date.value};if(put!=null)item.invested=put;
  if(update({holdings:h?v9Holdings().map(x=>x.id===h.id?item:x):v9Holdings().concat(item)})){d.close();render();message(h?'Investment updated':'Investment added')}
 });
 if(h){const del=action('Delete investment',()=>{if(confirm('Delete '+h.name+'?')&&update({holdings:v9Holdings().filter(x=>x.id!==h.id)})){d.close();render();message('Investment deleted')}});del.className='v8-danger';f.append(del)}
}
function v9HoldingRow(h,onOpen){
 const b=action('',onOpen);b.className='v8-row';const glyph=node('span','v8-row-icon');glyph.innerHTML=v9InvestIcon(h.category);glyph.setAttribute('aria-hidden','true');
 const text=node('span','v8-row-text');text.append(node('strong',null,h.name),node('small',null,[h.provider,h.category,'as of '+v8Short(h.date)].filter(Boolean).join(' · ')));
 const side=node('span','v9-holding-side');side.append(node('strong','v8-amount',money(h.value/100)));
 if(h.invested){const gain=h.value-h.invested,pct=gain/h.invested*100;side.append(node('small','v9-gain '+(gain>=0?'up':'down'),(gain>=0?'+':'−')+money(Math.abs(gain)/100)+' · '+(gain>=0?'+':'−')+Math.abs(pct).toFixed(1)+'%'))}
 b.append(glyph,text,side);return b;
}
// Wealth: one total for held investments plus those added in the app, then the holdings and the groups.
function v9Invest(){
 const el=$('invest'),records=state.records.filter(r=>kind(r.category)==='aside'&&r.date<=today()),holdings=v9Holdings();
 const added=records.reduce((n,r)=>n+reportCents(r),0),held=holdings.reduce((n,h)=>n+h.value,0),month=records.filter(r=>r.date.slice(0,7)===today().slice(0,7)).reduce((n,r)=>n+reportCents(r),0);
 el.replaceChildren();const hero=node('div','v7-invest-hero');
 hero.append(node('small',null,'Your investments'),node('strong',null,money((held+added)/100)),node('span',null,holdings.length?money(held/100)+' held · '+money(added/100)+' added in the app':money(month/100)+' added this month'));
 if(holdings.length&&month)hero.append(node('span',null,money(month/100)+' added this month'));el.append(hero);
 el.append(modernTabs([['amc','By provider'],['category','By type']],v7InvestView,k=>{v7InvestView=k;v9Invest();v8Wealth()}));
 const groupOf=x=>x.holding?(v7InvestView==='amc'?x.provider:x.category)||'Other':(v7InvestView==='amc'?x.investment?.amc:x.investment?.group)||(v7InvestView==='amc'?'Other':x.category),items=records.concat(holdings.map(h=>({...h,holding:true})));
 const map=new Map();for(const x of items){const name=groupOf(x);if(!map.has(name))map.set(name,{sum:0,count:0});const g=map.get(name);g.sum+=x.holding?x.value:reportCents(x);g.count++}
 if(!map.size)el.append(node('p','empty','Add an investment you already hold, or record a SIP, to see it here.'));
 for(const [name,g] of [...map].sort((a,b)=>b[1].sum-a[1].sum)){const b=action('',()=>v9InvestDetail(name,items,groupOf));b.className='v7-invest-row';b.append(node('span',null,name),node('small',null,g.count+(g.count===1?' entry':' entries')),node('strong',null,money(g.sum/100)));el.append(b)}
 const plans=(state.schedules||[]).filter(s=>kind(s.category)==='aside');const plan=action('SIP plans · '+plans.length+'  ›',()=>openSchedules());plan.className='v7-compact-link';el.append(plan,action('Investment history  ›',()=>v9InvestDetail(null,items,groupOf)));el.lastChild.className='v7-compact-link';
}
function v9InvestDetail(name,items,groupOf){
 const d=workflowDialog(name||'Investment history'),list=items.filter(x=>!name||groupOf(x)===name).sort((a,b)=>b.date.localeCompare(a.date));
 for(const x of list){if(x.holding){d.append(v9HoldingRow(x,()=>{d.close();v9HoldingForm(v9Holdings().find(h=>h.id===x.id))}));continue}
  const b=action('',()=>{d.close();openEntry(x.id)});b.className='v7-invest-row';b.append(node('span',null,x.investment?.scheme||x.note||x.category),node('small',null,displayDate(x.date)+' · '+(x.investment?.amc||x.category)),node('strong',null,money(x.amount)));d.append(b)}
 if(!list.length)d.append(node('p','empty','No entries yet.'));
}
// The holdings card goes straight under the total, above upcoming SIPs.
function v9HoldingsCard(){
 if(page!=='invest')return;$('v9HoldingsCard')?.remove();const card=node('section','v8-card');card.id='v9HoldingsCard';card.append(node('h2',null,'Investments you hold'));
 const holdings=[...v9Holdings()].sort((a,b)=>b.value-a.value);
 if(!holdings.length)card.append(node('p','v8-sub','Add mutual funds, PPF, FDs, stocks or gold you already have. Your account balances will not change.'));
 for(const h of holdings)card.append(v9HoldingRow(h,()=>v9HoldingForm(h)));
 card.append(Object.assign(action('+ Add an investment you hold',()=>v9HoldingForm()),{className:'v8-text-button'}));
 $('invest').querySelector('.v7-invest-hero')?.after(card);
}
/* ---------- Net worth: what you have minus what you owe, month by month ---------- */
// Worked out from the ledger rather than stored, so it never needs syncing: account balances at the date,
// investments recorded in the app, minus card dues. Held investments were owned before they were entered,
// so they count in every month at their latest value instead of appearing as a jump.
function v9NetWorth(asof=today()){
 let cash=0,dues=0;for(const a of state.accounts){const b=balance(a,asof);if(isCard(a))dues+=Math.max(0,-b);else cash+=b}
 const added=state.records.filter(r=>kind(r.category)==='aside'&&r.date<=asof).reduce((n,r)=>n+reportCents(r),0)/100;
 const held=v9Holdings().reduce((n,h)=>n+h.value,0)/100;
 return {cash,invest:added+held,dues,total:cash+added+held-dues};
}
function v9MonthEnd(month){const d=new Date(month+'-01T12:00:00');d.setMonth(d.getMonth()+1);d.setDate(0);const end=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return end<today()?end:today()}
function v9NetWorthCard(){
 if(page!=='invest'||!state.accounts.length)return;$('v9NetWorth')?.remove();
 const now=v9NetWorth(),card=node('section','v8-card v9-networth');card.id='v9NetWorth';
 card.append(node('small','v9-networth-label','Net worth'),node('strong','v9-networth-total',money(now.total)));
 // Up to twelve month-ends, starting from the first account's opening month.
 const first=state.accounts.map(a=>a.date).sort()[0].slice(0,7),months=[];for(let m=today().slice(0,7);m>=first&&months.length<12;m=v9MonthShift(m,-1))months.unshift(m);
 const values=months.map(m=>v9NetWorth(v9MonthEnd(m)).total);
 if(months.length>1){const prev=values.at(-2),diff=now.total-prev;card.append(node('small','v9-compare '+(diff>=0?'down':'up'),(Math.round(diff)===0?'No change':(diff>0?'+':'−')+money(Math.abs(diff)))+' since end of '+v9MonthName(months.at(-2))))}
 const parts=node('div','v9-networth-parts');for(const [label,v,neg] of [['Bank & cash',now.cash],['Investments',now.invest],['Card dues',now.dues,true]]){if(neg&&!v)continue;const row=node('div','v9-networth-row');row.append(node('span',null,label),node('strong',null,(neg?'−':'')+money(v)));parts.append(row)}card.append(parts);
 if(months.length>1){const trend=node('div','v9-trend v9-networth-trend'),max=Math.max(1,...values.map(Math.abs));trend.setAttribute('role','img');trend.setAttribute('aria-label','Net worth at each month end: '+months.map((m,i)=>v9MonthName(m)+' '+money(values[i])).join(', '));
  months.forEach((m,i)=>{const col=node('div','v9-bar'+(i===months.length-1?' current':'')),bar=node('i');bar.style.height=Math.max(values[i]>0?6:2,Math.abs(values[i])/max*64)+'px';col.title=v9MonthName(m)+': '+money(values[i]);col.append(node('small','v9-bar-value',v9Compact(values[i])),bar,node('small',null,v9MonthName(m)));trend.append(col)});card.append(trend)}
 card.append(node('p','v9-hint','Held investments use their latest value. Update them from "Investments you hold".'));
 $('invest').prepend(card);
}
function initV9Wealth(){
 v7Invest=v9Invest;
 const priorWealth=v8Wealth;v8Wealth=function(){priorWealth();v9HoldingsCard();v9NetWorthCard()};
}

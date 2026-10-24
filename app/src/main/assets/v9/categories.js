// v6 categories: one category page for Activity, Home and Insights, usage-ordered category chips,
// quick "+ Add" for subcategories, category suggestions from past notes, and distinct chart colours.
// Presentation only: entries are still saved through the existing validated workflows.

// Icons for categories people commonly add; a name already drawn keeps its icon.
for(const [name,d] of Object.entries({Household:'M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2','Personal care':'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.1 7.9L20 20M8.1 16.1L20 4',Insurance:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4'}))if(!PATHS[name])PATHS[name]=d;

/* ---------- Chart colours: eight fixed, colour-blind-checked hues; more categories fold into "Other" ---------- */
const v9Hues={light:['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#008300','#6250d6','#e34948'],dark:['#3987e5','#d95926','#199e70','#c98500','#d55181','#008300','#9085e9','#e66767']};
function v9Colors(){return getComputedStyle(document.documentElement).colorScheme.includes('dark')?v9Hues.dark:v9Hues.light}
// Totals by category, largest first; categories past the seventh are folded into one "Other categories" slice.
function v9Slices(list){
 const sums=new Map();for(const r of list)if(kind(r.category)==='expense')sums.set(r.category,(sums.get(r.category)||0)+reportCents(r));
 const all=[...sums].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
 return all.length>8?all.slice(0,7).map(([c,v])=>({label:c,names:[c],v})).concat([{label:'Other categories',names:all.slice(7).map(x=>x[0]),v:all.slice(7).reduce((n,x)=>n+x[1],0)}]):all.map(([c,v])=>({label:c,names:[c],v}));
}
function v9Donut(slices,total,onPick){
 const svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg'),colors=v9Colors(),R=66,C=2*Math.PI*R;let offset=0;
 svg.setAttribute('viewBox','0 0 200 200');svg.setAttribute('class','v9-donut');svg.setAttribute('role','img');svg.setAttribute('aria-label','Spending by category. Amounts are listed below the chart.');
 for(const [i,s] of slices.entries()){const arc=document.createElementNS(svgNS,'circle'),len=s.v/total*C,gap=slices.length>1?Math.min(2,len/3):0;for(const [k,v] of [['cx',100],['cy',100],['r',R]])arc.setAttribute(k,v);arc.setAttribute('stroke-dasharray',Math.max(0,len-gap)+' '+(C-Math.max(0,len-gap)));arc.setAttribute('stroke-dashoffset',String(-offset));arc.style.stroke=colors[i];arc.addEventListener('click',()=>onPick(s));svg.append(arc);offset+=len}
 for(const [y,size,text,fill] of [[96,11,'TOTAL SPENT','var(--muted)'],[118,17,money(total/100),'var(--ink)']]){const t=document.createElementNS(svgNS,'text');t.setAttribute('x',100);t.setAttribute('y',y);t.setAttribute('text-anchor','middle');t.setAttribute('font-size',size);t.setAttribute('fill',fill);t.textContent=text;svg.append(t)}
 return svg;
}
// Insights "Spending by category": every row and slice opens that category's page for the selected period.
function v9InsightsCategories(chart,list){
 chart.replaceChildren();const slices=v9Slices(list),total=slices.reduce((n,s)=>n+s.v,0);
 if(!total){chart.append(node('p','empty','No expenses in this period.'));return}
 const open=s=>v9CategoryPage(s.names,{title:s.label});
 const wrap=node('div','v9-donut-wrap');wrap.append(v9Donut(slices,total,open));chart.append(wrap);
 const legend=node('div','v9-legend'),colors=v9Colors();
 for(const [i,s] of slices.entries()){const b=action('',()=>open(s));b.className='v9-legend-row';const dot=node('i');dot.style.background=colors[i];b.append(dot,node('span',null,s.label),node('strong',null,money(s.v/100)),node('small',null,(s.v/total*100).toFixed(1)+'%'),node('b','v9-chevron','›'));b.setAttribute('aria-label',s.label+' '+money(s.v/100)+'. Show entries');legend.append(b)}
 chart.append(legend,node('p','v9-hint','Tap a category to see its entries.'));
}

/* ---------- Category page ---------- */
function v9MonthShift(month,n){const d=new Date(month+'-01T12:00:00');d.setMonth(d.getMonth()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function v9MonthName(month){return new Date(month+'-01T12:00:00').toLocaleDateString('en-IN',{month:'short'})}
// names: the categories shown together (one, or several for "Other categories"). opts.account narrows to one account.
function v9CategoryPage(names,opts={}){
 const title=opts.title||names[0],single=names.length===1,d=workflowDialog(title);d.classList.add('v9-category-page');
 let scope='period',part=null,query='';
 const monthMode=reportMode==='month',month=$('month').value;
 const base=()=>state.records.filter(r=>names.includes(r.category)&&(!opts.account||r.accountId===opts.account));
 const scopeTabs=node('div','v8-seg v9-scope');scopeTabs.setAttribute('role','group');scopeTabs.setAttribute('aria-label','Period');
 const periodLabel=monthMode?new Date(month+'-01T12:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'}):reportRange().label;
 for(const [key,label] of [['period',periodLabel],['all','All time']]){const b=action(label,()=>{scope=key;part=null;draw()});b.dataset.scope=key;scopeTabs.append(b)}
 const summary=node('div','v9-summary'),trend=node('div','v9-trend'),parts=node('div','v9-parts'),search=node('input','v9-search'),list=node('div','v9-list');
 search.type='search';search.placeholder='Search '+(single?title:'these categories');search.setAttribute('aria-label','Search entries');search.oninput=()=>{query=search.value.trim().toLowerCase();drawList()};
 d.append(scopeTabs,summary,trend,parts,search,list);
 if(single&&kind(names[0])==='expense'){const add=action('+ Add '+names[0]+' expense',()=>{d.close();openEntry(null,names[0]);v9Manual=true});add.className='v9-add';d.append(add)}
 let records=[];
 const drawList=()=>{
  list.replaceChildren();const shown=records.filter(r=>(part==null||(single?(r.subcategory||''):r.category)===part)&&(!query||[r.note,r.category,r.subcategory,account(r.accountId)?.name,r.amount,displayDate(r.date)].join(' ').toLowerCase().includes(query)));
  if(!shown.length){list.append(node('p','v8-empty',query?'No entries match your search.':'No entries yet.'));return}
  list.append(node('p','v9-count',shown.length+(shown.length===1?' entry':' entries')+(part!=null||query?' · '+money(shown.reduce((n,r)=>n+reportCents(r),0)/100):'')));
  let day='';for(const r of shown){if(r.date!==day){day=r.date;list.append(node('h3','v8-day',v8Day(day)+(day.slice(0,4)===today().slice(0,4)?'':' '+day.slice(0,4))))}
   const b=action('',()=>{d.close();openEntry(r.id)});b.className='v8-row';const glyph=node('span','v8-row-icon');glyph.innerHTML=icon(r.category);glyph.setAttribute('aria-hidden','true');
   const acc=r.paidBy==='other'?'Paid by '+(r.person||'others'):account(r.accountId)?displayAccountName(account(r.accountId)):'No account';
   const text=node('span','v8-row-text');text.append(node('strong',null,r.note||r.subcategory||r.category),node('small',null,[single?r.subcategory:categoryLabel(r),acc].filter(Boolean).join(' · ')));
   const credit=recordCredit(r);b.append(glyph,text,node('strong','v8-amount'+(credit?' plus':''),(credit?'+':'−')+money(r.amount)));list.append(b)}
 };
 const draw=()=>{
  for(const b of scopeTabs.children)b.setAttribute('aria-pressed',String(b.dataset.scope===scope));
  const range=scope==='all'?{from:'0001-01-01',to:'9999-12-31'}:reportRange();
  records=base().filter(r=>inRange(r.date,range)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0));
  const total=records.reduce((n,r)=>n+reportCents(r),0);
  summary.replaceChildren();const big=node('strong','v9-total',money(total/100)),facts=node('small',null,records.length+(records.length===1?' entry':' entries')+(records.length?' · avg '+money(Math.round(total/records.length/100)):''));summary.append(big,facts);
  if(scope==='period'&&monthMode){const prev=v9MonthShift(month,-1),before=base().filter(r=>r.date.slice(0,7)===prev).reduce((n,r)=>n+reportCents(r),0);
   if(before){const diff=total-before,line=node('small','v9-compare '+(diff>0?'up':'down'),diff===0?'Same as '+v9MonthName(prev):money(Math.abs(diff)/100)+(diff>0?' more':' less')+' than '+v9MonthName(prev));summary.append(line)}else summary.append(node('small','v9-compare','Nothing in '+v9MonthName(prev)))}
  // Six months ending in the selected month, so a one-off month is easy to spot.
  trend.replaceChildren();trend.hidden=!(scope==='period'&&monthMode);
  if(!trend.hidden){const months=[...Array(6)].map((_,i)=>v9MonthShift(month,i-5)),values=months.map(m=>base().filter(r=>r.date.slice(0,7)===m).reduce((n,r)=>n+reportCents(r),0)),max=Math.max(1,...values);
   trend.setAttribute('role','img');trend.setAttribute('aria-label','Last six months: '+months.map((m,i)=>v9MonthName(m)+' '+money(values[i]/100)).join(', '));
   months.forEach((m,i)=>{const col=node('div','v9-bar'+(m===month?' current':'')),bar=node('i');bar.style.height=Math.max(values[i]>0?6:2,values[i]/max*64)+'px';col.title=v9MonthName(m)+': '+money(values[i]/100);col.append(node('small','v9-bar-value',values[i]?v9Compact(values[i]/100):''),bar,node('small',null,v9MonthName(m)));trend.append(col)})}
  // Breakdown by subcategory (one category) or by category ("Other categories"); a chip filters the list.
  parts.replaceChildren();const groups=new Map();for(const r of records){const key=single?(r.subcategory||''):r.category;groups.set(key,(groups.get(key)||0)+reportCents(r))}
  const entries=[...groups].sort((a,b)=>b[1]-a[1]);
  if(entries.length>1||(entries.length===1&&entries[0][0]!=='')){
   parts.append(node('h3','v9-parts-title',single?'Subcategories':'Categories'));
   for(const [key,v] of entries){const b=action('',()=>{part=part===key?null:key;draw()});b.className='v9-part';b.setAttribute('aria-pressed',String(part===key));const fill=node('i','v9-part-fill');fill.style.width=(total>0?Math.max(0,v/total*100):0)+'%';b.append(fill,node('span',null,key||(single?'No subcategory':'')),node('strong',null,money(v/100)));parts.append(b)}
  }
  drawList();
 };
 draw();
}
function v9Compact(n){return n>=100000?'₹'+(n/100000).toFixed(n>=1000000?0:1).replace(/\.0$/,'')+'L':n>=1000?'₹'+(n/1000).toFixed(n>=10000?0:1).replace(/\.0$/,'')+'k':'₹'+Math.round(n)}

// Category taps on Home and Activity open the category page instead of filtering the long list.
function v9CategoryTaps(){
 document.addEventListener('click',e=>{
  const home=e.target.closest('.v8-spend .v8-legend-row'),activity=e.target.closest('#modernSpendChart .donut-item');
  if(!(home&&v8HomeView!=='account')&&!activity)return;
  const label=(home||activity).querySelector('span')?.textContent.trim();if(!label)return;
  e.preventDefault();e.stopImmediatePropagation();
  const list=activity?modernRecords():state.records.filter(r=>inRange(r.date,reportRange())),keep=activity?3:5;
  const sums=new Map();for(const r of list)if(kind(r.category)==='expense')sums.set(r.category,(sums.get(r.category)||0)+reportCents(r));
  const names=label==='Other categories'?[...sums].filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(keep).map(x=>x[0]):[label];
  if(names.length)v9CategoryPage(names,{title:label,account:activity?modernAccount:null});
 },true);
}

/* ---------- Add entry: usage-ordered chips, "+ Add" subcategory, suggestions from past notes ---------- */
let v9Manual=false,v9Auto=false;
// The six categories used most in the last 90 days come first; the defaults fill any gaps.
function v9Featured(mode,names){
 const from=new Date(today()+'T12:00:00');from.setDate(from.getDate()-90);const since=from.toISOString().slice(0,10),counts=new Map();
 for(const r of state.records)if(r.date>=since&&kind(r.category)===mode&&names.includes(r.category))counts.set(r.category,(counts.get(r.category)||0)+1);
 const defaults=mode==='income'?['Salary','Bonus','Freelance','Interest','Gift','Other income']:mode==='aside'?['SIP','Investments','Savings']:['Food','Groceries','Travel','Shopping','Bills','Health'];
 return [...new Set([...[...counts].sort((a,b)=>b[1]-a[1]).map(x=>x[0]),...defaults.filter(c=>names.includes(c))])].slice(0,6);
}
function v9ExpenseCategories(){
 const holder=$('categories'),selected=category,mode=kind(category),names=categoryNames(state).filter(c=>kind(c)===mode);
 holder.replaceChildren();holder.className='categories v7-category-grid';
 const featured=v9Featured(mode,names),shown=[...new Set([...featured,...(featured.includes(selected)?[]:[selected])])];
 for(const c of shown){const b=action('',()=>pick(c));b.type='button';b.className=c===selected?'selected':'';const glyph=node('span','v7-category-icon');glyph.innerHTML=icon(c);b.append(glyph,node('span',null,c==='Other income'?'Other':c));b.setAttribute('aria-pressed',String(c===selected));holder.append(b)}
 const more=$('moreCategories');more.classList.remove('hidden');more.textContent='All categories';more.onclick=()=>v7CategorySheet(names);
 v7Subcategories();v7InvestmentVisibility();
}
function initV9Categories(){
 v7ExpenseCategories=v9ExpenseCategories;
 // Subcategory chips end with "+ Add" so a new one can be made without leaving the entry.
 const priorSubs=v7Subcategories;v7Subcategories=function(){priorSubs();const chips=$('v7SubcategoryChips'),group=$('entrySubcategoryGroup');if(!chips)return;group.hidden=false;const add=action('+ Add',()=>addCategoryForm(category,true));add.type='button';add.className='v9-chip-add';add.setAttribute('aria-label','Add a subcategory to '+category);chips.append(add)};
 $('entrySubcategory')?.addEventListener('change',()=>v7Subcategories());
 // The full category list offers "+ New category" next to search.
 const priorSheet=v7CategorySheet;v7CategorySheet=function(names){priorSheet(names);const d=$('v7CategorySheet');if(d.querySelector('.v9-new-category'))return;const b=action('+ New category',()=>{d.close();addCategoryForm(null,true)});b.className='v9-new-category';d.querySelector('input[type=search]').after(b)};
 const priorPick=pick;pick=function(...args){const result=priorPick(...args);if(!v9Auto)v9Manual=true;$('v9Suggestion')?.remove();return result};
 const priorOpen=openEntry;openEntry=function(...args){const result=priorOpen(...args);v9Manual=!!editing;$('v9Suggestion')?.remove();if(page==='entry')v7Subcategories();return result};
 // Typing a note used before picks that entry's category and subcategory, until a category is tapped.
 $('note').addEventListener('input',()=>{
  if(v9Manual||editing||page!=='entry')return;const text=$('note').value.trim().toLowerCase();if(text.length<3)return;
  const mode=kind(category),past=state.records.filter(r=>(r.note||'').trim().toLowerCase()===text&&kind(r.category)===mode&&categoryNames(state).includes(r.category)).sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0))[0];
  if(!past||past.category===category&&($('entrySubcategory').value||'')===(past.subcategory||''))return;
  v9Auto=true;try{pick(past.category)}finally{v9Auto=false}
  if(validSubcategory(past.category,past.subcategory,state)){$('entrySubcategory').value=past.subcategory||'';v7Subcategories()}
  const hint=node('p','v9-suggestion','Category from your last “'+past.note.trim()+'” entry');hint.id='v9Suggestion';$('note').after(hint);
 });
 v9CategoryTaps();
 const priorChart=renderChart;renderChart=function(list,sum){if($('chartMode').value==='categories')return v9InsightsCategories($('chart'),list);return priorChart(list,sum)};
 render();
}

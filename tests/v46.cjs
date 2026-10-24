const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
 fs.mkdirSync('previews',{recursive:true});const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 await p.evaluate(()=>{const m=today().slice(0,7),day=n=>m+'-'+String(n).padStart(2,'0'),prev=(()=>{const d=new Date(m+'-01T12:00:00');d.setMonth(d.getMonth()-1);return d.toISOString().slice(0,7)})();
  const recs=[['Groceries','Milk & dairy','Milk',56,1],['Groceries','Milk & dairy','Milk',28,1],['Groceries','Dry fruits','Dryfruit',980,1],['Groceries','','',150,1],['Food','Eating out','Coffee',483,1],['Food','Snacks & drinks','Momos',130,1],['Rent','','',10170,1],['Health','Medicines','Medicine',634,1],['Household','Utensils','Bartan',670,1],['Personal care','Grooming','Shaving',50,1],['Family','Kirti','Paid to Kirti',3000,1],['Travel','Auto & cab','Rapido',56,1],['Shopping','Accessories','Bangles',250,1],['Bills','','Electricity',900,1]];
  update({accounts:[{id:'bank',bank:'HDFC',name:'Salary account',opening:5000000,date:'2020-01-01'}],defaultAccount:'bank',
   categoryDefinitions:[{name:'Groceries',kind:'expense',subcategories:['Milk & dairy','Dry fruits']},{name:'Food',kind:'expense',subcategories:['Eating out','Snacks & drinks']},{name:'Health',kind:'expense',subcategories:['Medicines']},{name:'Household',kind:'expense',subcategories:['Utensils']},{name:'Personal care',kind:'expense',subcategories:['Grooming']},{name:'Family',kind:'expense',subcategories:['Kirti']},{name:'Travel',kind:'expense',subcategories:['Auto & cab']},{name:'Shopping',kind:'expense',subcategories:['Accessories']}],
   records:recs.map(([category,subcategory,note,amount,d],i)=>({id:'r'+i,category,subcategory,note,amount,date:day(d),accountId:'bank',createdAt:i})).concat([{id:'old',category:'Groceries',subcategory:'Milk & dairy',note:'Milk',amount:400,date:prev+'-05',accountId:'bank',createdAt:99}])});render();show('expenses')});
 // Activity: tapping a category opens one category page with its total, subcategories and entries.
 await p.click('#modernSpendChart .donut-item >> text=Groceries');
 const page1=await p.evaluate(()=>{const d=document.querySelector('dialog[open].v9-category-page');return {title:d.querySelector('h2').textContent,total:d.querySelector('.v9-total').textContent,parts:[...d.querySelectorAll('.v9-part span')].map(x=>x.textContent),rows:d.querySelectorAll('.v9-list .v8-row').length,compare:d.querySelector('.v9-compare').textContent,bars:d.querySelectorAll('.v9-bar').length}});
 assert.equal(page1.title,'Groceries');assert.equal(page1.total,'₹1,214');assert.deepEqual(page1.parts,['Dry fruits','No subcategory','Milk & dairy']);assert.equal(page1.rows,4);assert.match(page1.compare,/₹814 more than/);assert.equal(page1.bars,6);
 await p.click('dialog[open] .v9-part >> text=Milk & dairy');
 assert.equal(await p.locator('dialog[open] .v9-list .v8-row').count(),2,'a subcategory filters the list');
 await p.click('dialog[open] [data-scope=all]');
 assert.equal(await p.locator('dialog[open] .v9-total').textContent(),'₹1,614','All time includes earlier months');
 await p.screenshot({path:'previews/v46-category-page.png'});
 await p.click('dialog[open] .v9-list .v8-row >> nth=0');
 assert.equal(await p.evaluate(()=>page),'entry','tapping an entry opens it for editing');
 // "Other categories" lists every folded category on one page.
 await p.evaluate(()=>show('expenses'));await p.click('#modernSpendChart .donut-item >> text=Other categories');
 const other=await p.evaluate(()=>[...document.querySelectorAll('dialog[open] .v9-part span')].map(x=>x.textContent));
 assert(other.length>=5&&!other.includes('Rent')&&other.includes('Household'),other.join());
 await p.evaluate(()=>document.querySelector('dialog[open]').close());
 // The full transaction list uses tap-to-edit rows with a ⋯ menu, not Edit and More buttons.
 await p.evaluate(()=>{$('v7SpendHistory').open=true});
 assert.equal(await p.evaluate(()=>document.querySelector('#expenseRows > .row summary').textContent),'⋯');
 assert.equal(await p.evaluate(()=>getComputedStyle(document.querySelector('#expenseRows > .row .v8-row-edit')).display),'none');
 // Insights: nine or more categories fold into "Other categories", colours never repeat, and rows open the category page.
 await p.evaluate(()=>show('insights'));
 const ins=await p.evaluate(()=>({rows:[...document.querySelectorAll('.v9-legend-row span')].map(x=>x.textContent),colors:[...document.querySelectorAll('.v9-legend-row i')].map(x=>x.style.background)}));
 assert.equal(ins.rows.length,8);assert.equal(ins.rows.at(-1),'Other categories');assert.equal(new Set(ins.colors).size,8,'every slice has its own colour');
 await p.click('.v9-legend-row >> text=Food');
 assert.equal(await p.locator('dialog[open].v9-category-page h2').textContent(),'Food');
 await p.evaluate(()=>document.querySelector('dialog[open]').close());
 // Home: the spending card opens the same page.
 await p.evaluate(()=>show('home'));await p.click('.v8-spend .v8-legend-row >> nth=0');
 assert.equal(await p.locator('dialog[open].v9-category-page h2').textContent(),'Rent');
 await p.evaluate(()=>document.querySelector('dialog[open]').close());
 // Add expense: most-used categories first, "+ Add" subcategory, and a note used before picks its category.
 await p.evaluate(()=>openEntry());
 assert.equal(await p.locator('#categories button >> nth=0').textContent(),'Groceries');
 await p.fill('#note','coffee');
 assert.equal(await p.evaluate(()=>category+' / '+$('entrySubcategory').value),'Food / Eating out');
 assert(await p.locator('#v9Suggestion').isVisible());
 await p.click('#categories button >> text=Health');await p.fill('#note','Milk');
 assert.equal(await p.evaluate(()=>category),'Health','a tapped category is never replaced by a suggestion');
 await p.click('.v9-chip-add');await p.fill('dialog[open] input[type=text]','Vitamins');await p.click('dialog[open] button[type=submit]');
 assert.equal(await p.evaluate(()=>$('entrySubcategory').value),'Vitamins');
 assert(await p.locator('#v7SubcategoryChips button.selected >> text=Vitamins').isVisible());
 await p.click('#moreCategories');assert(await p.locator('#v7CategorySheet .v9-new-category').isVisible());
 await p.screenshot({path:'previews/v46-category-sheet.png'});
 assert.deepEqual(errors,[]);await b.close();console.log('v46 category page checks passed');
})().catch(e=>{console.error(e);process.exit(1)});

const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
 fs.mkdirSync('previews',{recursive:true});const b=await chromium.launch(),p=await b.newPage({viewport:{width:391,height:853},timezoneId:'Asia/Kolkata'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 await p.evaluate(()=>{const m=today().slice(0,7),day=n=>m+'-'+String(n).padStart(2,'0');
  update({accounts:[{id:'bob',bank:'Bank of Baroda',name:'Bank of Baroda',opening:5000000,date:'2020-01-01'}],defaultAccount:'bob',categoryDefinitions:[{name:'Family',kind:'expense',subcategories:['Kirti']}],
   records:[{id:'k1',category:'Family',subcategory:'Kirti',note:'Paid to Kirti',amount:3000,date:day(1),accountId:'bob',paidBy:'me',createdAt:1},{id:'k2',category:'Family',subcategory:'Kirti',note:'Blanket Swiggy Kirti',amount:805,date:day(1),accountId:'bob',paidBy:'me',createdAt:2},{id:'f1',category:'Food',subcategory:'',note:'Momos',amount:130,date:day(1),accountId:'bob',paidBy:'me',createdAt:3},{id:'s1',category:'Salary',subcategory:'',note:'',amount:50000,date:day(1),accountId:'bob',paidBy:'me',createdAt:4}]});$('month').value=m;reportMode='month';render();show('home')});
 const spent=()=>p.evaluate(()=>state.records.filter(r=>kind(r.category)==='expense'&&inRange(r.date,reportRange())).reduce((n,r)=>n+reportCents(r),0)/100),bal=()=>p.evaluate(()=>balance(account('bob')));
 // Past "Paid to Kirti" is found; a purchase for her ("Blanket Swiggy Kirti") is not.
 assert.equal(await p.locator('#v9SendNotice strong').innerText(),'1 payment to a person counts as spending');
 const before={spent:await spent(),bal:await bal()};assert.equal(before.spent,3935);
 await p.click('#v9SendNotice');assert.deepEqual(await p.locator('dialog[open] .v9-send-review strong:first-child').allInnerTexts(),['Paid to Kirti']);
 await p.click('dialog[open] .primary');
 assert.equal(await spent(),935,'the payment to Kirti is no longer spending');assert.equal(await bal(),before.bal,'moving an entry keeps the balance');
 assert.deepEqual(await p.evaluate(()=>{const r=state.records.find(x=>x.id==='k1');return [r.category,r.person,r.subcategory,categoryLabel(r)]}),['Sent to people','Kirti','','Sent to Kirti']);
 assert.equal(await p.locator('#v9SendNotice').count(),0);assert.match(await p.locator('#v9SentRow').innerText(),/Sent to people · ₹3,000[\s\S]*Kirti ₹3,000/);
 // Activity totals spending only, and links to the people page grouped by person.
 await p.evaluate(()=>{expenseView='expense';show('expenses')});assert.equal(await p.locator('#expenseTotal').innerText(),'₹935');
 await p.click('#v9SentRow');assert.equal(await p.locator('dialog[open] h2').innerText(),'Sent to people');assert.deepEqual(await p.locator('dialog[open] .v9-part span').allInnerTexts(),['Kirti']);
 await p.evaluate(()=>document.querySelector('dialog[open]').close());
 // Send a new amount: To is required, the person is remembered, the balance drops and spending does not.
 await p.evaluate(()=>openEntry());await p.click('#typeSwitch [data-kind=send]');
 assert.equal(await p.evaluate(()=>category),'Sent to people');assert.equal(await p.locator('#categories').isVisible(),false);assert.equal(await p.locator('#paidBy').isVisible(),false);
 await p.evaluate(()=>{$('amount').value='500';$('amount').dispatchEvent(new Event('input',{bubbles:true}))});
 assert.equal(await p.evaluate(()=>$('saveEntry').disabled),true,'Save waits for a person');
 await p.click('#v9SendPeople button >> text=Kirti');assert.equal(await p.evaluate(()=>$('saveEntry').disabled),false);
 await p.screenshot({path:'previews/v49-send.png'});
 const b2=await bal();await p.click('#saveEntry');
 const saved=await p.evaluate(()=>state.records.at(-1));assert.deepEqual([saved.category,saved.person,saved.note,saved.amount],['Sent to people','Kirti','To Kirti',500]);
 assert.equal(await bal(),b2-500);assert.equal(await spent(),935);
 // Editing a send keeps its person; repeating it from Again fills the person too.
 await p.evaluate(id=>openEntry(id),saved.id);assert.equal(await p.locator('#v9SendPerson').inputValue(),'Kirti');assert.equal(await p.evaluate(()=>$('pageTitle')?.textContent||$('entryTitle').textContent),'Edit send');
 await p.evaluate(()=>{entrySnapshot=formSnapshot();show('home');openEntry();entryType('send')});await p.locator('#v9PadDock .v9-pad-done').click().catch(()=>{});
 await p.click('.v9-again-chip >> nth=0');assert.equal(await p.locator('#v9SendPerson').inputValue(),'Kirti');assert.equal(await p.evaluate(()=>$('saveEntry').disabled),false);
 await p.evaluate(()=>{entrySnapshot=formSnapshot();show('home')});
 // Sends are their own slice of the income allocation and come out of unspent income; they pass the backup check.
 await p.evaluate(()=>{show('insights');$('chartMode').value='allocation';render()});assert.match(await p.locator('#chart').innerText(),/Sent to people/);
 assert.equal(await p.evaluate(()=>{try{validate(JSON.parse(JSON.stringify(state)));return 'ok'}catch(e){return e.message}}),'ok');
 assert.deepEqual(errors,[]);await b.close();console.log('v49 money sent to people checks passed');
})().catch(e=>{console.error(e);process.exit(1)});

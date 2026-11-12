const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
 fs.mkdirSync('previews',{recursive:true});const b=await chromium.launch(),p=await b.newPage({viewport:{width:391,height:853},timezoneId:'Asia/Kolkata'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 await p.evaluate(()=>{const day=n=>{const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
  update({accounts:[{id:'bob',bank:'Bank of Baroda',name:'Bank of Baroda',opening:5000000,date:'2020-01-01'},{id:'cash',type:'cash',bank:'Cash',name:'Cash',opening:1000000,date:'2020-01-01'}],defaultAccount:'bob',
   categoryDefinitions:[{name:'Groceries',kind:'expense',subcategories:['Milk & dairy','Supermarket & online']}],
   records:[['m1','Groceries','Milk & dairy','Milk',28,'bob',1],['m2','Groceries','Milk & dairy','Milk',28,'bob',3],['m3','Groceries','Milk & dairy','Milk',28,'bob',5],['d1','Groceries','Supermarket & online','Dmart',1350,'cash',2],['f1','Food','','Momos',130,'cash',4],['s1','SIP','','SIP',1500,'bob',6]].map(([id,category,subcategory,note,amount,accountId,n],i)=>({id,category,subcategory,note,amount,accountId,date:day(n),createdAt:100-i,paidBy:'me',...(category==='SIP'?{investment:{amc:'HDFC AMC',scheme:'Index',group:'Mutual funds'}}:{})})),
   holdings:[{id:'h1',category:'Investments',name:'Flexi cap',provider:'Zerodha',value:24500000,date:today()}]});render();show('home')});

 // A new entry opens with the number pad ready; "Again" lists the most repeated entry first.
 await p.evaluate(()=>openEntry());await p.waitForTimeout(100);
 assert.equal(await p.evaluate(()=>$('v9PadDock').classList.contains('docked')||(()=>{const k=$('v8Keypad').getBoundingClientRect();return k.bottom<=innerHeight})()),true,'pad ready on open');
 assert.equal(await p.evaluate(()=>document.activeElement.id),'amount');
 const again=await p.locator('.v9-again-chip').allInnerTexts();assert.equal(again[0],'Milk · ₹28');assert(!again.some(t=>t.startsWith('SIP')),'investments are not offered on Add expense');
 await p.screenshot({path:'previews/v48-again.png'});
 // One tap fills everything; Save makes it a 3-tap repeat from Home.
 await p.click('.v9-again-chip >> nth=0');
 assert.deepEqual(await p.evaluate(()=>({amount:$('amount').value,note:$('note').value,category,sub:$('entrySubcategory').value,account:$('entryAccount').value,date:$('date').value===today(),save:!$('saveEntry').disabled})),{amount:'28',note:'Milk',category:'Groceries',sub:'Milk & dairy',account:'bob',date:true,save:true});
 const before=await p.evaluate(()=>state.records.length);await p.click('#saveEntry');assert.equal(await p.evaluate(()=>state.records.length),before+1);

 // Note suggestions: typing "dm" offers Dmart, which brings its category, subcategory and account.
 await p.evaluate(()=>openEntry());await p.fill('#note','dm');
 assert.deepEqual(await p.locator('.v9-note-chip').allInnerTexts(),['Dmart']);
 await p.click('.v9-note-chip');
 assert.deepEqual(await p.evaluate(()=>({note:$('note').value,category,sub:$('entrySubcategory').value,account:$('entryAccount').value})),{note:'Dmart',category:'Groceries',sub:'Supermarket & online',account:'cash'});
 // Tapping Food remembers the cash account used for Food; an account you choose yourself is never replaced.
 await p.evaluate(()=>{$('note').value='';entrySnapshot=formSnapshot();show('home');openEntry()});await p.evaluate(()=>v9PadClose());
 await p.click('#categories button >> text=Food');assert.equal(await p.evaluate(()=>$('entryAccount').value),'cash');
 // Pay from: the sheet lists accounts with balances and sets the choice.
 await p.click('#v9AccountPick');const sheet=await p.locator('dialog[open] .v9-account-row').allInnerTexts();
 const bob=await p.evaluate(()=>money(balance(account('bob'))));assert(sheet.some(t=>t.includes('Bank of Baroda')&&t.includes(bob+' available'))&&sheet.some(t=>/Cash[\s\S]*available/.test(t)),sheet.join('|'));
 await p.click('dialog[open] .v9-account-row >> text=Bank of Baroda');assert.equal(await p.evaluate(()=>$('entryAccount').value),'bob');assert.match(await p.locator('#v9AccountPick').innerText(),/Bank of Baroda/);
 await p.click('#categories button >> text=Groceries');assert.equal(await p.evaluate(()=>$('entryAccount').value),'bob','a chosen account stays');
 await p.evaluate(()=>{entrySnapshot=formSnapshot();show('home')});

 // Swipes on Home's recent list: left deletes with Undo, right repeats the entry as a new one.
 const swipe=async(sel,dx)=>{const box=await p.locator(sel).boundingBox(),y=box.y+box.height/2,x=box.x+box.width/2;await p.mouse.move(x,y);await p.mouse.down();for(let i=1;i<=8;i++){await p.mouse.move(x+dx*i/8,y);await p.waitForTimeout(10)}await p.mouse.up();await p.waitForTimeout(100)};
 const count=await p.evaluate(()=>state.records.length),first=await p.evaluate(()=>document.querySelector('#v8Home [data-record]').dataset.record);
 await swipe('#v8Home [data-record] >> nth=0',-110);
 assert.equal(await p.evaluate(()=>state.records.length),count-1);assert.equal(await p.evaluate(()=>page),'home','a swipe never opens the entry');
 assert.equal(await p.evaluate(()=>!$('undoBar').classList.contains('hidden')),true);await p.evaluate(()=>undoDelete());assert.equal(await p.evaluate(()=>state.records.length),count);
 await p.evaluate(()=>render());await swipe('#v8Home [data-record] >> nth=0',110);
 const repeated=await p.evaluate(id=>{const r=state.records.find(x=>x.id===id);return {page,editing,amount:$('amount').value,note:$('note').value,want:[String(r.amount),r.note]}},first);
 assert.equal(repeated.page,'entry');assert.equal(repeated.editing,null);assert.deepEqual([repeated.amount,repeated.note],repeated.want);
 await p.evaluate(()=>{entrySnapshot=formSnapshot();show('home')});

 // Launcher shortcuts arrive as onAppShortcut.
 await p.evaluate(()=>onAppShortcut('add'));assert.equal(await p.evaluate(()=>page),'entry');await p.evaluate(()=>{entrySnapshot=formSnapshot();show('home')});

 // Net worth: accounts plus investments minus card dues, with a month-end history.
 await p.evaluate(()=>show('invest'));
 const nw=await p.evaluate(()=>({card:$('v9NetWorth').innerText,calc:v9NetWorth(),cash:state.accounts.reduce((n,a)=>n+balance(a),0)}));
 assert.equal(nw.calc.invest,1500+245000);assert.equal(nw.calc.cash,nw.cash);assert.equal(nw.calc.total,nw.cash+246500);
 assert(nw.card.includes(await p.evaluate(()=>money(v9NetWorth().total))),nw.card);assert.match(nw.card,/Bank & cash[\s\S]*Investments/);
 assert(await p.locator('#v9NetWorth .v9-bar').count()>=2,'months since the first account are charted');
 await p.screenshot({path:'previews/v48-networth.png',fullPage:true});

 // Faster formatting keeps the same text.
 assert.deepEqual(await p.evaluate(()=>[money(123456.78),money(0),money(-450),displayDate('2026-01-05'),v8Short(today().slice(0,4)+'-03-04')]),['₹1,23,456.78','₹0','₹-450','5 Jan 2026','4 Mar']);
 assert.deepEqual(errors,[]);await b.close();console.log('v48 faster entry, account sheet, swipes, shortcuts and net worth checks passed');
})().catch(e=>{console.error(e);process.exit(1)});

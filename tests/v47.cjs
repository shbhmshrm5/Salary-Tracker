const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
 fs.mkdirSync('previews',{recursive:true});const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:700},timezoneId:'Asia/Kolkata',hasTouch:true,isMobile:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 await p.evaluate(()=>{update({accounts:[{id:'bank',bank:'HDFC',name:'Salary account',opening:5000000,date:'2020-01-01'}],defaultAccount:'bank',records:[{id:'sip',category:'SIP',amount:1500,date:today(),note:'',accountId:'bank',createdAt:1,investment:{amc:'HDFC AMC',scheme:'Index fund',group:'Mutual funds'}}]});render();show('home')});
 // Number pad: tapping the amount brings the whole pad above the pinned Save button on Expense, Invest and Income.
 for(const [label,c] of [['expense','Food'],['investment','SIP'],['income','Salary']]){
  await p.evaluate(c=>{scrollTo(0,0);openEntry(null,c)},c);await p.waitForTimeout(150);await p.tap('#amount');await p.waitForTimeout(700);
  const fit=await p.evaluate(()=>{const k=$('v8Keypad').getBoundingClientRect(),bar=$('saveEntry').closest('.form-actions').getBoundingClientRect();return {top:k.top,bottom:k.bottom,bar:bar.top}});
  assert(fit.top>=0&&fit.bottom<=fit.bar,label+' pad hidden: '+JSON.stringify(fit));
  for(const k of ['2','5','0'])await p.tap(`#v8Keypad button >> text="${k}"`);
  assert.equal(await p.evaluate(()=>$('amount').value),'250');
  const amountVisible=await p.evaluate(()=>{const r=$('amount').getBoundingClientRect();return r.bottom>0&&r.top<innerHeight});
  assert.equal(await p.evaluate(()=>$('v9PadAmount').classList.contains('show')),!amountVisible,label+': the readout shows exactly when the amount is scrolled away');
  if(!amountVisible)assert.equal(await p.locator('#v9PadAmount').innerText(),'₹ 250');
  if(label==='investment')await p.screenshot({path:'previews/v47-invest-keypad.png'});
  await p.evaluate(()=>{$('amount').value='';$('amount').dispatchEvent(new Event('input',{bubbles:true}));entrySnapshot=formSnapshot();show('home')});
 }
 // Wealth: an investment already held is added at its value without touching account balances or this month's totals.
 const before=await p.evaluate(()=>({bank:balance(account('bank')),records:state.records.length}));
 await p.evaluate(()=>show('invest'));assert.match(await p.locator('#v9HoldingsCard').innerText(),/Investments you hold/);
 await p.click('#v9HoldingsCard >> text=+ Add an investment you hold');
 const f='dialog[open] form',ins=p.locator(f+' input, '+f+' select');
 assert.equal(await ins.nth(0).inputValue(),'Mutual funds');
 await ins.nth(1).fill('Flexi cap fund');await ins.nth(2).fill('Zerodha');await ins.nth(3).fill('245000');await ins.nth(4).fill('200000');await p.click(f+' button[type=submit]');
 await p.click('#v9HoldingsCard >> text=+ Add an investment you hold');await ins.nth(0).selectOption('PPF');await ins.nth(1).fill('PPF account');await ins.nth(3).fill('180000');await p.click(f+' button[type=submit]');
 const after=await p.evaluate(()=>({bank:balance(account('bank')),records:state.records.length}));assert.deepEqual(after,before,'holdings never change balances or add entries');
 assert.equal(await p.locator('.v7-invest-hero strong').innerText(),'₹4,26,500');
 assert.match(await p.locator('.v7-invest-hero').innerText(),/₹4,25,000 held · ₹1,500 added in the app/);
 assert.match(await p.locator('#v9HoldingsCard .v8-row >> nth=0').innerText(),/\+₹45,000 · \+22\.5%/);
 assert.deepEqual(await p.locator('.v7-invest-row span').allInnerTexts(),['Zerodha','Other','HDFC AMC'],'groups include held investments');
 await p.screenshot({path:'previews/v47-wealth-holdings.png',fullPage:true});
 // Edit the value, then delete; both survive the backup check.
 await p.click('#v9HoldingsCard .v8-row >> text=Flexi cap fund');await ins.nth(3).fill('250000');await p.click(f+' button[type=submit]');
 assert.equal(await p.evaluate(()=>state.holdings.find(h=>h.name==='Flexi cap fund').value),25000000);
 assert.equal(await p.evaluate(()=>{try{validate(JSON.parse(JSON.stringify(state)));return 'ok'}catch(e){return e.message}}),'ok');
 assert.equal(await p.evaluate(()=>{try{validate({...JSON.parse(JSON.stringify(state)),holdings:[{id:'x',category:'Food',name:'Bad',provider:'',value:100,date:today()}]});return 'accepted'}catch(e){return e.message}}),'Invalid holding');
 await p.click('#v9HoldingsCard .v8-row >> text=PPF account');await p.click('dialog[open] .v8-danger');
 assert.equal(await p.evaluate(()=>state.holdings.length),1);
 assert.deepEqual(errors,[]);await b.close();console.log('v47 keypad and held investments checks passed');
})().catch(e=>{console.error(e);process.exit(1)});

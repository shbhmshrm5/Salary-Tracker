const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata'}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('dialog',d=>d.accept());
 await page.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 const result=await page.evaluate(()=>{
  const bank={id:'bank',name:'Bank',bank:'HDFC',opening:100000,date:'2026-01-01'};
  const card={id:'card',name:'Card',bank:'HDFC',type:'credit',opening:0,date:'2026-01-01',limit:100000,statementDay:10,dueDay:25};
  const records=[
   {id:'salary',category:'Salary',amount:500,date:'2026-01-05',note:'Salary',accountId:'bank'},
   {id:'food',category:'Food',amount:200,date:'2026-01-06',note:'Lunch',accountId:'bank'},
   {id:'purchase',category:'Shopping',amount:300,date:'2026-01-07',note:'Card purchase',accountId:'card'},
   {id:'refund',category:'Shopping',amount:50,date:'2026-01-08',note:'Card refund',accountId:'card',refundOf:'purchase'},
   {id:'father',category:'Food',amount:100,date:'2026-01-09',note:'Paid by father',accountId:null,paidBy:'other',person:'Father',repayNeeded:true,repayments:[{id:'repay',accountId:'bank',amount:4000,date:'2026-01-11'}]}
  ];
  if(!update({accounts:[bank,card],records,transfers:[{id:'bill',from:'bank',to:'card',amount:10000,date:'2026-01-12'}],defaultAccount:'bank'}))throw Error('Could not seed ledger');
  const starting=[balance(account('bank'),'2026-01-13'),balance(account('card'),'2026-01-13')];
  const spending=records.reduce((sum,r)=>sum+(kind(r.category)==='expense'?reportCents(r):0),0);
  const beforeTransfer=[balance(account('bank'),'2026-01-11'),balance(account('card'),'2026-01-11')];
  // A later opening date excludes earlier entries but preserves the ledger and other account.
  if(!update({accounts:[{...bank,date:'2026-01-10'},card]}))throw Error('Opening date update failed');
  const afterOpening=[balance(account('bank'),'2026-01-13'),balance(account('card'),'2026-01-13')];
  const count=state.records.length;
  return {starting,spending,beforeTransfer,afterOpening,count,version:state.version};
 });
 assert.deepStrictEqual(result.starting,[1160,-150]);
 assert.deepStrictEqual(result.beforeTransfer,[1260,-250]);
 assert.deepStrictEqual(result.afterOpening,[860,-150]);
 assert.equal(result.spending,55000);assert.equal(result.count,5);assert.equal(result.version,6);
 assert.deepStrictEqual(errors,[]);await browser.close();console.log('PASS balances, transfers, card bill, refund, repayment, opening date');
})().catch(e=>{console.error(e);process.exit(1)});

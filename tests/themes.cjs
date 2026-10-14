const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs'),path=require('path');
(async()=>{
 fs.mkdirSync('previews',{recursive:true});const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata'}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('dialog',d=>d.accept());
 await page.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 await page.evaluate(()=>{update({accounts:[{id:'bank',bank:'HDFC',name:'HDFC',opening:250000,date:'2026-01-01'}],defaultAccount:'bank',records:[{id:'one',category:'Food',amount:500,date:today(),note:'Lunch',accountId:'bank'},{id:'two',category:'Travel',amount:250,date:today(),note:'Ride',accountId:'bank'}]});render()});
 for(const [theme,accent] of [['blue',''],['teal',''],['amoled','mint'],['amoled','blue'],['amoled','lilac']]){
  await page.evaluate(([t,a])=>{setTheme(t);if(a)update({uiPreferences:{...state.uiPreferences,textSize:'comfortable',amoledAccent:a}});show('home')},[theme,accent]);
  assert(await page.locator('#homeDonut .modern-ring').isVisible());
  const image=page.locator('#accountList img').first();await page.evaluate(()=>show('accounts'));if(await image.count())assert(await image.evaluate(e=>e.complete&&e.naturalWidth>0));
  await page.evaluate(()=>show('home'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`previews/theme-${theme}${accent?'-'+accent:''}.png`});
 }
 assert.deepStrictEqual(errors,[]);await browser.close();console.log('PASS five appearance modes, charts and local bank icons');
})().catch(e=>{console.error(e);process.exit(1)});

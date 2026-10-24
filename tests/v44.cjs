const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
(async()=>{
 fs.mkdirSync('previews',{recursive:true});const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Kolkata'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto('file://'+path.resolve('app/src/main/assets/index.html'));
 // Fresh install starts on Paper and Home shows an empty state instead of zero charts.
 assert.equal(await p.getAttribute('html','data-theme'),'blue');assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()),'#FAF8F4');
 assert((await p.locator('#v8Home').innerText()).includes('No expenses yet'));assert.equal(await p.locator('#v7HomeActions').count(),0);
 await p.evaluate(()=>{update({accounts:[{id:'bank',bank:'HDFC',name:'Salary account',opening:5000000,date:'2020-01-01'},{id:'wallet',bank:'Google Pay',name:'GPay',opening:100000,date:'2020-01-01'},{id:'cash',bank:'Cash',name:'Cash',opening:200000,date:'2020-01-01'},{id:'card',type:'credit',bank:'HDFC',name:'HDFC card',opening:0,date:'2020-01-01',limit:10000000,statementDay:1,dueDay:20,last4:'1234',network:'Visa'}],defaultAccount:'bank',records:[{id:'s',category:'Salary',amount:75000,date:today(),note:'Salary',accountId:'bank',createdAt:1},{id:'f',category:'Food',amount:450,date:today(),note:'Swiggy',accountId:'wallet',createdAt:2},{id:'t',category:'Travel',amount:3000,date:today(),note:'Train',accountId:'card',createdAt:3},{id:'o',category:'Food',amount:800,date:today(),note:'Family dinner',accountId:null,paidBy:'other',person:'Father',repayNeeded:false,createdAt:4}]});render();show('home')});
 // Available = bank 1,25,000 + wallet 550 + cash 2,000 - card dues 3,000.
 assert.equal(await p.locator('#v8Available').innerText(),'₹1,24,550');assert((await p.locator('.v8-sub').innerText()).includes('₹3,000 card dues'));
 const tiles=await p.locator('.v8-tile').allInnerTexts();assert.deepEqual(tiles.map(t=>t.replace(/\s+/g,' ')),['Bank ₹1,25,000','Cash & wallets ₹2,550','Cards due ₹3,000']);
 // Spending picture: totals by category, then by where the money was paid from.
 assert.equal(await p.locator('.v8-donut-centre strong').innerText(),'₹4,250');assert.equal(await p.locator('.v8-donut circle').count(),3);
 assert.deepEqual(await p.locator('.v8-legend-row span').allInnerTexts(),['Travel','Food']);
 await p.locator('.v8-seg').getByRole('button',{name:'Paid from'}).click();assert.deepEqual(await p.locator('.v8-legend-row span').allInnerTexts(),['HDFC card','Paid by others','GPay']);
 await p.locator('.v8-seg').getByRole('button',{name:'Category'}).click();await p.locator('.v8-legend-row').filter({hasText:'Food'}).click();assert.equal(await p.locator('dialog[open].v9-category-page h2').innerText(),'Food');await p.evaluate(()=>document.querySelector('dialog[open]').close());
 await p.evaluate(()=>{categoryFilter=null;show('home')});assert.equal(await p.locator('#v8Home .v8-row').count(),4);assert.equal(await p.locator('#v8Home .v8-amount.plus').innerText(),'+₹75,000');
 // Every theme paints the bottom menu with the page colour, and the native bars get the same colour.
 const calls=[];await p.exposeFunction('nativeTheme',n=>calls.push(n));await p.evaluate(()=>{window.Android={setTheme:n=>nativeTheme(n),isSystemDark:()=>window.systemDark===true}});
 const java=fs.readFileSync('app/src/main/java/com/shubham/salarytracker/MainActivity.java','utf8');
 for(const theme of ['blue','teal','night','amoled']){await p.evaluate(t=>setTheme(t),theme);const c=await p.evaluate(()=>{const css=e=>getComputedStyle(e).backgroundColor;return {page:css(document.body),nav:css(document.querySelector('nav[data-modern]')),bar:v8Themes[document.documentElement.dataset.theme].bar}});assert.equal(c.nav,c.page,theme+' menu matches page');const hex=c.bar.replace('#','');assert.equal(c.page,'rgb('+[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')',theme+' page colour matches native bar');assert(java.includes('"'+c.bar+'"'),theme+' native colour '+c.bar+' present');await p.screenshot({path:'previews/v44-home-'+theme+'.png'})}
 await p.waitForTimeout(50);assert.deepEqual(calls.slice(-4),['blue','teal','night','amoled']);
 // Auto follows the phone: dark phone gives Night, light phone gives Paper, and the choice is remembered.
 await p.evaluate(()=>{window.systemDark=true;setTheme('auto')});assert.equal(await p.getAttribute('html','data-theme'),'night');assert.equal(await p.evaluate(()=>localStorage.getItem('salary-theme')),'auto');
 await p.evaluate(()=>{window.systemDark=false;setTheme('auto')});assert.equal(await p.getAttribute('html','data-theme'),'blue');
 // Appearance picker offers the four themes and Auto; a choice survives reload and older names upgrade.
 await p.evaluate(()=>modernAppearance());assert.equal(await p.locator('dialog[open] .v8-theme-choice').count(),5);await p.locator('dialog[open] .v8-theme-choice').filter({hasText:'Night'}).click();assert.equal(await p.getAttribute('html','data-theme'),'night');
 await p.reload();assert.equal(await p.getAttribute('html','data-theme'),'night');assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(22, 24, 27)');
 await p.evaluate(()=>setTheme('tangerine'));assert.equal(await p.getAttribute('html','data-theme'),'blue');await p.evaluate(()=>setTheme('ink'));assert.equal(await p.getAttribute('html','data-theme'),'amoled');
 // Small phones: no sideways scrolling and every Home control stays tappable.
 await p.evaluate(()=>setTheme('blue'));for(const width of [320,360,412]){await p.setViewportSize({width,height:800});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no overflow at '+width);const small=await p.locator('#v8Home button').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height<32).length);assert.equal(small,0)}
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'previews/v44-home-full.png',fullPage:true});
 assert.deepEqual(errors,[]);await b.close();console.log('PASS v5 Paper themes, Auto, native bar colours, available-to-spend, spending picture by category and account, recent list and small screens');
})().catch(e=>{console.error(e);process.exit(1)});

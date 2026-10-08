// Speech is transcribed by the phone's chosen service. Parsing and review stay local.
let lastLocalDay='',entryDateChosen=false,voiceDateChosen=false;
const MIC='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
function initVoice(){
  lastLocalDay=today();
  document.querySelectorAll('form,input').forEach(n=>n.setAttribute('autocomplete','off'));
  const start=openEntry;openEntry=function(id=null,c='Food'){
    refreshCurrentDate();if(!id){$('form').reset();editing=null;$('note').value='';$('date').value=today()}
    start(id,c);entryDateChosen=!!id;voiceDateChosen=false;const review=$('voiceEntryReview');review.classList.add('hidden');review.textContent='';entrySnapshot=formSnapshot();
  };
  $('date').addEventListener('input',()=>entryDateChosen=true);
  const review=node('p','notice hidden');review.id='voiceEntryReview';$('entryTitle').after(review);
  const entryButton=node('button','voice-entry-button');entryButton.type='button';entryButton.innerHTML=MIC+' Speak instead';entryButton.onclick=openVoice;$('entryTitle').after(entryButton);
  const mic=node('button','voice-mic');mic.type='button';mic.setAttribute('aria-label','Add by voice');mic.innerHTML=MIC;mic.onclick=openVoice;document.querySelector('.action-dock').append(mic);
  const settings=node('button','settings-row');settings.innerHTML='<span>Voice entry<small>Speak, review, then save</small></span>→';settings.onclick=openVoice;$('more').prepend(settings);
  document.querySelector('main').insertAdjacentHTML('beforeend',`<dialog id="voiceDialog" aria-labelledby="voiceTitle"><div class="dialog-head"><h2 id="voiceTitle">Add by voice</h2><button onclick="$('voiceDialog').close()" aria-label="Close voice entry">✕</button></div><p class="notice">Try “Spent 250 rupees on lunch from HDFC” or “Father paid 1000 for shopping”. Nothing is saved until you review and tap Save.</p><label for="voiceLanguage">Speaking language</label><select id="voiceLanguage"><option value="en-IN">English / Hinglish</option><option value="hi-IN">Hindi / हिन्दी</option></select><p class="notice">Your phone’s speech service handles the audio and may use the internet. Salary Tracker does not store audio. If speech is unavailable, type below.</p><button id="voiceListen" class="primary" onclick="startVoice()">Tap to speak</button><label for="voiceText">What you said · editable</label><textarea id="voiceText" rows="3" maxlength="500" placeholder="Spent 250 rupees on lunch" autocomplete="off"></textarea><p id="voiceStatus" class="notice" role="status"></p><button id="voiceReview" class="primary" onclick="reviewVoice()">Review details</button></dialog>`);
  try{$('voiceLanguage').value=localStorage.getItem('salary-voice-language')||'en-IN'}catch{}
  $('voiceLanguage').onchange=()=>{try{localStorage.setItem('salary-voice-language',$('voiceLanguage').value)}catch{}};
  window.onVoiceResult=function(text,error){$('voiceListen').disabled=false;if(!$('voiceDialog').open){if(text)openVoice();else return}if(text){$('voiceText').value=String(text).slice(0,500);$('voiceStatus').textContent='Check the words, then tap Review details.'}else $('voiceStatus').textContent=error||'No speech received. Try again or type the command.'};
  window.onAppResume=refreshCurrentDate;document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCurrentDate()});setInterval(refreshCurrentDate,30000);
}
function refreshCurrentDate(){
  const now=today();if(!lastLocalDay){lastLocalDay=now;return}if(now===lastLocalDay)return;
  const previous=lastLocalDay;lastLocalDay=now;
  if(reportMode==='month'&&$('month').value===previous.slice(0,7))$('month').value=now.slice(0,7);
  if(page==='entry'&&!editing&&!entryDateChosen&&!voiceDateChosen&&$('date').value===previous){$('date').value=now;try{entrySnapshot=JSON.stringify(JSON.parse(entrySnapshot).map(([id,value,checked])=>[id,id==='date'?now:value,checked]))}catch{}}
  $('openingDate').max=now;if(state)render();
}
function openVoice(){
  if(!state){message('Restore a valid backup first');return}
  $('voiceText').value='';$('voiceStatus').textContent='';$('voiceListen').disabled=false;$('voiceDialog').showModal();
}
function startVoice(){
  $('voiceStatus').textContent='';
  if(window.Android&&typeof Android.startVoice==='function'){$('voiceListen').disabled=true;Android.startVoice($('voiceLanguage').value)}
  else $('voiceStatus').textContent='Tap-to-speak is available in the Android app. You can type a command here.';
}
function normalVoice(s){return s.toLowerCase().replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x0966)).replace(/[’']/g,'').replace(/[,]/g,'').replace(/\s+/g,' ').trim()}
function voiceNumber(s){
  s=normalVoice(s).replace(/-/g,' ').replace(/\band\b/g,' ').trim();if(/^\d+(\.\d{1,2})?$/.test(s))return Number(s);
  s=s.replace(/ढाई सौ|dhai sau/g,'250').replace(/डेढ़ सौ|dedh sau/g,'150');if(/^\d+$/.test(s))return Number(s);
  const map={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,ek:1,do:2,teen:3,char:4,paanch:5,panch:5,chhe:6,saat:7,aath:8,nau:9,das:10,bees:20,pachas:50,'एक':1,'दो':2,'तीन':3,'चार':4,'पांच':5,'पाँच':5,'छह':6,'सात':7,'आठ':8,'नौ':9,'दस':10,'बीस':20,'तीस':30,'चालीस':40,'पचास':50,'साठ':60,'सत्तर':70,'अस्सी':80,'नब्बे':90};
  let total=0,part=0;for(const w of s.split(/\s+/)){if(!w)continue;if(/^\d+(\.\d+)?$/.test(w)){part+=Number(w);continue}if(w in map){part+=map[w];continue}if(['hundred','sau','सौ'].includes(w)){part=(part||1)*100;continue}const scale=['thousand','hazar','hazaar','हजार','हज़ार'].includes(w)?1000:['lakh','lakhs','lac','लाख'].includes(w)?100000:0;if(scale){total+=(part||1)*scale;part=0}else return null}return total+part||null;
}
function voiceAmount(t){
  // Currency-marked or expense/income-verb amounts outrank bare numbers.
  const num='(?:[0-9]+(?:\\.[0-9]{1,2})?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakhs?|lac|and|ek|do|teen|char|paanch|panch|chhe|saat|aath|nau|das|bees|pachas|sau|haza?r|hazaar|dhai|dedh|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|बीस|तीस|चालीस|पचास|साठ|सत्तर|अस्सी|नब्बे|सौ|हजार|हज़ार|लाख|ढाई|डेढ़)';
  const sequence=num+'(?:[ -]+'+num+')*';
  let m=t.match(new RegExp('(?:₹|rs\\.?|rupees?)\\s*('+sequence+')','i'));if(!m)m=t.match(new RegExp('('+sequence+')\\s*(?:rupees?|rs\\b|रुपये|रुपए|रूपये|rupaye|rupay)','i'));if(!m)m=t.match(new RegExp('(?:spent|paid|received|salary|bonus|खर्च|खर्चे|मिले)\\s*('+sequence+')','i'));
  if(m)return voiceNumber(m[1]);const numbers=t.match(/\b\d+(?:\.\d{1,2})?\b/g)||[];return numbers.length===1?Number(numbers[0]):null;
}
function voiceDate(t,base=today()){
  if(/\b(yesterday)\b|बीते दिन/.test(t)){const d=new Date(base+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return {date:d.toISOString().slice(0,10),explicit:true}}
  if(/\b(today|aaj)\b|आज/.test(t))return {date:base,explicit:true};
  const iso=t.match(/\b(\d{4}-\d{2}-\d{2})\b/);if(iso)return {date:validDate(iso[1])?iso[1]:'',explicit:true};
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const hindi=['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
  const m=t.match(new RegExp('(\\d{1,2})(?:st|nd|rd|th)?\\s+('+months.join('|')+'|'+hindi.join('|')+')(?:\\s+(\\d{4}))?'));
  if(m){const n=Math.max(months.indexOf(m[2]),hindi.indexOf(m[2]))+1,date=(m[3]||base.slice(0,4))+'-'+String(n).padStart(2,'0')+'-'+m[1].padStart(2,'0');return {date:validDate(date)?date:'',explicit:true}}
  if(/\b(kal|tomorrow|dated)\b|\bon\s+\d|कल|तारीख|\d{1,2}[\/.-]\d/.test(t))return {date:'',explicit:true};return {date:base,explicit:false};
}
function parseVoice(raw,accounts=state?.accounts||[],base=today()){
  const t=normalVoice(raw),warnings=[],result={amount:null,category:'Other',accountId:null,person:'',repayNeeded:false,note:'',...voiceDate(t,base),warnings};
  if(/^(?:repay|repaid|transfer|delete|remove)\b/.test(t)){result.unsupported=true;return result}
  if(/\bleave\b|छुट्टी|chhutti/.test(t)){
    result.leave=true;const m=t.match(/(?:from\s+)?(\d{1,2})\s*(?:to|से|se|-)\s*(\d{1,2})\s+([a-z]+|[\u0900-\u097f]+)(?:\s+(\d{4}))?/);
    if(m){result.date=voiceDate(m[1]+' '+m[3]+' '+(m[4]||base.slice(0,4)),base).date;result.end=voiceDate(m[2]+' '+m[3]+' '+(m[4]||base.slice(0,4)),base).date}else{result.end=result.date;if(!result.explicit)result.date=result.end=''}return result;
  }
  result.amount=voiceAmount(t);if(/\band\s+(?:₹\s*)?\d/.test(t)){result.amount=null;warnings.push('Use one transaction per command.');}if(!result.amount||!Number.isSafeInteger(cents(result.amount)))warnings.push('Enter or check the amount.');
  const income=/\b(received|salary|bonus|income|earned)\b|वेतन|सैलरी|बोनस|आय|मिले/.test(t)&&!/^spent\b/.test(t);
  if(income)result.category=/bonus|बोनस/.test(t)?'Bonus':/salary|वेतन|सैलरी/.test(t)?'Salary':'Other income';
  else{
    const cats=[['Food',/lunch|dinner|breakfast|food|restaurant|khana|खाना|खाने|लंच|डिनर|नाश्ता/],['Groceries',/grocer|dmart|d mart|kirana|किराना|सब्जी|सब्ज़ी/],['Travel',/travel|metro|taxi|uber|cab|petrol|diesel|मेट्रो|पेट्रोल|टैक्सी/],['Shopping',/shopping|clothes|शॉपिंग|कपड़े/],['Mobile recharge',/recharge|रिचार्ज/],['Bills',/bills?|electricity|बिजली|बिल/],['Health',/doctor|medicine|hospital|दवाई|दवा|डॉक्टर/],['Rent',/rent|किराया/],['Education',/school|fees|tuition|फीस/]];
    result.category=cats.find(([,re])=>re.test(t))?.[0]||'Other';if(result.category==='Other')warnings.push('Choose the right category.');
  }
  const people=[['Father',/\bfather\b|\bdad\b|\bpapa\b|पापा|पिताजी|पिता/],['Mother',/\bmother\b|\bmom\b|\bmummy\b|मम्मी|माँ|मां/],['Wife',/\bwife\b|पत्नी/]];
  if(!income&&/(?:father|dad|papa|mother|mom|mummy|wife)\s+(?:has\s+)?(?:paid|ne\b)|(?:पापा|पिताजी|पिता|मम्मी|माँ|मां|पत्नी)\s+ने|paid by/.test(t))result.person=people.find(([,re])=>re.test(t))?.[0]||'';
  const named=t.match(/paid by ([a-z]+(?: [a-z]+)?)(?=\s+(?:for|on|₹|\d)|$)/);if(!income&&named)result.person=named[1].replace(/\b\w/g,c=>c.toUpperCase());
  result.repayNeeded=!!result.person&&/repay|owe|return|वापस|लौटा|उधार/.test(t)&&!/no repayment|dont repay|gift|वापस नहीं/.test(t);
  const compact=s=>normalVoice(s).replace(/[^a-z0-9\u0900-\u097f]/g,'');
  const aliases={HDFC:['hdfc','एचडीएफसी'],SBI:['sbi','एसबीआई'],'Bank of Baroda':['bank of baroda','bob','बैंक ऑफ बड़ौदा'],'AU Small Finance Bank':['au bank','au small finance','एयू बैंक'],ICICI:['icici','आईसीआईसीआई'],Cash:['cash','नकद'],'Google Pay':['google pay','gpay','गूगल पे'],CRED:['cred'],PhonePe:['phonepe','फोनपे']};
  const mentioned=Object.keys(aliases).filter(k=>aliases[k].some(a=>compact(t).includes(compact(a))));
  const matches=accounts.filter(a=>(a.name&&compact(t).includes(compact(a.name)))||mentioned.includes(a.bank));
  if(!result.person){if(matches.length===1)result.accountId=matches[0].id;else if(matches.length>1||mentioned.length){result.needsAccount=true;warnings.push('Choose the account: its name was missing or ambiguous.')}}
  if(!result.date)warnings.push('Choose the date; the spoken date was unclear.');
  if(result.person)warnings.push('Confirm who paid and whether repayment is needed.');
  const note=raw.match(/\bnote\s*[:\-]?\s*(.+)$/i);if(note)result.note=note[1].slice(0,120);
  return result;
}
function reviewVoice(){
  const raw=$('voiceText').value.trim();if(!raw){$('voiceStatus').textContent='Speak or type a command first.';return}
  const r=parseVoice(raw);if(r.unsupported){$('voiceStatus').textContent='Use voice for a new expense, income or leave. Record transfers and repayments from their usual screens.';return}
  if(entryPages.includes(page)&&formSnapshot()!==entrySnapshot&&!confirm('Replace this unsaved draft with the voice entry?'))return;
  $('voiceDialog').close();
  if(r.leave){openLeave(null,r.date||today());$('leaveDate').value=r.date;$('leaveEnd').value=r.end||'';rangeEndEdited=true;previewLeaveRange();$('leaveReason').value='';$('leaveStatus').value=(r.end||r.date)>today()?'planned':'taken';message('Review leave dates and add a reason, then save.');return}
  openEntry(null,r.category);$('amount').value=r.amount||'';$('date').value=r.date;$('note').value=r.note;voiceDateChosen=r.explicit;
  if(r.person){$('paidBy').value='other';$('payerName').value=r.person;$('repayNeeded').value=r.repayNeeded?'yes':'no';syncPayer()}
  else if(r.accountId)$('entryAccount').value=r.accountId;else if(r.needsAccount){const option=node('option',null,'Choose an account');option.value='';$('entryAccount').prepend(option);$('entryAccount').value=''}
  $('voiceEntryReview').classList.remove('hidden');$('voiceEntryReview').textContent='Voice draft — check every detail before saving. '+r.warnings.join(' ');
}

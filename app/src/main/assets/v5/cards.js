let currentCardScan=null;
function installCardScan(d,f,bank,last4,network){
 const scan=node('button','card-scan-button','Scan card');scan.type='button';scan.disabled=!window.Android?.scanCard;
 const hint=node('p','notice',window.Android?.scanCard?'Scan one card, then review. Only bank, network and last four digits are filled.':'Photo scanning is available in the Android app. Manual entry works here.');
 f.prepend(scan,hint);scan.onclick=()=>{const ticket=uid();currentCardScan={ticket,d,bank,last4,network,hint,values:[bank.value,last4.value,network.value],profile:JSON.stringify(state.profile||{})};hint.textContent='Choose a clear photo of one card. Nothing is saved automatically.';Android.scanCard(ticket)};
}
window.onCardScan=function(raw){let x;try{x=JSON.parse(raw)}catch{return}const s=currentCardScan;if(!s||s.ticket!==x.ticket)return;currentCardScan=null;if(!s.d.open||!s.bank.isConnected||s.profile!==JSON.stringify(state.profile||{}))return;
 if(x.error){s.hint.textContent=x.error;return}
 if([s.bank.value,s.last4.value,s.network.value].some((v,i)=>v!==s.values[i])){s.hint.textContent='Your form changed during scanning. Scan again to fill these details.';return}
 if(x.bank&&[...s.bank.options].some(o=>o.value===x.bank))s.bank.value=x.bank;
 if(typeof x.last4==='string'&&/^[0-9]{4}$/.test(x.last4))s.last4.value=x.last4;
 if(['Visa','Mastercard','RuPay','Amex'].includes(x.network))s.network.value=x.network;
 s.d.dataset.dirty='yes';s.hint.textContent='Review the detected details. Enter your outstanding balance, limit and bill dates manually.';
};
function decorateCreditCard(card,a){
 const face=node('div','credit-card-face');face.dataset.bank=a.bank==='Bank of Baroda'?'bob':a.bank==='ICICI'?'icici':'other';const top=node('div','credit-card-top'),brand=node('div','credit-card-brand');brand.innerHTML=bankIcon(a);brand.append(node('strong',null,bankTitle(a)));top.append(brand,node('span',null,a.network||''));face.append(top,node('p','credit-card-number',a.last4?'•• '+a.last4:'Last four digits not added'),node('strong','credit-card-nickname',a.name||bankTitle(a)));
 if(state.profile?.name?.trim())face.append(node('small','credit-card-owner',state.profile.name));const amount=node('div','credit-card-outstanding');amount.append(node('small',null,'Recorded outstanding'),node('strong',null,money(Math.max(0,-balance(a)))));face.append(amount);card.prepend(face);
 const h=card.querySelector(':scope > h2');if(h)h.remove();const total=card.querySelector(':scope > strong');if(total)total.remove();
}

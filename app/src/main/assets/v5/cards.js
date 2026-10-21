function decorateCreditCard(card,a){
 const face=node('div','credit-card-face');face.dataset.bank=a.bank==='Bank of Baroda'?'bob':a.bank==='ICICI'?'icici':'other';const top=node('div','credit-card-top'),brand=node('div','credit-card-brand');brand.innerHTML=bankIcon(a);brand.append(node('strong',null,bankTitle(a)));top.append(brand,node('span',null,a.network||''));face.append(top,node('p','credit-card-number',a.last4?'•• '+a.last4:'Last four digits not added'),node('strong','credit-card-nickname',a.name||bankTitle(a)));
 if(state.profile?.name?.trim())face.append(node('small','credit-card-owner',state.profile.name));const amount=node('div','credit-card-outstanding');amount.append(node('small',null,'Recorded outstanding'),node('strong',null,money(Math.max(0,-balance(a)))));face.append(amount);card.prepend(face);
 const h=card.querySelector(':scope > h2');if(h)h.remove();const total=card.querySelector(':scope > strong');if(total)total.remove();
}

function settingsCategories(){
 const d=workflowDialog('Categories');d.append(action('+ Add category',()=>addCategoryForm()));
 const search=node('input','settings-search');search.type='search';search.placeholder='Search categories';search.setAttribute('aria-label','Search categories');d.append(search);
 const results=node('div');d.append(results);
 const draw=()=>{results.replaceChildren();for(const [key,title] of [['expense','Expenses'],['income','Income'],['aside','SIP & savings']]){const names=categoryNames(state).filter(c=>kind(c)===key&&[c,...categoryChildren(c)].join(' ').toLowerCase().includes(search.value.toLowerCase()));if(!names.length)continue;results.append(node('h3','settings-section-title',title));const group=node('div','settings-list');for(const c of names)group.append(settingsLink(c,categoryChildren(c).length?categoryChildren(c).length+' subcategories':'',()=>categoryDetails(c),c));results.append(group)}if(!results.children.length)results.append(node('p','empty','No matching categories'))};search.oninput=draw;draw();
}
function categoryDetails(c){const d=workflowDialog(c);d.append(action('+ Add subcategory',()=>addCategoryForm(c)));const list=node('div','settings-list');for(const s of categoryChildren(c)){const row=node('div','setting-item');row.append(node('span','setting-title',s));list.append(row)}d.append(list);if(!list.children.length)d.append(node('p','empty','No subcategories yet.'))}
function addCategoryForm(parent=null,fromEntry=false){
 const {d,f}=featureForm(parent?'Add subcategory':'Add category');
 const name=field(f,'Name','text','');name.maxLength=40;name.placeholder=parent?'e.g. Dining out':'e.g. Pets';
 const type=parent?null:field(f,'Type','text',fromEntry?kind(category):'expense',[['expense','Expense'],['income','Income'],['aside','SIP / savings']]);
 if(parent)f.prepend(node('p','category-parent',parent));
 submitButton(f,parent?'Save subcategory':'Save category',()=>{
  const value=name.value.trim();if(!value)throw Error('Enter a name.');
  const defs=structuredClone(state.categoryDefinitions||[]);
  if(parent){if(categoryChildren(parent).some(x=>x.toLowerCase()===value.toLowerCase()))throw Error('This subcategory already exists.');let def=defs.find(x=>x.name===parent);if(!def){def={name:parent,kind:kind(parent),subcategories:[]};defs.push(def)}def.subcategories.push(value)}
  else{if(['all expenses','other categories','__other'].includes(value.toLowerCase()))throw Error('This name is reserved for summaries. Choose another name.');if(categoryNames(state).some(x=>x.toLowerCase()===value.toLowerCase()))throw Error('This category already exists.');defs.push({name:value,kind:type.value,subcategories:[]})}
  if(!update({categoryDefinitions:defs}))return;
  d.dataset.dirty='';d.dataset.settingsBaseline=settingsSnapshot(d);
  if(fromEntry){d.close();pick(parent||value);if(parent){$('entrySubcategory').value=value;$('entrySubcategory').dispatchEvent(new Event('change',{bubbles:true}))}}
  else settingsBack();
  renderSettingsValues();message(parent?'Subcategory added':'Category added');
 });
}
function refreshEntrySubcategories(value=''){
 const s=$('entrySubcategory');if(!s)return;s.replaceChildren();const none=node('option',null,'None');none.value='';s.append(none);for(const name of categoryChildren(category)){const o=node('option',null,name);o.value=name;s.append(o)}s.value=validSubcategory(category,value,state)?value:'';
 $('entrySubcategoryGroup').hidden=categoryChildren(category).length===0;
}
function initCategoryEntry(){
 const tools=node('div','category-tools');const add=action('+ Category',()=>addCategoryForm(null,true)),sub=action('+ Subcategory',()=>addCategoryForm(category,true));tools.append(add,sub);$('moreCategories').after(tools);
 const group=node('div');group.id='entrySubcategoryGroup';const l=node('label',null,'Subcategory · optional');l.htmlFor='entrySubcategory';const s=node('select');s.id='entrySubcategory';group.append(l,s);tools.after(group);
 const oldPick=pick;pick=function(c){const value=c===category?s.value:'';oldPick(c);refreshEntrySubcategories(value);const title=editing?'Edit entry':kind(c)==='income'?'Add income':kind(c)==='aside'?'Add SIP / savings':'Add expense';$('entryTitle').textContent=title;if(page==='entry')$('pageTitle').textContent=title};
 const oldOpen=openEntry;openEntry=function(...args){const result=oldOpen(...args);if(page==='entry'){refreshEntrySubcategories(state.records.find(r=>r.id===editing)?.subcategory||'');entrySnapshot=formSnapshot()}return result};
 // Keep supplementary explanations available without filling each screen with paragraphs.
 const leaveHint=$('leaveEntry').querySelector('p.notice');if(leaveHint)leaveHint.remove();
 const subtitle=$('headerSubtitle');if(subtitle)subtitle.hidden=true;
}

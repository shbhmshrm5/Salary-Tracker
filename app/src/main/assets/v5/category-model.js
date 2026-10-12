// Category names are immutable ledger labels. Optional subcategories never change totals.
function baseCategoryKind(c){return ['Salary','Bonus','Freelance','Other income'].includes(c)?'income':['SIP','Savings','Investments'].includes(c)?'aside':'expense'}
function categoryNames(d){return BASE_CATEGORIES.concat((d?.categoryDefinitions||[]).filter(x=>!BASE_CATEGORIES.includes(x.name)).map(x=>x.name))}
function categoryChildren(c,d=state){return d?.categoryDefinitions?.find(x=>x.name===c)?.subcategories||[]}
function validSubcategory(c,s,d){return s==null||s===''||typeof s==='string'&&categoryChildren(c,d).includes(s)}
function categoryLabel(r){return r.category+(r.subcategory?' / '+r.subcategory:'')}
function validateCategoryDefinitions(d){
 if(d.categoryDefinitions==null)return;
 if(!Array.isArray(d.categoryDefinitions)||d.categoryDefinitions.length>500)throw Error('Invalid categories');
 const seen=new Set(),base=new Map(BASE_CATEGORIES.map(c=>[c.toLocaleLowerCase(),c]));
 const valid=s=>typeof s==='string'&&s===s.trim()&&s.length>0&&s.length<=40&&!/[\u0000-\u001f\u007f]/.test(s);
 for(const c of d.categoryDefinitions){
  if(!c||!valid(c.name)||!['expense','income','aside'].includes(c.kind)||!Array.isArray(c.subcategories)||c.subcategories.length>100)throw Error('Invalid category');
  const key=c.name.toLocaleLowerCase();if(seen.has(key)||base.has(key)&&(base.get(key)!==c.name||baseCategoryKind(c.name)!==c.kind))throw Error('Duplicate category');seen.add(key);
  const children=new Set();for(const s of c.subcategories){if(!valid(s)||children.has(s.toLocaleLowerCase()))throw Error('Invalid subcategory');children.add(s.toLocaleLowerCase())}
 }
}

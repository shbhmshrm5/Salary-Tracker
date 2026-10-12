// Version 4 adds payer details and repayments inside their original expense.
// The SQLite record payload stores them atomically with that expense.
function validatePayers(d) {
  const accounts = new Map(d.accounts.map(a => [a.id, a]));
  const paymentIds = new Set();
  for (const r of d.records) {
    if (r.paidBy != null && !['me','other'].includes(r.paidBy)) throw Error('Invalid payer');
    const other = r.paidBy === 'other';
    if (other && (kind(r.category,d) !== 'expense' || r.accountId != null || typeof r.person !== 'string' || !r.person.trim() || r.person.length > 40 || typeof r.repayNeeded !== 'boolean')) throw Error('Invalid outside payment');
    if (r.repayments != null && !Array.isArray(r.repayments)) throw Error('Invalid repayments');
    let paid = 0;
    for (const p of r.repayments || []) {
      const a = accounts.get(p.accountId);
      if (!other || !r.repayNeeded || !p.id || typeof p.id !== 'string' || paymentIds.has(p.id) || !a || !Number.isSafeInteger(p.amount) || p.amount <= 0 || !validDate(p.date) || p.date < r.date || p.date < a.date) throw Error('Invalid repayment');
      paymentIds.add(p.id); paid += p.amount;
      if (!Number.isSafeInteger(paid)) throw Error('Repayment too large');
    }
    if (paid > cents(r.amount)) throw Error('Repayments exceed expense');
  }
}
function repaidCents(r, asof='9999-12-31') { return (r.repayments || []).filter(p=>p.date<=asof).reduce((sum,p)=>sum+p.amount,0); }
function owedCents(r, asof=today()) { return r.paidBy==='other' && r.repayNeeded && r.date<=asof ? Math.max(0,cents(r.amount)-repaidCents(r,asof)) : 0; }
function payerDescription(r) {
  if (r.paidBy !== 'other') return account(r.accountId)?displayAccountName(account(r.accountId)):'Unassigned account';
  return 'Paid by '+r.person+(r.repayNeeded ? (owedCents(r)>0 ? ' · '+money(owedCents(r)/100)+' to repay' : ' · Repaid') : ' · No repayment');
}

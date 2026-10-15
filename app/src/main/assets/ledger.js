/* Salary Tracker 5: pure ledger rules, shared by app and automated tests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Ledger = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const BASE_CATEGORIES = [
    "Food",
    "Groceries",
    "Travel",
    "Shopping",
    "Bills",
    "Health",
    "Rent",
    "Mobile recharge",
    "Subscriptions",
    "Education",
    "Family",
    "Other",
    "SIP",
    "Savings",
    "Investments",
    "Salary",
    "Bonus",
    "Freelance",
    "Other income",
  ];
  const cents = (n) => Math.round(Number(n) * 100),
    kind = (c, d) =>
      d?.categoryDefinitions?.find((x) => x.name === c)?.kind ||
      baseCategoryKind(c);
  const validDate = (s) =>
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(Date.parse(s)) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
  function baseCategoryKind(c) {
    return ["Salary", "Bonus", "Freelance", "Other income"].includes(c)
      ? "income"
      : ["SIP", "Savings", "Investments"].includes(c)
        ? "aside"
        : "expense";
  }

  function categoryNames(d) {
    return BASE_CATEGORIES.concat(
      (d?.categoryDefinitions || [])
        .filter((x) => !BASE_CATEGORIES.includes(x.name))
        .map((x) => x.name),
    );
  }

  function categoryChildren(c, d) {
    return (
      d?.categoryDefinitions?.find((x) => x.name === c)?.subcategories || []
    );
  }

  function validSubcategory(c, s, d) {
    return (
      s == null ||
      s === "" ||
      (typeof s === "string" && categoryChildren(c, d).includes(s))
    );
  }

  function validateCategoryDefinitions(d) {
    if (d.categoryDefinitions == null) return;
    if (
      !Array.isArray(d.categoryDefinitions) ||
      d.categoryDefinitions.length > 500
    )
      throw Error("Invalid categories");
    const seen = new Set(),
      base = new Map(BASE_CATEGORIES.map((c) => [c.toLocaleLowerCase(), c]));
    const valid = (s) =>
      typeof s === "string" &&
      s === s.trim() &&
      s.length > 0 &&
      s.length <= 40 &&
      !/[\u0000-\u001f\u007f]/.test(s);
    for (const c of d.categoryDefinitions) {
      if (
        !c ||
        !valid(c.name) ||
        !["expense", "income", "aside"].includes(c.kind) ||
        !Array.isArray(c.subcategories) ||
        c.subcategories.length > 100
      )
        throw Error("Invalid category");
      const key = c.name.toLocaleLowerCase();
      if (["all expenses", "other categories", "__other"].includes(key))
        throw Error("Choose a different category name");
      if (
        seen.has(key) ||
        (base.has(key) &&
          (base.get(key) !== c.name || baseCategoryKind(c.name) !== c.kind))
      )
        throw Error("Duplicate category");
      seen.add(key);
      const children = new Set();
      for (const s of c.subcategories) {
        if (!valid(s) || children.has(s.toLocaleLowerCase()))
          throw Error("Invalid subcategory");
        children.add(s.toLocaleLowerCase());
      }
    }
  }

  /* v2/features.js */
  // Shared date helpers use ISO dates and local calendar values, never UTC day slicing.
  let reportMode = "month",
    rowLimits = {},
    leaveMode = "year",
    leaveYear = new Date().getFullYear(),
    leaveMonth =
      new Date().getFullYear() +
      "-" +
      String(new Date().getMonth() + 1).padStart(2, "0"),
    editingLeave = null,
    leaveLimit = 50;

  function validateLeaves(leaves) {
    if (!Array.isArray(leaves)) throw Error("Missing leaves");
    const ids = new Set(),
      days = new Map();
    for (const l of leaves) {
      if (
        !l ||
        typeof l.id !== "string" ||
        !l.id ||
        ids.has(l.id) ||
        !validDate(l.date) ||
        ![0.5, 1].includes(l.days) ||
        !["taken", "planned", "cancelled"].includes(l.status) ||
        typeof l.reason !== "string" ||
        !l.reason.trim() ||
        l.reason.length > 240
      )
        throw Error("Invalid leave");
      ids.add(l.id);
      if (l.status !== "cancelled") {
        days.set(l.date, (days.get(l.date) || 0) + l.days);
        if (days.get(l.date) > 1)
          throw Error("More than one day of leave on same date");
      }
    }
  }

  function validatePayers(d) {
    const accounts = new Map(d.accounts.map((a) => [a.id, a]));
    const paymentIds = new Set();
    for (const r of d.records) {
      if (r.paidBy != null && !["me", "other"].includes(r.paidBy))
        throw Error("Invalid payer");
      const other = r.paidBy === "other";
      if (
        other &&
        (kind(r.category, d) !== "expense" ||
          r.accountId != null ||
          typeof r.person !== "string" ||
          !r.person.trim() ||
          r.person.length > 40 ||
          typeof r.repayNeeded !== "boolean")
      )
        throw Error("Invalid outside payment");
      if (r.repayments != null && !Array.isArray(r.repayments))
        throw Error("Invalid repayments");
      let paid = 0;
      for (const p of r.repayments || []) {
        const a = accounts.get(p.accountId);
        if (
          !other ||
          !r.repayNeeded ||
          !p.id ||
          typeof p.id !== "string" ||
          paymentIds.has(p.id) ||
          !a ||
          !Number.isSafeInteger(p.amount) ||
          p.amount <= 0 ||
          !validDate(p.date) ||
          p.date < r.date ||
          p.date < a.date
        )
          throw Error("Invalid repayment");
        paymentIds.add(p.id);
        paid += p.amount;
        if (!Number.isSafeInteger(paid)) throw Error("Repayment too large");
      }
      if (paid > cents(r.amount)) throw Error("Repayments exceed expense");
    }
  }

  function isCard(a) {
    return a?.type === "credit";
  }

  function validateExtensions(d) {
    if (d.savingsGoal != null) {
      const g = d.savingsGoal;
      if (
        typeof g.name !== "string" ||
        !g.name.trim() ||
        g.name.length > 60 ||
        !Number.isSafeInteger(g.target) ||
        g.target <= 0 ||
        g.target > 10000000000000 ||
        !Number.isSafeInteger(g.saved) ||
        g.saved < 0 ||
        g.saved > 10000000000000
      )
        throw Error("Invalid savings goal");
    }
    if (
      d.uiPreferences != null &&
      (!d.uiPreferences ||
        typeof d.uiPreferences !== "object" ||
        !["compact", "comfortable", "large"].includes(d.uiPreferences.textSize))
    )
      throw Error("Invalid text size");
    if (
      d.uiPreferences?.amoledAccent != null &&
      !["mint", "blue", "silver", "lilac"].includes(d.uiPreferences.amoledAccent)
    )
      throw Error("Invalid AMOLED accent");
    const accounts = new Map(d.accounts.map((a) => [a.id, a])),
      records = new Map(d.records.map((r) => [r.id, r]));
    for (const r of d.records)
      if (r.investment != null) {
        const x = r.investment,
          valid = (s) =>
            typeof s === "string" &&
            s.trim() === s &&
            s.length > 0 &&
            s.length <= 60 &&
            !/[\u0000-\u001f\u007f]/.test(s);
        if (
          kind(r.category, d) !== "aside" ||
          !x ||
          !valid(x.amc) ||
          !valid(x.scheme) ||
          !valid(x.group)
        )
          throw Error("Invalid investment labels");
      }
    const safe = (n) =>
      Number.isSafeInteger(n) && Math.abs(n) <= 10000000000000;
    for (const a of d.accounts)
      if (
        isCard(a) &&
        (!safe(a.limit) ||
          a.limit <= 0 ||
          ![a.statementDay, a.dueDay].every(
            (x) => Number.isInteger(x) && x >= 1 && x <= 31,
          ))
      )
        throw Error("Invalid card details");
    for (const a of d.accounts)
      if (
        isCard(a) &&
        ((a.last4 != null && !/^(?:[0-9]{4})?$/.test(a.last4)) ||
          (a.network != null &&
            !["", "Visa", "Mastercard", "RuPay", "Amex"].includes(a.network)))
      )
        throw Error("Invalid card display details");
    const refunds = new Map();
    for (const r of d.records)
      if (r.refundOf) {
        const original = records.get(r.refundOf);
        if (
          !original ||
          original.refundOf ||
          original.shared ||
          original.paidBy === "other" ||
          kind(original.category, d) !== "expense" ||
          r.category !== original.category ||
          r.date < original.date ||
          r.paidBy === "other" ||
          !accounts.has(r.accountId)
        )
          throw Error("Invalid refund");
        refunds.set(
          original.id,
          (refunds.get(original.id) || 0) + cents(r.amount),
        );
        if (refunds.get(original.id) > cents(original.amount))
          throw Error("Refund exceeds purchase");
      }
    if (
      d.profile != null &&
      (typeof d.profile.name !== "string" || d.profile.name.length > 40)
    )
      throw Error("Invalid profile");
    for (const key of ["budgets", "schedules", "adjustments", "moneyMoves"]) {
      if (d[key] != null && !Array.isArray(d[key]))
        throw Error("Invalid collection");
      const ids = new Set();
      for (const x of d[key] || []) {
        if (!x.id || ids.has(x.id)) throw Error("Duplicate ID");
        ids.add(x.id);
        if (
          !safe(x.amount) ||
          (key === "adjustments" ? x.amount === 0 : x.amount <= 0)
        )
          throw Error("Invalid amount");
        if (key === "budgets") {
          if (
            !/^\d{4}-(0[1-9]|1[0-2])$/.test(x.month) ||
            (x.category !== "All expenses" &&
              kind(x.category, d) !== "expense") ||
            (x.category !== "All expenses" &&
              !categoryNames(d).includes(x.category))
          )
            throw Error("Invalid budget");
        } else {
          const a = accounts.get(x.accountId);
          if (!a || !validDate(x.date) || x.date < a.date)
            throw Error("Invalid account/date");
          if (
            key === "schedules" &&
            (!categoryNames(d).includes(x.category) ||
              !validSubcategory(x.category, x.subcategory, d) ||
              !["weekly", "monthly", "yearly"].includes(x.frequency) ||
              typeof x.note !== "string")
          )
            throw Error("Invalid schedule");
          if (
            key === "moneyMoves" &&
            (!["lend", "borrow", "receive", "repay"].includes(x.kind) ||
              typeof x.person !== "string" ||
              !x.person.trim() ||
              x.person.length > 40 ||
              isCard(a))
          )
            throw Error("Invalid person transaction");
        }
      }
    }
    const references = new Set(),
      occurrences = new Set();
    for (const r of d.records) {
      if (r.paymentReference) {
        if (references.has(r.paymentReference))
          throw Error("Duplicate payment reference");
        references.add(r.paymentReference);
      }
      if (r.occurrence) {
        if (occurrences.has(r.occurrence))
          throw Error("Duplicate recurring occurrence");
        occurrences.add(r.occurrence);
      }
    }
    const collectionIds = new Set();
    for (const r of d.records)
      if (r.shared) {
        const s = r.shared;
        if (
          r.paidBy === "other" ||
          r.refundOf ||
          kind(r.category, d) !== "expense" ||
          typeof s.person !== "string" ||
          !s.person.trim() ||
          s.person.length > 40 ||
          !safe(s.amount) ||
          s.amount <= 0 ||
          s.amount > cents(r.amount) ||
          !Array.isArray(s.collections)
        )
          throw Error("Invalid reimbursement");
        let total = 0;
        for (const c of s.collections) {
          const a = accounts.get(c.accountId);
          if (
            !a ||
            !c.id ||
            collectionIds.has(c.id) ||
            !safe(c.amount) ||
            c.amount <= 0 ||
            !validDate(c.date) ||
            c.date < r.date ||
            c.date < a.date
          )
            throw Error("Invalid collection");
          collectionIds.add(c.id);
          total += c.amount;
        }
        if (total > s.amount) throw Error("Reimbursement exceeds allocation");
      }
    const budgetKeys = new Set();
    for (const x of d.budgets || []) {
      const k = x.month + "|" + x.category;
      if (budgetKeys.has(k)) throw Error("Duplicate budget");
      budgetKeys.add(k);
    }
  }

  function validate(d) {
    if (d && d.version === 2) d = { ...d, version: 3, leaves: [] };
    if (d && d.version === 3) d = { ...d, version: 4 };
    if (d && d.version === 4) d = { ...d, version: 5 };
    if (d && d.version === 5) d = { ...d, version: 6 };
    if (
      !d ||
      d.version !== 6 ||
      !Array.isArray(d.accounts) ||
      !Array.isArray(d.records) ||
      !Array.isArray(d.transfers)
    )
      throw Error();
    validateCategoryDefinitions(d);
    const ids = new Set();
    for (const a of d.accounts) {
      if (
        !a ||
        typeof a.id !== "string" ||
        ids.has(a.id) ||
        typeof a.name !== "string" ||
        !a.name.trim() ||
        a.name.length > 40 ||
        typeof a.bank !== "string" ||
        !Number.isSafeInteger(a.opening) ||
        !validDate(a.date)
      )
        throw Error();
      ids.add(a.id);
    }
    const unique = new Set();
    for (const r of d.records) {
      if (
        !r ||
        typeof r.id !== "string" ||
        unique.has(r.id) ||
        !Number.isFinite(r.amount) ||
        r.amount <= 0 ||
        !Number.isSafeInteger(cents(r.amount)) ||
        !categoryNames(d).includes(r.category) ||
        !validSubcategory(r.category, r.subcategory, d) ||
        !validDate(r.date) ||
        typeof r.note !== "string" ||
        (r.accountId != null && !ids.has(r.accountId))
      )
        throw Error();
      unique.add(r.id);
    }
    const tids = new Set();
    for (const t of d.transfers) {
      if (
        !t ||
        typeof t.id !== "string" ||
        tids.has(t.id) ||
        !ids.has(t.from) ||
        !ids.has(t.to) ||
        t.from === t.to ||
        !Number.isSafeInteger(t.amount) ||
        t.amount <= 0 ||
        !validDate(t.date) ||
        d.accounts.some((a) => [t.from, t.to].includes(a.id) && t.date < a.date)
      )
        throw Error();
      tids.add(t.id);
    }
    if (d.defaultAccount != null && !ids.has(d.defaultAccount)) throw Error();
    validateLeaves(d.leaves);
    validatePayers(d);
    validateExtensions(d);
    return d;
  }

  function nextOccurrence(date, frequency, anchor) {
    const [y, m, d] = date.split("-").map(Number);
    if (frequency === "weekly") {
      const v = new Date(y, m - 1, d + 7, 12);
      return (
        v.getFullYear() +
        "-" +
        String(v.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(v.getDate()).padStart(2, "0")
      );
    }
    const month = frequency === "monthly" ? m : m - 1,
      year = frequency === "yearly" ? y + 1 : y;
    const first = new Date(year, month, 1, 12),
      day = Math.min(
        anchor || d,
        new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
      );
    return (
      first.getFullYear() +
      "-" +
      String(first.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0")
    );
  }
  function blank() {
    return {
      version: 6,
      accounts: [],
      records: [],
      transfers: [],
      leaves: [],
      defaultAccount: null,
    };
  }
  function migrate(raw) {
    const d = structuredClone(raw);
    if (d.version === 1) {
      return validate({
        ...blank(),
        records: (d.records || []).map((r) => ({ ...r, accountId: null })),
      });
    }
    return validate(d);
  }
  function reportCents(r) {
    return (cents(r.amount) - (r.shared?.amount || 0)) * (r.refundOf ? -1 : 1);
  }
  function balance(d, a, asof = "9999-12-31") {
    if (!a || asof < a.date) return 0;
    let n = a.opening;
    for (const r of d.records)
      if (r.accountId === a.id && r.date >= a.date && r.date <= asof)
        n +=
          (r.refundOf || kind(r.category, d) === "income" ? 1 : -1) *
          cents(r.amount);
    for (const t of d.transfers)
      if (t.date >= a.date && t.date <= asof) {
        if (t.from === a.id) n -= t.amount;
        if (t.to === a.id) n += t.amount;
      }
    for (const r of d.records) {
      for (const p of r.repayments || [])
        if (p.accountId === a.id && p.date >= a.date && p.date <= asof)
          n -= p.amount;
      for (const c of r.shared?.collections || [])
        if (c.accountId === a.id && c.date >= a.date && c.date <= asof)
          n += c.amount;
    }
    for (const x of d.adjustments || [])
      if (x.accountId === a.id && x.date >= a.date && x.date <= asof)
        n += x.amount;
    for (const x of d.moneyMoves || [])
      if (x.accountId === a.id && x.date >= a.date && x.date <= asof)
        n += ["borrow", "receive"].includes(x.kind) ? x.amount : -x.amount;
    return n;
  }
  function totals(d, from = "0001-01-01", to = "9999-12-31") {
    const out = { income: 0, expense: 0, aside: 0 };
    for (const r of d.records)
      if (r.date >= from && r.date <= to)
        out[kind(r.category, d)] += reportCents(r);
    return out;
  }
  function owed(r, asof = "9999-12-31") {
    return r.paidBy === "other" && r.repayNeeded && r.date <= asof
      ? Math.max(
          0,
          cents(r.amount) -
            (r.repayments || [])
              .filter((p) => p.date <= asof)
              .reduce((n, p) => n + p.amount, 0),
        )
      : 0;
  }
  return {
    BASE_CATEGORIES,
    cents,
    kind,
    validDate,
    categoryNames,
    categoryChildren,
    baseCategoryKind,
    validate,
    blank,
    migrate,
    isCard,
    nextOccurrence,
    reportCents,
    balance,
    totals,
    owed,
  };
});

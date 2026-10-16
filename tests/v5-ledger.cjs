const assert = require("node:assert/strict"),
  L = require("../app/src/main/assets/ledger.js"),
  IO = require("../app/src/main/assets/io.js");
const accounts = [
  {
    id: "bank",
    name: "HDFC",
    bank: "HDFC",
    opening: 100000,
    date: "2026-01-01",
  },
  { id: "cash", name: "Cash", bank: "Cash", opening: 0, date: "2026-01-01" },
  {
    id: "card",
    name: "BOB Card",
    bank: "Bank of Baroda",
    type: "credit",
    opening: 0,
    date: "2026-01-01",
    limit: 100000,
    statementDay: 10,
    dueDay: 25,
    last4: "0872",
    network: "RuPay",
  },
];
const records = [
  {
    id: "salary",
    category: "Salary",
    amount: 500,
    date: "2026-01-05",
    note: "Salary",
    accountId: "bank",
  },
  {
    id: "food",
    category: "Food",
    amount: 200,
    date: "2026-01-06",
    note: "Lunch",
    accountId: "bank",
  },
  {
    id: "purchase",
    category: "Shopping",
    amount: 300,
    date: "2026-01-07",
    note: "Card purchase",
    accountId: "card",
  },
  {
    id: "refund",
    category: "Shopping",
    amount: 50,
    date: "2026-01-08",
    note: "Card refund",
    accountId: "card",
    refundOf: "purchase",
  },
  {
    id: "father",
    category: "Food",
    amount: 100,
    date: "2026-01-09",
    note: "Paid by father",
    accountId: null,
    paidBy: "other",
    person: "Father",
    repayNeeded: true,
    repayments: [
      { id: "repay", accountId: "bank", amount: 4000, date: "2026-01-11" },
    ],
  },
];
const d = {
  ...L.blank(),
  accounts,
  records,
  transfers: [
    { id: "bill", from: "bank", to: "card", amount: 10000, date: "2026-01-12" },
  ],
  defaultAccount: "bank",
};
L.validate(d);
assert.equal(L.balance(d, accounts[0], "2026-01-13"), 116000);
assert.equal(L.balance(d, accounts[2], "2026-01-13"), -15000);
assert.equal(L.totals(d).expense, 55000);
assert.equal(L.owed(records[4]), 6000);
const newer = structuredClone(d);
newer.accounts[0].date = "2026-01-10";
assert.equal(L.balance(newer, newer.accounts[0], "2026-01-13"), 86000);
assert.equal(newer.records.length, 5);
const rich = structuredClone(d);
rich.records.push(
  {
    id: "sip",
    category: "SIP",
    amount: 100,
    date: "2026-02-01",
    note: "SIP, monthly\n第二行",
    accountId: "bank",
    investment: { amc: "AMC A", scheme: "Fund A", group: "Equity" },
  },
  {
    id: "shared",
    category: "Food",
    amount: 100,
    date: "2026-01-15",
    note: "=SUM(1,2)",
    accountId: "bank",
    shared: {
      person: "Friend",
      amount: 4000,
      collections: [
        { id: "col", accountId: "bank", amount: 2000, date: "2026-01-16" },
      ],
    },
  },
  {
    id: "custom",
    category: "Pets",
    subcategory: "Food",
    amount: 10,
    date: "2026-01-18",
    note: '"Quoted"\nnew line',
    accountId: "bank",
  },
  {
    id: "older",
    category: "Bonus",
    amount: 250,
    date: "2020-04-01",
    note: "Old salary",
    accountId: null,
  },
);
rich.leaves = [
  {
    id: "leave",
    date: "2026-01-05",
    days: 1,
    status: "taken",
    reason: "Personal",
  },
];
rich.categoryDefinitions = [
  { name: "Pets", kind: "expense", subcategories: ["Food"] },
];
rich.budgets = [
  { id: "budget", month: "2026-01", category: "All expenses", amount: 100000 },
];
rich.schedules = [
  {
    id: "schedule",
    category: "SIP",
    amount: 10000,
    accountId: "bank",
    note: "Monthly fund",
    date: "2026-02-28",
    frequency: "monthly",
    anchor: 31,
  },
];
rich.adjustments = [
  {
    id: "adjust",
    accountId: "bank",
    date: "2026-01-02",
    amount: -1000,
    note: "Correction",
  },
];
rich.moneyMoves = [
  {
    id: "loan",
    person: "A",
    kind: "lend",
    amount: 3000,
    accountId: "bank",
    date: "2026-01-19",
  },
];
rich.profile = { name: "Test User", custom: "preserved" };
rich.theme = "amoled";
rich.uiPreferences = { textSize: "comfortable", amoledAccent: "blue" };
rich.extraState = { future: [1, 2, 3] };
rich.accounts[1].archived = true;
L.validate(rich);
const csv = IO.fullCsv(rich),
  roundtrip = IO.inspect(csv, L.blank(), () => ""),
  rows = IO.parse(csv);
assert.deepEqual(roundtrip.data, rich);
assert.equal(rows.filter((r) => r[1] === "record").length, rich.records.length);
assert.equal(rows.filter((r) => r[1] === "repayment").length, 1);
assert.equal(rows.filter((r) => r[1] === "reimbursement").length, 1);
assert.equal(
  roundtrip.data.records.find((r) => r.id === "shared").note,
  "=SUM(1,2)",
);
assert.equal(
  L.balance(rich, rich.accounts[0]),
  L.balance(roundtrip.data, roundtrip.data.accounts[0]),
);
assert.equal(L.balance(rich, rich.accounts[0]), 93000);
assert.equal(L.totals(rich).expense, 62000);
const emptyExtended = {
  ...L.blank(),
  budgets: [],
  schedules: [],
  adjustments: [],
  moneyMoves: [],
};
assert.deepEqual(
  IO.inspect(IO.fullCsv(emptyExtended), L.blank(), () => "").data,
  emptyExtended,
);
const invalid = structuredClone(rich);
invalid.records.push({ ...invalid.records[0] });
assert.throws(() => IO.fullCsv(invalid));
assert.throws(() => IO.parse('"Date,Amount'));
const damaged = rows.filter((r) => r[1] !== "repayment");
assert.throws(
  () => IO.inspect(IO.encode(damaged), L.blank(), () => ""),
  /missing/,
);
const old = IO.encode([
  [
    "Date",
    "Type",
    "Category",
    "Amount",
    "Account",
    "Description",
    "ID",
    "Linked entry",
    "Subcategory",
  ],
  ["2026-10-01", "expense", "Food", "50", "HDFc", "Lunch", "e1", "", ""],
  ["2026-10-02", "income", "Salary", "1000", "AU Bank", "Salary", "i1", "", ""],
  ["2026-10-03", "transfer", "", "100", "AU Bank", "Cash", "t1", "", ""],
  ["2026-10-04", "expense", "Food", "20", "", "Unassigned", "e2", "", ""],
]);
let n = 0;
const legacy = IO.inspect(old, L.blank(), () => "id-" + ++n);
assert.equal(legacy.added, 4);
assert.equal(legacy.data.records.length, 3);
assert.equal(legacy.data.transfers.length, 1);
assert.equal(legacy.data.accounts.length, 3);
assert.ok(legacy.data.accounts.every((a) => a.needsOpeningBalance));
assert.equal(legacy.data.records[2].accountId, null);
assert.equal(L.totals(legacy.data).expense, 7000);
assert.equal(IO.inspect(old, legacy.data, () => "id-" + ++n).skipped, 4);
assert.throws(
  () =>
    IO.inspect(old.replace("Lunch", "Dinner"), legacy.data, () => "id-" + ++n),
  /different/,
);
assert.throws(
  () =>
    IO.inspect(
      old.replace("expense", "repayment"),
      L.blank(),
      () => "id-" + ++n,
    ),
  /Cannot safely reconstruct/,
);
assert.throws(
  () =>
    IO.inspect(
      old.replace("2026-10-01", "bad-date"),
      L.blank(),
      () => "id-" + ++n,
    ),
  /Row 2/,
);
const mapped = IO.inspect(old, d, () => "id-" + ++n, {
  HDFc: "bank",
  "AU Bank": "bank",
  Cash: "cash",
});
assert.equal(mapped.data.accounts.length, 3);
assert.ok(
  mapped.data.records.some((r) => r.id === "e1" && r.accountId === "bank"),
);
assert.equal(L.nextOccurrence("2026-02-28", "monthly", 31), "2026-03-31");
assert.equal(L.nextOccurrence("2024-02-29", "yearly", 29), "2025-02-28");
assert.equal(
  L.migrate({
    version: 1,
    records: [
      {
        id: "v1",
        category: "Food",
        amount: 5,
        date: "2020-01-01",
        note: "Old",
      },
    ],
  }).records[0].accountId,
  null,
);
assert.deepEqual(L.migrate(rich), rich);
console.log(
  "PASS ledger: balances, card bills, refunds, repayments, reimbursements, openings, investments, migration, complete CSV roundtrip, empty collections, old CSV account mapping, duplicate protection and malformed rows",
);

const nullExtended = { ...L.blank(), budgets: null, schedules: null };
assert.deepEqual(
  IO.inspect(IO.fullCsv(nullExtended), L.blank(), () => "").data,
  nullExtended,
);

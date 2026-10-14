/* A complete CSV is a restorable ledger, not a filtered report. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./ledger.js"));
  else root.LedgerIO = factory(root.Ledger);
})(typeof globalThis !== "undefined" ? globalThis : this, function (L) {
  "use strict";
  const COLLECTIONS = [
    "accounts",
    "records",
    "transfers",
    "leaves",
    "budgets",
    "schedules",
    "adjustments",
    "moneyMoves",
  ];
  const TYPES = {
    accounts: "account",
    records: "record",
    transfers: "transfer",
    leaves: "leave",
    budgets: "budget",
    schedules: "schedule",
    adjustments: "adjustment",
    moneyMoves: "moneyMove",
  };
  function encode(rows) {
    return (
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
            .join(","),
        )
        .join("\r\n")
    );
  }
  function parse(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = [];
    let row = [],
      value = "",
      quoted = false,
      closed = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            value += '"';
            i++;
          } else {
            quoted = false;
            closed = true;
          }
        } else value += c;
        continue;
      }
      if (c === '"') {
        if (value || closed) throw Error("Invalid CSV quotes");
        quoted = true;
      } else if (c === "," || c === "\r" || c === "\n") {
        row.push(value);
        value = "";
        closed = false;
        if (c !== ",") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          if (row.some((x) => x !== "")) rows.push(row);
          row = [];
        }
      } else {
        if (closed && !/\s/.test(c))
          throw Error("Unexpected text after a quoted value");
        if (!closed) value += c;
      }
    }
    if (quoted) throw Error("A quoted CSV value is unfinished");
    if (value || closed || row.length) {
      row.push(value);
      if (row.some((x) => x !== "")) rows.push(row);
    }
    return rows;
  }
  const safe = (v) =>
    /^[\s]*[=+@\-]/.test(String(v ?? "")) ? "'" + v : (v ?? "");
  function fullCsv(d) {
    L.validate(d);
    const rows = [
      [
        "Format",
        "Row type",
        "Date",
        "Type",
        "Category",
        "Subcategory",
        "Amount (₹)",
        "Account",
        "To / Person",
        "Description",
        "ID",
        "Data",
      ],
    ];
    const name = (id) => d.accounts.find((a) => a.id === id)?.name || "";
    const meta = {};
    for (const [k, v] of Object.entries(d))
      if (!COLLECTIONS.includes(k)) meta[k] = v;
    rows.push([
      "SalaryTracker/2",
      "metadata",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      JSON.stringify({
        state: meta,
        collections: COLLECTIONS.filter((k) => Object.hasOwn(d, k)),
      }),
    ]);
    for (const key of COLLECTIONS)
      for (const x of d[key] || []) {
        const amount =
          key === "records"
            ? x.amount
            : key === "accounts"
              ? x.opening / 100
              : x.amount != null
                ? x.amount / 100
                : "";
        const type =
          key === "records"
            ? x.refundOf
              ? "refund"
              : L.kind(x.category, d)
            : key === "accounts"
              ? x.type || "bank"
              : x.kind || TYPES[key];
        rows.push([
          "SalaryTracker/2",
          TYPES[key],
          x.date || x.month || "",
          type,
          safe(x.category || ""),
          safe(x.subcategory || ""),
          amount,
          safe(key === "accounts" ? x.name : name(x.accountId || x.from)),
          safe(name(x.to) || x.person || ""),
          safe(x.note || x.reason || ""),
          x.id,
          JSON.stringify(x),
        ]);
      }
    for (const r of d.records) {
      for (const p of r.repayments || [])
        rows.push([
          "SalaryTracker/2",
          "repayment",
          p.date,
          "repayment",
          "",
          "",
          p.amount / 100,
          safe(name(p.accountId)),
          safe(r.person),
          "Repayment",
          p.id,
          JSON.stringify({ recordId: r.id, payment: p }),
        ]);
      for (const p of r.shared?.collections || [])
        rows.push([
          "SalaryTracker/2",
          "reimbursement",
          p.date,
          "reimbursement",
          "",
          "",
          p.amount / 100,
          safe(name(p.accountId)),
          safe(r.shared.person),
          "Reimbursement",
          p.id,
          JSON.stringify({ recordId: r.id, payment: p }),
        ]);
    }
    return encode(rows);
  }
  function readFull(rows) {
    const h = rows.shift(),
      idx = (n) => h.indexOf(n);
    if (idx("Data") < 0 || idx("Row type") < 0 || idx("Format") < 0)
      throw Error("This full CSV is missing required columns");
    const d = {},
      collections = {},
      mirrors = [];
    let metadata = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length !== h.length)
        throw Error("CSV row " + (i + 2) + " has the wrong number of columns");
      if (row[idx("Format")] !== "SalaryTracker/2")
        throw Error("Unknown CSV format on row " + (i + 2));
      let x;
      try {
        x = JSON.parse(row[idx("Data")]);
      } catch {
        throw Error("CSV row " + (i + 2) + " has damaged backup data");
      }
      const type = row[idx("Row type")];
      if (type === "metadata") {
        metadata++;
        Object.assign(d, x.state || x);
        if (x.collections)
          for (const key of x.collections) {
            if (!COLLECTIONS.includes(key)) throw Error("Invalid collection");
            collections[key] ??= [];
          }
      } else if (["repayment", "reimbursement"].includes(type)) {
        mirrors.push({ type, ...x });
      } else {
        const key = COLLECTIONS.find((k) => TYPES[k] === type);
        if (!key) throw Error("Unknown row type: " + type);
        (collections[key] ??= []).push(x);
      }
    }
    if (metadata !== 1)
      throw Error("CSV must contain exactly one metadata row");
    for (const key of COLLECTIONS)
      if (
        collections[key] ||
        ["accounts", "records", "transfers", "leaves"].includes(key)
      )
        d[key] = collections[key] || [];
    const mirrorIds = new Set();
    for (const x of mirrors) {
      const r = d.records.find((r) => r.id === x.recordId),
        list = x.type === "repayment" ? r?.repayments : r?.shared?.collections;
      if (
        mirrorIds.has(x.payment?.id) ||
        !list?.some((p) => JSON.stringify(p) === JSON.stringify(x.payment))
      )
        throw Error("Damaged repayment or reimbursement row");
      mirrorIds.add(x.payment.id);
    }
    if (
      mirrors.length !==
      d.records.reduce(
        (n, r) =>
          n +
          (r.repayments || []).length +
          (r.shared?.collections || []).length,
        0,
      )
    )
      throw Error("A repayment or reimbursement row is missing");
    try {
      L.validate(d);
    } catch (e) {
      throw Error(
        "CSV ledger is invalid: " +
          (e.message || "check IDs, references and amounts"),
      );
    }
    return {
      mode: "full",
      data: d,
      warnings: [],
      added: d.records.length + d.transfers.length,
      skipped: 0,
    };
  }
  function legacyCsv(rows, current, uid, mapping = {}) {
    const headers = rows.shift().map((x) => x.trim().toLowerCase()),
      col = (...n) =>
        n.map((x) => headers.indexOf(x)).find((x) => x >= 0) ?? -1;
    const get = (r, ...n) => {
      const i = col(...n);
      return i >= 0 ? r[i] || "" : "";
    };
    if (["date", "amount", "category"].some((n) => col(n) < 0))
      throw Error("CSV needs Date, Amount and Category columns");
    const d = structuredClone(current),
      warnings = new Set([
        "Transaction-only CSV cannot restore opening balances, original payer details, or settings.",
      ]),
      newAccounts = [],
      seen = new Set(
        [
          ...d.records,
          ...d.transfers,
          ...(d.adjustments || []),
          ...(d.moneyMoves || []),
        ].map((x) => x.id),
      );
    let skipped = 0,
      added = 0;
    const errors = [];
    const acct = (name, date) => {
      if (!name) return null;
      if (Object.hasOwn(mapping, name)) {
        if (mapping[name]) {
          const a = d.accounts.find((a) => a.id === mapping[name]);
          if (!a) throw Error("Mapped account was not found");
          return a.id;
        }
        return null;
      }
      let a = d.accounts.find((a) => a.name === name);
      if (!a) {
        const banks = {
          hdfc: "HDFC",
          "au bank": "AU Small Finance Bank",
          bob: "Bank of Baroda",
        };
        const bank = banks[name.toLowerCase()] || name;
        a = {
          id: uid(),
          name,
          bank,
          opening: 0,
          date,
          needsOpeningBalance: true,
        };
        d.accounts.push(a);
        newAccounts.push(a.id);
      } else if (newAccounts.includes(a.id) && date < a.date) a.date = date;
      return a.id;
    };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i],
        line = i + 2;
      try {
        if (r.length !== headers.length) throw Error("Wrong number of columns");
        const date = get(r, "date"),
          raw = Number(get(r, "amount"));
        if (
          !L.validDate(date) ||
          !Number.isFinite(raw) ||
          raw === 0 ||
          !Number.isSafeInteger(L.cents(raw))
        )
          throw Error("Check date and amount");
        const type = get(r, "type") || L.kind(get(r, "category"), d);
        const id = get(r, "id") || uid();
        if (seen.has(id)) {
          const rec = d.records.find((x) => x.id === id),
            t = d.transfers.find((x) => x.id === id),
            n = Math.abs(L.cents(raw));
          const accountName = (id) =>
            d.accounts.find((a) => a.id === id)?.name || "";
          if (
            (rec &&
              (rec.date !== date ||
                L.cents(rec.amount) !== n ||
                rec.category !== get(r, "category") ||
                rec.note !== get(r, "description", "note") ||
                accountName(rec.accountId) !== get(r, "account"))) ||
            (t &&
              (t.date !== date ||
                t.amount !== n ||
                accountName(t.from) !== get(r, "account") ||
                accountName(t.to) !==
                  (get(r, "to", "destination", "to / person") ||
                    get(r, "description", "note")))) ||
            (!rec && !t)
          )
            throw Error(
              "This ID already exists with different or unsupported details. Nothing was imported.",
            );
          skipped++;
          continue;
        }
        const amount = Math.abs(L.cents(raw)),
          from = get(r, "account"),
          desc = get(r, "description", "note");
        if (type === "transfer") {
          const to = get(r, "to", "destination", "to / person") || desc;
          const source = acct(from, date),
            target = acct(to, date);
          if (!source || !target || source === target)
            throw Error(
              "Transfer needs distinct source and destination accounts",
            );
          d.transfers.push({ id, date, amount, from: source, to: target });
        } else if (["expense", "income", "aside", "refund"].includes(type)) {
          const category = get(r, "category"),
            subcategory = get(r, "subcategory");
          if (!L.categoryNames(d).includes(category)) {
            if (!category.trim() || category.length > 40)
              throw Error("Category is missing or invalid");
            (d.categoryDefinitions ??= []).push({
              name: category,
              kind: type === "refund" ? "expense" : type,
              subcategories: [],
            });
          }
          if (
            subcategory &&
            !L.categoryChildren(category, d).includes(subcategory)
          ) {
            let c = (d.categoryDefinitions ??= []).find(
              (c) => c.name === category,
            );
            if (!c) {
              c = {
                name: category,
                kind: L.kind(category, d),
                subcategories: [],
              };
              d.categoryDefinitions.push(c);
            }
            c.subcategories.push(subcategory);
          }
          const x = {
            id,
            date,
            amount: amount / 100,
            category,
            subcategory,
            note: desc,
            accountId: acct(from, date),
          };
          if (type === "refund") {
            x.refundOf = get(r, "linked entry");
            if (!x.refundOf) throw Error("Refund needs the original entry ID");
          }
          if (!from)
            warnings.add(
              "Entries with a blank account remain unassigned; check who paid them.",
            );
          d.records.push(x);
        } else if (type === "adjustment") {
          (d.adjustments ??= []).push({
            id,
            date,
            amount: L.cents(raw),
            accountId: acct(from, date),
            note: desc,
          });
        } else if (["lend", "borrow", "receive", "repay"].includes(type)) {
          (d.moneyMoves ??= []).push({
            id,
            date,
            amount,
            kind: type,
            person: desc,
            accountId: acct(from, date),
          });
        } else
          throw Error(
            "Cannot safely reconstruct " +
              type +
              " from this old CSV; use the full CSV or JSON backup",
          );
        seen.add(id);
        added++;
      } catch (e) {
        errors.push("Row " + line + ": " + e.message);
      }
    }
    if (errors.length)
      throw Error(
        errors.slice(0, 8).join("\n") +
          (errors.length > 8
            ? "\n…and " + (errors.length - 8) + " more errors"
            : ""),
      );
    if (newAccounts.length)
      warnings.add(
        newAccounts.length +
          " new accounts have unknown opening balances. They will be labelled “Set balance”.",
      );
    try {
      L.validate(d);
    } catch (e) {
      throw Error(
        "Import could not be validated: " +
          (e.message || "check linked entries and account dates"),
      );
    }
    return {
      mode: "legacy",
      data: d,
      warnings: [...warnings],
      newAccounts,
      added,
      skipped,
    };
  }
  function inspect(text, current, uid, mapping) {
    const rows = parse(text);
    if (rows.length < 2) throw Error("The CSV is empty");
    return rows[0].includes("Format")
      ? readFull(rows)
      : legacyCsv(rows, current, uid, mapping);
  }
  return { parse, encode, fullCsv, inspect, COLLECTIONS };
});

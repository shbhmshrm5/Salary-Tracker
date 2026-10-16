/* Money Map 5.4. Every screen has one implementation; no overrides. */
"use strict";
const L = Ledger,
  IO = LedgerIO,
  $ = (id) => document.getElementById(id),
  native = window.Android;
const uid = () => crypto.randomUUID(),
  today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
const money = (n) =>
    "₹" +
    (n / 100).toLocaleString(
      state?.uiPreferences?.currencyFormat === "international"
        ? "en-US"
        : "en-IN",
      { maximumFractionDigits: 2, minimumFractionDigits: 0 },
    ),
  dateLabel = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
const banks = {
    HDFC: "hdfc",
    SBI: "sbin",
    ICICI: "icic",
    Axis: "utib",
    Kotak: "kkbk",
    PNB: "punb",
    "Bank of Baroda": "barb",
    "AU Small Finance Bank": "aubl",
    "Canara Bank": "cnrb",
    "Union Bank of India": "ubin",
    "Bank of India": "bkid",
    "IDFC FIRST Bank": "idfb",
    "IndusInd Bank": "indb",
    "Federal Bank": "fdrl",
    "YES BANK": "yesb",
    "Indian Bank": "idib",
  },
  wallets = { "Google Pay": "googlepay", CRED: "cred", PhonePe: "phonepe" };
const paths = {
  home: "M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8",
  salary: "M3 7h18v12H3zM8 7V4h8v3M3 11h18M10 11v3h4v-3",
  spend: "M6 3h12v18l-3-2-3 2-3-2-3 2V3M9 7h6M9 11h6",
  calendar: "M4 5h16v16H4zM4 10h16M8 3v4M16 3v4",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  bank: "M3 8l9-5 9 5M4 9h16M6 9v10M12 9v10M18 9v10M3 21h18",
  wallet: "M3 6h18v15H3zM15 11h6v5h-6zM3 6l15-3v3",
  cash: "M3 6h18v13H3zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M6 21h12",
  card: "M3 5h18v15H3zM3 10h18M7 16h4",
  plus: "M12 5v14M5 12h14",
  mic: "M9 3h6v12H9zM6 11v3a6 6 0 0 0 12 0v-3M12 20v2M8 22h8",
  transfer: "M3 7h17l-4-4M21 17H4l4 4",
  chart: "M4 20h16M7 16v-4M12 16V8M17 16V4",
  backup: "M12 3v12M7 8l5-5 5 5M4 15v6h16v-6",
  lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
  people:
    "M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 21v-4a6 6 0 0 1 12 0v4M14 13a6 6 0 0 1 8 4v4",
  Food: "M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3v18M17 3c5 3 5 9 0 9",
  Groceries: "M3 4h2l3 12h11l2-9H6M9 20h.01M18 20h.01",
  Travel: "M4 16V7h16v9H4M7 20v-4M17 20v-4M4 11h16M7 14h.01M17 14h.01",
  Shopping: "M5 7h14l1 14H4L5 7M8 7V5a4 4 0 0 1 8 0v2",
  Health: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3",
  Other: "M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z",
};
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function icon(name) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", "22");
  s.setAttribute("height", "22");
  s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "1.7");
  s.setAttribute("stroke-linecap", "round");
  s.setAttribute("stroke-linejoin", "round");
  s.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(s.namespaceURI, "path");
  p.setAttribute("d", paths[name] || paths.Other);
  s.append(p);
  return s;
}
function button(text, fn, cls = "text-button") {
  const b = el("button", cls, text);
  b.type = "button";
  b.onclick = () => {
    try {
      fn();
    } catch (e) {
      toast(e.message || "Could not complete this action");
    }
  };
  return b;
}
function glyph(name, account) {
  const g = el("span", "glyph");
  if (account && (banks[account.bank] || wallets[account.bank])) {
    const img = el("img");
    img.src =
      (banks[account.bank] ? "banks/" : "wallets/") +
      (banks[account.bank] || wallets[account.bank]) +
      ".svg";
    img.alt = account.bank;
    g.append(img);
  } else g.append(icon(name));
  return g;
}
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("toast").classList.remove("visible"), 4500);
}
function readPref(k, fallback) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    try {
      const raw = localStorage.getItem(k);
      return k === "salary-voice-language" && ["hi-IN", "en-IN"].includes(raw)
        ? raw
        : fallback;
    } catch {
      return fallback;
    }
  }
}
function savePref(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    toast("Could not save preference");
  }
}
let state = null,
  storageError = "",
  tab = "home",
  salaryTab = "income",
  calendarTab = "leave",
  month = today().slice(0, 7),
  spendCategory = "",
  spendSearch = "",
  panelStack = [],
  dirty = false,
  panelSnapshot = "",
  scanRequest = null;
function load() {
  try {
    let raw = native?.loadData
      ? native.loadData()
      : localStorage.getItem("salary-v3");
    if (raw === "DATABASE_ERROR")
      throw Error("The saved database could not be read");
    if (!raw)
      raw =
        localStorage.getItem("salary-v3") || localStorage.getItem("salary-v2");
    let d = raw
      ? L.migrate(JSON.parse(raw))
      : L.migrate({
          version: 1,
          records: JSON.parse(localStorage.getItem("salary-v1") || "[]"),
        });
    if (d.recoveryInfo?.openingBalancesUnknown)
      for (const a of d.accounts)
        if (!a.balanceConfirmed) a.needsOpeningBalance = true;
    if (native?.saveData && !raw && !native.saveData(JSON.stringify(d)))
      throw Error("Could not migrate storage");
    // One-time appearance upgrade; financial collections and storage keys stay intact.
    if (!d.uiPreferences?.softSilver54) {
      d.theme = "amoled";
      d.uiPreferences = { textSize: "comfortable", ...d.uiPreferences,
        amoledAccent: "silver", softSilver54: true };
      L.validate(d);
      if (native?.saveData) {
        if (!native.saveData(JSON.stringify(d))) throw Error("Could not save appearance");
      } else localStorage.setItem("salary-v3", JSON.stringify(d));
    }
    state = d;
  } catch (e) {
    state = null;
    storageError =
      "Your saved data could not be read. Restore a backup; the original has been kept.";
  }
}
function save(next) {
  try {
    L.validate(next);
    const text = JSON.stringify(next);
    if (native?.saveData) {
      if (!native.saveData(text))
        throw Error("Your data could not be saved on this phone.");
    } else localStorage.setItem("salary-v3", text);
    state = next;
    applyTheme();
    return true;
  } catch (e) {
    toast(e.message || "Check the details. Nothing was saved.");
    return false;
  }
}
function change(fn) {
  if (!state) throw Error("Restore a valid backup first");
  const next = structuredClone(state);
  fn(next);
  if (!save(next)) throw Error("Changes were not saved");
  render();
}
function account(id) {
  return state?.accounts.find((a) => a.id === id);
}
function accountName(a) {
  if (!a) return "Unassigned";
  return /^hdfc$/i.test(a.name) ? "HDFC" : a.name;
}
function accountType(a) {
  return L.isCard(a)
    ? "card"
    : a.bank === "Cash"
      ? "cash"
      : wallets[a.bank] || a.bank === "Other wallet"
        ? "wallet"
        : "bank";
}
function balance(a, at = today()) {
  return L.balance(state, a, at);
}
function knownBalance(a) {
  return a.needsOpeningBalance
    ? "Set balance"
    : money(L.isCard(a) ? Math.max(0, -balance(a)) : balance(a));
}
function range() {
  const y = Number(month.slice(0, 4)),
    m = Number(month.slice(5, 7));
  return [month + "-01", month + "-" + new Date(y, m, 0).getDate()];
}
function monthRecords(kind) {
  const [from, to] = range();
  return (state?.records || []).filter(
    (r) =>
      r.date >= from &&
      r.date <= to &&
      (!kind || L.kind(r.category, state) === kind),
  );
}
function total(list) {
  return list.reduce((s, r) => s + L.reportCents(r), 0);
}
function section(title, link, fn) {
  const s = el("section", "section"),
    h = el("div", "section-head");
  h.append(el("h2", null, title));
  if (link) h.append(button(link, fn));
  s.append(h);
  return s;
}
function empty(title, text, action, fn) {
  const d = el("div", "empty");
  d.append(el("strong", null, title), el("p", null, text));
  if (action) d.append(button(action, fn));
  return d;
}
function listRow(title, sub, value, fn, g = "Other", a) {
  const b = button("", fn, "list-row");
  b.append(glyph(g, a));
  const c = el("span", "copy");
  c.append(el("strong", null, title));
  if (sub) c.append(el("small", null, sub));
  b.append(c);
  if (value != null) {
    const v = el("span", "right value", value);
    b.append(v);
  }
  b.append(el("span", "chevron", "›"));
  return b;
}
function settingRow(title, value, fn, g = "settings", color = "blue") {
  const b = button("", fn, "list-row"),
    mark = el("span", "setting-icon " + color);
  mark.append(icon(g));
  b.append(
    mark,
    el("span", "copy", title),
    el("span", "right", value || ""),
    el("span", "chevron", "›"),
  );
  return b;
}
function makeGroup(rows) {
  const g = el("div", "group");
  g.append(...rows);
  return g;
}
function detailsLine(label, value) {
  const d = el("div", "details-line");
  d.append(el("span", null, label), el("strong", null, value));
  return d;
}
function banner(title, text, action, fn) {
  const b = el("div", "banner"),
    c = el("div", "copy");
  c.append(el("strong", null, title), el("span", null, text));
  b.append(c);
  if (action) b.append(button(action, fn));
  return b;
}
function navigate(next) {
  if ($("panel").open && !closePanel()) return;
  tab = next;
  render();
  window.scrollTo(0, 0);
}
function render() {
  const main = $("main");
  main.replaceChildren();
  $("header").replaceChildren();
  $("homeActions").replaceChildren();
  const titles = {
    home: "Home",
    spend: "Spend",
    salary: "Salary",
    calendar: "Calendar",
    settings: "Settings",
  };
  $("header").append(el("h1", null, titles[tab]));
  const h = el("div", "header-actions");
  if (["home", "salary", "spend"].includes(tab)) {
    const date = el("input", "period");
    date.type = "month";
    date.value = month;
    date.setAttribute("aria-label", "Select month");
    date.onchange = () => {
      if (date.value) {
        month = date.value;
        render();
      }
    };
    h.append(date);
  }
  if (["salary", "spend"].includes(tab)) {
    const b = button("", () => quickSheet(), "icon-button");
    b.append(icon("plus"));
    b.setAttribute("aria-label", "Add entry");
    h.append(b);
  }
  if (tab === "home") {
    const b = button("", () => navigate("settings"), "icon-button");
    b.append(icon("settings"));
    b.setAttribute("aria-label", "Settings");
    h.append(b);
  }
  $("header").append(h);
  renderNavigation();
  if (!state) {
    main.append(
      banner("Data needs attention", storageError, "Restore", () =>
        backupScreen(),
      ),
    );
    return;
  }
  if (tab === "home") renderHome(main);
  else if (tab === "spend") renderSpend(main);
  else if (tab === "salary") renderSalary(main);
  else if (tab === "calendar") renderCalendar(main);
  else renderSettings(main);
}
function renderNavigation() {
  const nav = $("navigation");
  nav.replaceChildren();
  for (const [key, label, g] of [
    ["salary", "Salary", "salary"],
    ["spend", "Spend", "spend"],
    ["home", "Home", "home"],
    ["calendar", "Calendar", "calendar"],
    ["settings", "Settings", "settings"],
  ]) {
    const b = button("", () => navigate(key), key === tab ? "active" : "");
    b.append(icon(g), el("span", null, label));
    b.setAttribute("aria-current", key === tab ? "page" : "false");
    nav.append(b);
  }
}
function renderHome(main) {
  const all = state.accounts.filter((a) => !a.archived),
    cash = all.filter((a) => !L.isCard(a)),
    unknown = cash.filter((a) => a.needsOpeningBalance),
    hero = el("div", "card hero balance-hero");
  hero.append(
    el("div", "eyebrow", "Available balance"),
    el(
      "div",
      "amount",
      unknown.length ? "—" : money(cash.reduce((n, a) => n + balance(a), 0)),
    ),
    el(
      "span",
      "caption",
      unknown.length
        ? "Opening balances weren’t in your old export. Set them below."
        : "Bank, wallet & cash · today",
    ),
  );
  if (state.profile?.name)
    hero.append(el("div", "caption", "Your ledger · " + state.profile.name));
  main.append(hero);
  const grid = el("div", "money-grid");
  for (const [type, label, g] of [
    ["bank", "Bank accounts", "bank"],
    ["wallet", "Wallets", "wallet"],
    ["cash", "Cash", "cash"],
    ["card", "Card dues", "card"],
  ]) {
    const arr = all.filter((a) => accountType(a) === type),
      b = button("", () => accountsScreen(type), "money-cell");
    b.append(glyph(g));
    const c = el("span");
    c.append(
      el("small", null, label),
      el(
        "strong",
        "value",
        arr.some((a) => a.needsOpeningBalance)
          ? "Set balance"
          : money(
              arr.reduce(
                (n, a) =>
                  n + (type === "card" ? Math.max(0, -balance(a)) : balance(a)),
                0,
              ),
            ),
      ),
    );
    b.append(c);
    grid.append(b);
  }
  main.append(grid);
  const current = monthRecords("expense"),
    spent = total(current),
    prev = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)) - 2,
      1,
    ),
    prevKey =
      prev.getFullYear() + "-" + String(prev.getMonth() + 1).padStart(2, "0"),
    prevRecords = state.records.filter(
      (r) =>
        r.date.slice(0, 7) === prevKey &&
        L.kind(r.category, state) === "expense",
    ),
    s = section("Spending", null),
    card = el("div", "card");
  const head = el("div", "section-head");
  head.append(
    el("strong", "value", money(spent)),
    el("small", null, "This month"),
  );
  card.append(head);
  if (prevRecords.length) {
    const delta = spent - total(prevRecords);
    card.append(
      el(
        "p",
        "caption",
        delta === 0
          ? "Same as last month"
          : money(Math.abs(delta)) +
              (delta < 0 ? " less" : " more") +
              " than last month",
      ),
    );
  }
  if (spent > 0) card.append(donut(current));
  else
    card.append(
      empty(
        "Add your first expense",
        "",
      ),
    );
  s.append(card);
  main.append(s);
  const upcoming = (state.schedules || [])
    .filter((x) => !x.paused)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  if (upcoming.length) {
    const u = section("Coming up", "View", () => schedulesScreen());
    u.append(
      makeGroup(
        upcoming.map((x) =>
          listRow(
            x.note || x.category,
            dateLabel(x.date),
            money(x.amount),
            () => scheduleForm(x),
            "calendar",
          ),
        ),
      ),
    );
    main.append(u);
  }
  const rec = section("Recent entries", "View all", () => activityScreen());
  const list = allActivity().slice(0, 4);
  rec.append(
    list.length
      ? makeGroup(list.map(activityRow))
      : empty("No entries yet", ""),
  );
  main.insertBefore(rec, s);
  const add = button("+ Add expense", () => entryForm("expense"), "add"),
    mic = button("", () => voiceEntry(true), "mic");
  mic.append(icon("mic"));
  mic.setAttribute("aria-label", "Add expense by voice");
  $("homeActions").append(mic, add);
}
function donut(records) {
  const values = new Map();
  for (const r of records)
    values.set(r.category, (values.get(r.category) || 0) + L.reportCents(r));
  let sorted = [...values].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 4)
    sorted = sorted
      .slice(0, 4)
      .concat([
        ["Other categories", sorted.slice(4).reduce((n, [, v]) => n + v, 0)],
      ]);
  const sum = sorted.reduce((n, [, v]) => n + v, 0),
    colors =
      document.documentElement.dataset.theme === "amoled"
        ? (document.documentElement.dataset.accent === "silver"
          ? ["#e1e5e9", "#b8c1ca", "#909da9", "#6e7e8c", "#52616e"]
          : document.documentElement.dataset.accent === "blue"
            ? ["#c1d5ee", "#94b4da", "#7494ba", "#597796", "#425b75"]
            : ["#b4ead9", "#86dfc3", "#6db49e", "#558e7e", "#416d61"])
        : ["#47796f", "#799d95", "#647c98", "#a5b8ae", "#d3d9de"];
  const chart = el("div", "chart"),
    holder = el("div", "donut"),
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 140 140");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Spending by category");
  let offset = 0;
  sorted.forEach(([c, v], i) => {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    for (const [k, val] of Object.entries({
      cx: 70,
      cy: 70,
      r: 51,
      fill: "none",
      stroke: colors[i],
      "stroke-width": 15,
      pathLength: 100,
      "stroke-dasharray": `${(v / sum) * 100} ${100 - (v / sum) * 100}`,
      "stroke-dashoffset": -offset,
      transform: "rotate(-90 70 70)",
    }))
      circle.setAttribute(k, val);
    svg.append(circle);
    offset += (v / sum) * 100;
  });
  const label = document.createElementNS(svg.namespaceURI, "text");
  label.setAttribute("x", "70");
  label.setAttribute("y", "75");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("fill", "var(--text)");
  label.setAttribute("font-size", "17");
  label.setAttribute("font-weight", "600");
  label.textContent = "100%";
  svg.append(label);
  holder.append(svg);
  const legend = el("div", "legend");
  sorted.forEach(([c, v], i) => {
    const row = el("div"),
      dot = el("i", "dot");
    dot.style.background = colors[i];
    row.append(
      dot,
      el("span", null, c),
      el("span", null, ((v / sum) * 100).toFixed(0) + "%"),
    );
    legend.append(row);
  });
  chart.append(holder, legend);
  return chart;
}
function allActivity() {
  const rows = state.records.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.note || r.category,
    sub:
      (r.refundOf ? "Refund · " : "") +
      r.category +
      (r.subcategory ? " / " + r.subcategory : "") +
      " · " +
      (r.paidBy === "other"
        ? "Paid by " + r.person
        : accountName(account(r.accountId))),
    amount: L.cents(r.amount),
    type: L.kind(r.category, state),
    icon: r.category,
    open: () => entryDetails(r),
  }));
  for (const t of state.transfers)
    rows.push({
      id: t.id,
      date: t.date,
      title: "Transfer",
      sub: accountName(account(t.from)) + " → " + accountName(account(t.to)),
      amount: t.amount,
      type: "transfer",
      icon: "transfer",
      open: () => transferDetails(t),
    });
  for (const r of state.records) {
    for (const p of r.repayments || [])
      rows.push({
        id: p.id,
        date: p.date,
        title: "Repayment to " + r.person,
        sub: accountName(account(p.accountId)),
        amount: p.amount,
        type: "repayment",
        icon: "people",
        open: () => entryDetails(r),
      });
    for (const c of r.shared?.collections || [])
      rows.push({
        id: c.id,
        date: c.date,
        title: "Reimbursement from " + r.shared.person,
        sub: accountName(account(c.accountId)),
        amount: c.amount,
        type: "reimbursement",
        icon: "people",
        open: () => entryDetails(r),
      });
  }
  for (const x of state.adjustments || [])
    rows.push({
      id: x.id,
      date: x.date,
      title: "Balance adjustment",
      sub: x.note + " · " + accountName(account(x.accountId)),
      amount: x.amount,
      type: "adjustment",
      icon: "bank",
      open: () => adjustmentDetails(x),
    });
  for (const x of state.moneyMoves || [])
    rows.push({
      id: x.id,
      date: x.date,
      title: x.kind + " · " + x.person,
      sub: accountName(account(x.accountId)),
      amount: x.amount,
      type: x.kind,
      icon: "people",
      open: () => moneyMoveDetails(x),
    });
  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
}
function activityRow(x) {
  const b = listRow(x.title, x.sub, money(x.amount), x.open, x.icon);
  if (x.type === "income" || x.type === "aside")
    b.querySelector(".value").classList.add(
      x.type === "income" ? "income" : "invest",
    );
  return b;
}
function transactionGroups(target, rows) {
  let last = "";
  let group;
  for (const x of rows) {
    if (x.date !== last) {
      last = x.date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const y =
        yesterday.getFullYear() +
        "-" +
        String(yesterday.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(yesterday.getDate()).padStart(2, "0");
      target.append(
        el(
          "h3",
          null,
          x.date === today()
            ? "Today"
            : x.date === y
              ? "Yesterday"
              : dateLabel(x.date),
        ),
      );
      group = el("div", "group");
      target.append(group);
    }
    group.append(activityRow(x));
  }
  if (!rows.length)
    target.append(
      empty("No entries here", "Try another month or add an entry."),
    );
}
function activityScreen(filter) {
  openPanel(filter ? "Account history" : "All entries", (body) => {
    const rows = allActivity().filter(
      (x) =>
        !filter ||
        state.records.some((r) => r.id === x.id && r.accountId === filter) ||
        state.transfers.some(
          (t) => t.id === x.id && [t.from, t.to].includes(filter),
        ) ||
        state.records.some((r) =>
          [...(r.repayments || []), ...(r.shared?.collections || [])].some(
            (p) => p.id === x.id && p.accountId === filter,
          ),
        ) ||
        [...(state.adjustments || []), ...(state.moneyMoves || [])].some(
          (r) => r.id === x.id && r.accountId === filter,
        ),
    );
    const search = el("input", "search");
    search.placeholder = "Search entries";
    search.setAttribute("aria-label", "Search entries");
    const list = el("div");
    const draw = () => {
      list.replaceChildren();
      transactionGroups(
        list,
        rows.filter((r) =>
          (r.title + " " + r.sub)
            .toLowerCase()
            .includes(search.value.toLowerCase()),
        ),
      );
    };
    search.oninput = draw;
    body.append(search, list);
    draw();
  });
}
function renderSpend(main) {
  const records = monthRecords("expense"),
    hero = el("div", "card hero");
  hero.append(
    el("div", "eyebrow", "Total spent"),
    el("div", "amount expense", money(total(records))),

  );
  main.append(hero);
  if (total(records) > 0) {
    const breakdown = el("div", "spend-breakdown");
    const totals = new Map();
    for (const r of records) totals.set(r.category, (totals.get(r.category) || 0) + L.reportCents(r));
    for (const [name, amount] of [...totals].filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,4)) {
      const row = el("div", "bar-row"), track = el("div", "track"), fill = el("span");
      fill.style.width = Math.min(100, amount / Math.max(1,total(records)) * 100) + "%";
      track.append(fill);
      row.append(el("span", null, name), el("strong", "value", money(amount)), track);
      breakdown.append(row);
    }
    main.append(breakdown);
  }
  const actions = el("div", "section-head");
  actions.append(
    button("All movements", () => activityScreen()),
    button("Voice entry", () => voiceEntry(true)),
  );
  main.append(actions);
  const cats = el("div", "chips");
  for (const c of [
    "",
    ...L.categoryNames(state).filter((c) => L.kind(c, state) === "expense"),
  ])
    cats.append(
      button(
        c || "All categories",
        () => {
          spendCategory = c;
          render();
        },
        c === spendCategory ? "selected" : "",
      ),
    );
  main.append(cats);
  const search = el("input", "search");
  search.placeholder = "Search expenses";
  search.value = spendSearch;
  search.setAttribute("aria-label", "Search expenses");
  const list = el("div");
  const draw = () => {
    list.replaceChildren();
    const ids = new Set(
      records
        .filter(
          (r) =>
            (!spendCategory || r.category === spendCategory) &&
            (r.note + " " + r.category)
              .toLowerCase()
              .includes(search.value.toLowerCase()),
        )
        .map((r) => r.id),
    );
    transactionGroups(
      list,
      allActivity().filter((x) => ids.has(x.id)),
    );
  };
  search.oninput = () => {
    spendSearch = search.value;
    draw();
  };
  main.append(search, list);
  draw();
}
function segment(items, value, onChange) {
  const t = el("div", "tabs");
  for (const [k, label] of items) {
    const b = button(label, () => onChange(k), k === value ? "selected" : "");
    b.setAttribute("aria-pressed", String(k === value));
    t.append(b);
  }
  return t;
}
function renderSalary(main) {
  main.append(
    segment(
      [
        ["income", "Income"],
        ["cards", "Cards"],
        ["invest", "Invest"],
      ],
      salaryTab,
      (k) => {
        salaryTab = k;
        render();
      },
    ),
  );
  if (salaryTab === "cards") {
    renderCards(main);
    return;
  }
  if (salaryTab === "invest") {
    renderInvest(main);
    return;
  }
  const rec = monthRecords("income").sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
    hero = el("div", "card hero");
  hero.append(
    el("div", "eyebrow", "Income this month"),
    el("div", "amount income", money(total(rec))),
  );
  const latest = state.records
    .filter((r) => r.category === "Salary" && r.date <= today())
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  hero.append(
    el(
      "p",
      "caption",
      latest
        ? "Last salary · " +
            money(L.cents(latest.amount)) +
            " on " +
            dateLabel(latest.date)
        : "",
    ),
  );
  const next = (state.schedules || [])
    .filter((x) => x.category === "Salary" && !x.paused && x.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (next) {
    const days = Math.round(
      (Date.parse(next.date) - Date.parse(today())) / 86400000,
    );
    hero.append(el("div", "pill", "Next salary · " + days + " days"));
  }
  main.append(el("div", "spacer"), hero);
  const s = section("This month", "Add income", () => entryForm("income"));
  transactionGroups(
    s,
    allActivity().filter((x) => rec.some((r) => r.id === x.id)),
  );
  main.append(s);
  const fy =
      Number(month.slice(5, 7)) < 4
        ? Number(month.slice(0, 4)) - 1
        : Number(month.slice(0, 4)),
    f = el("details", "section financial-year"),
    card = el("div", "card");
  f.append(el("summary", null, "Financial year · Apr " + fy + " – Mar " + (fy + 1)));
  const bars = el("div", "month-bars");
  const vals = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(fy, 3 + i, 1),
        key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      return {
        label: d.toLocaleDateString("en-IN", { month: "short" }).slice(0, 1),
        v: total(
          state.records.filter(
            (r) =>
              r.date.slice(0, 7) === key &&
              L.kind(r.category, state) === "income",
          ),
        ),
      };
    }),
    max = Math.max(1, ...vals.map((x) => x.v));
  for (const x of vals) {
    const col = el("div"),
      bar = el("i");
    bar.style.height = Math.max(2, (x.v / max) * 65) + "px";
    col.setAttribute("aria-label", x.label + " " + money(x.v));
    col.append(bar, el("small", null, x.label));
    bars.append(col);
  }
  card.append(bars);
  f.append(card);
  main.append(f);
}
function renderCards(main) {
  const list = state.accounts.filter((a) => L.isCard(a) && !a.archived);
  main.append(
    button("+ Add credit card", () => accountForm(null, "card"), "secondary"),
  );
  if (!list.length) {
    main.append(
      empty(
        "Your cards, neatly organised",
        "Add a card or scan it, then record purchases and bill payments.",
      ),
    );
    return;
  }
  for (const a of list) {
    const c = el("div", "credit-card"),
      top = el("div", "card-top");
    top.append(
      glyph("card", a),
      el("strong", null, accountName(a)),
      el("span", "caption", a.network || "Credit card"),
    );
    c.append(
      top,
      el("div", "card-chip"),
      el("p", "caption", "•• " + (a.last4 || "Not set")),
      el(
        "div",
        "amount",
        a.needsOpeningBalance ? "Set balance" : money(Math.max(0, -balance(a))),
      ),
      el("p", "caption", "Outstanding · limit " + money(a.limit)),
    );
    const spent = state.records.filter(
      (r) =>
        r.accountId === a.id &&
        L.kind(r.category, state) === "expense" &&
        r.date.slice(0, 7) === month,
    );
    c.append(
      el("p", "caption", "Purchases this month · " + money(total(spent))),
    );
    const bottom = el("div", "card-bottom");
    bottom.append(
      button("Details", () => accountDetails(a), "text-button"),
      button("Record payment", () => transferForm(null, a.id)),
    );
    c.append(el("div", "spacer"), bottom);
    const status = el("div", "card-status");
    status.append(
      el(
        "span",
        "pill",
        "Statement day " + a.statementDay + " · due day " + a.dueDay,
      ),
    );
    main.append(el("div", "spacer"), c, status);
  }
}
function renderInvest(main) {
  const all = state.records.filter(
      (r) => L.kind(r.category, state) === "aside",
    ),
    hero = el("div", "card hero");
  hero.append(
    el("div", "eyebrow", "Recorded investments"),
    el("div", "amount invest", money(total(all))),
    el("p", "caption", "Manual contributions · no live market values"),
  );
  const metrics = el("div", "metric-row");
  for (const [label, v] of [
    ["This month", total(monthRecords("aside"))],
    ["SIP", total(all.filter((r) => r.category === "SIP"))],
    ["Savings", total(all.filter((r) => r.category === "Savings"))],
  ]) {
    const c = el("div");
    c.append(el("small", null, label), el("strong", "value invest", money(v)));
    metrics.append(c);
  }
  hero.append(metrics);
  main.append(
    el("div", "spacer"),
    hero,
    button("+ Add investment", () => entryForm("aside"), "secondary"),
  );
  if (all.length) {
    const s = section("By AMC & category"),
      g = el("div", "group"),
      groups = new Map();
    for (const r of all) {
      const key =
        (r.investment?.amc || "AMC not set") +
        " · " +
        (r.investment?.group || r.category);
      groups.set(key, (groups.get(key) || 0) + L.reportCents(r));
    }
    for (const [k, v] of groups)
      g.append(
        listRow(
          k,
          "Manual contributions",
          money(v),
          () => investmentHistory(k),
          "chart",
        ),
      );
    s.append(g);
    main.append(s);
  }
  const sched = (state.schedules || []).filter(
    (x) => L.kind(x.category, state) === "aside",
  );
  if (sched.length) {
    const s = section("Monthly SIPs", "Manage", () => schedulesScreen());
    s.append(
      makeGroup(
        sched.map((x) =>
          listRow(
            x.note || x.category,
            "Next " + dateLabel(x.date) + (x.paused ? " · Paused" : ""),
            money(x.amount),
            () => scheduleForm(x),
            "calendar",
          ),
        ),
      ),
    );
    main.append(s);
  }
  if (state.savingsGoal) {
    const g = state.savingsGoal,
      s = section("Savings goal", "Edit", () => goalForm()),
      c = el("div", "card"),
      track = el("div", "track"),
      bar = el("span");
    bar.style.width = Math.min(100, (g.saved / g.target) * 100) + "%";
    track.append(bar);
    c.append(
      el("strong", null, g.name),
      el("p", "caption", money(g.saved) + " of " + money(g.target)),
      el("div", "spacer"),
      track,
    );
    s.append(c);
    main.append(s);
  }
}
function investmentHistory(key) {
  openPanel("Investment entries", (body) => {
    const r = state.records.filter(
      (r) =>
        L.kind(r.category, state) === "aside" &&
        (r.investment?.amc || "AMC not set") +
          " · " +
          (r.investment?.group || r.category) ===
          key,
    );
    const ids = new Set(r.map((x) => x.id));
    transactionGroups(
      body,
      allActivity().filter((x) => ids.has(x.id)),
    );
  });
}
function renderCalendar(main) {
  main.append(
    segment(
      [
        ["leave", "Leave tracker"],
        ["budget", "Budgets"],
      ],
      calendarTab,
      (k) => {
        calendarTab = k;
        render();
      },
    ),
  );
  if (calendarTab === "budget") {
    renderBudgets(main);
    return;
  }
  const [y, m] = month.split("-").map(Number),
    step = el("div", "month-step");
  const shift = (n) => {
    const d = new Date(y, m - 1 + n, 1);
    month = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    render();
  };
  const prev = button("‹", () => shift(-1), "icon-button"),
    next = button("›", () => shift(1), "icon-button");
  prev.setAttribute("aria-label", "Previous month");
  next.setAttribute("aria-label", "Next month");
  step.append(
    prev,
    el(
      "strong",
      null,
      new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    ),
    next,
  );
  main.append(el("div", "spacer"), step);
  const leaves = state.leaves.filter((x) => x.date.slice(0, 7) === month),
    metrics = el("div", "leave-summary");
  for (const [label, status] of [
    ["Taken", "taken"],
    ["Planned", "planned"],
  ]) {
    const c = el("div");
    c.append(
      el("small", null, label),
      el(
        "strong",
        null,
        leaves
          .filter((x) => x.status === status)
          .reduce((n, x) => n + x.days, 0) + " days",
      ),
    );
    metrics.append(c);
  }
  main.append(metrics);
  const c = el("div", "card calendar-card"),
    grid = el("div", "calendar-grid");
  for (const day of ["M", "T", "W", "T", "F", "S", "S"])
    grid.append(el("span", null, day));
  for (let i = 0; i < (new Date(y, m - 1, 1).getDay() + 6) % 7; i++)
    grid.append(el("span"));
  for (let i = 1; i <= new Date(y, m, 0).getDate(); i++) {
    const date = month + "-" + String(i).padStart(2, "0"),
      found = leaves.filter((x) => x.date === date && x.status !== "cancelled"),
      b = button(i, () =>
        found.length ? leaveDay(date) : leaveForm(null, date),
      );
    b.setAttribute("aria-label", dateLabel(date));
    if (found.length) b.classList.add("marked");
    if (found.some((x) => x.status === "planned")) b.classList.add("planned");
    if (date === today()) b.classList.add("today");
    grid.append(b);
  }
  c.append(grid);
  main.append(
    c,
    button("+ Add leave or date range", () => leaveForm(), "secondary"),
  );
  const s = section("Leave entries", "All dates", () => leaveHistory());
  s.append(
    leaves.length
      ? makeGroup(
          leaves
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((x) =>
              listRow(
                x.reason,
                dateLabel(x.date) + " · " + x.status,
                x.days + " day" + (x.days === 1 ? "" : "s"),
                () => leaveForm(x),
                "calendar",
              ),
            ),
        )
      : empty("No leave this month", "Tap a day or add a date range."),
  );
  main.append(s);
}
function leaveDay(date) {
  const rows = state.leaves.filter((x) => x.date === date);
  if (rows.length === 1) leaveForm(rows[0]);
  else
    openPanel(dateLabel(date), (body) =>
      body.append(
        makeGroup(
          rows.map((x) =>
            listRow(
              x.reason,
              x.status,
              x.days + " days",
              () => leaveForm(x),
              "calendar",
            ),
          ),
        ),
        button(
          "+ Add another half-day",
          () => leaveForm(null, date),
          "secondary",
        ),
      ),
    );
}
function leaveHistory() {
  openPanel("All leave entries", (body) => {
    body.append(
      makeGroup(
        [...state.leaves]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((x) =>
            listRow(
              x.reason,
              dateLabel(x.date) + " · " + x.status,
              x.days + " days",
              () => leaveForm(x),
              "calendar",
            ),
          ),
      ),
    );
    if (!state.leaves.length)
      body.append(empty("No leave recorded", "Add a day or a date range."));
  });
}
function renderBudgets(main) {
  main.append(el("div", "spacer"));
  const p = el("input", "period");
  p.type = "month";
  p.value = month;
  p.setAttribute("aria-label", "Budget month");
  p.onchange = () => {
    month = p.value;
    render();
  };
  main.append(
    p,
    button("+ Set budget", () => budgetForm(), "secondary"),
  );
  const list = (state.budgets || []).filter((x) => x.month === month);
  if (!list.length) {
    main.append(
      empty(
        "A simple spending plan",
        "Set an overall limit or a category budget.",
      ),
    );
    return;
  }
  for (const b of list) {
    const used = total(
        monthRecords("expense").filter(
          (r) => b.category === "All expenses" || r.category === b.category,
        ),
      ),
      s = section(b.category, "Edit", () => budgetForm(b)),
      c = el("div", "card"),
      track = el("div", "track"),
      bar = el("span");
    bar.style.width = Math.max(0, Math.min(100, (used / b.amount) * 100)) + "%";
    if (used > b.amount) bar.style.background = "var(--expense)";
    track.append(bar);
    c.append(
      el("strong", "value", money(used) + " / " + money(b.amount)),
      el(
        "p",
        "caption",
        money(Math.abs(b.amount - used)) +
          (used > b.amount ? " over budget" : " remaining"),
      ),
      el("div", "spacer"),
      track,
    );
    s.append(c);
    main.append(s);
  }
}
function renderSettings(main) {
  const prefs = readPref("salary-backup-prefs", {}),
    last = prefs.lastSaved,
    stale = !last || Date.now() - Date.parse(last) > 7 * 86400000;
  main.append(
    banner(
      stale ? "Keep a copy of your data" : "Backup saved",
      last
        ? "Last successful export · " +
            new Date(last).toLocaleDateString("en-IN")
        : "Data lives on this phone. Save a full CSV or JSON backup.",
      "Backup",
      () => backupScreen(),
    ),
  );
  const search = el("input", "search");
  search.placeholder = "Search settings";
  search.setAttribute("aria-label", "Search settings");
  main.append(search);
  const groups = [
    [
      "Accounts",
      [
        [
          "Accounts & cards",
          state.accounts.filter((a) => !a.archived).length + " accounts",
          () => accountsScreen(),
          "bank",
          "blue",
          "bank wallet cash credit",
        ],
        [
          "Default spending account",
          state.defaultAccount
            ? accountName(account(state.defaultAccount))
            : "Choose account",
          () => defaultAccountScreen(),
          "wallet",
          "teal",
          "default",
        ],
        [
          "Categories & subcategories",
          L.categoryNames(state).length + " categories",
          () => categoriesScreen(),
          "Other",
          "purple",
          "category",
        ],
        [
          "Transfer money",
          "Between accounts",
          () => transferForm(),
          "transfer",
          "blue",
          "payment bill",
        ],
      ],
    ],
    [
      "Planning",
      [
        [
          "Budgets",
          (state.budgets || []).length + " limits",
          () => {
            calendarTab = "budget";
            navigate("calendar");
          },
          "chart",
          "purple",
          "budget",
        ],
        [
          "Recurring entries",
          (state.schedules || []).length + " schedules",
          () => schedulesScreen(),
          "calendar",
          "teal",
          "sip salary repeat",
        ],
        [
          "Investments",
          "Manual contributions",
          () => {
            salaryTab = "invest";
            navigate("salary");
          },
          "chart",
          "teal",
          "amc sip savings",
        ],
        [
          "People & settlements",
          money(state.records.reduce((n, r) => n + L.owed(r, today()), 0)) +
            " to repay",
          () => peopleScreen(),
          "people",
          "rose",
          "father lend borrow repayment",
        ],
        [
          "Insights",
          "Reports & date ranges",
          () => insightsScreen(),
          "chart",
          "blue",
          "report financial year",
        ],
      ],
    ],
    [
      "Preferences",
      [
        [
          "Appearance",
          themeLabel(),
          () => appearanceScreen(),
          "settings",
          "purple",
          "theme amoled dark text size",
        ],
        [
          "Currency format",
          state.uiPreferences?.currencyFormat === "international"
            ? "International"
            : "Indian",
          () => currencyScreen(),
          "cash",
          "teal",
          "rupees numbers lakh comma",
        ],
        [
          "Voice entry",
          readPref("salary-voice-language", "en-IN") === "hi-IN"
            ? "Hindi"
            : "English / Hinglish",
          () => voiceSettings(),
          "mic",
          "blue",
          "speech language",
        ],
        [
          "Payment capture",
          paymentStatus(),
          () => captureScreen(),
          "spend",
          "teal",
          "notification permissions",
        ],
        [
          "Your profile",
          state.profile?.name || "Name not set",
          () => profileForm(),
          "people",
          "purple",
          "name",
        ],
      ],
    ],
    [
      "Data & security",
      [
        [
          "Backup & restore",
          last
            ? new Date(last).toLocaleDateString("en-IN")
            : "Not exported yet",
          () => backupScreen(),
          "backup",
          "blue",
          "json restore recover",
        ],
        [
          "Import / export CSV",
          "All entries & accounts",
          () => importExportScreen(),
          "transfer",
          "teal",
          "excel csv",
        ],
        [
          "App lock",
          native?.appLockEnabled
            ? native.appLockEnabled()
              ? "On"
              : "Off"
            : "Android only",
          () => lockScreen(),
          "lock",
          "purple",
          "privacy pin",
        ],
        [
          "Google Drive",
          cloudValue(),
          () => cloudScreen(),
          "backup",
          "blue",
          "sync google",
        ],
      ],
    ],
    [
      "Help",
      [
        [
          "How it works",
          "Offline & private",
          () => helpScreen(),
          "settings",
          "blue",
          "help about version",
        ],
        [
          "Savings goal",
          state.savingsGoal?.name || "Not set",
          () => goalForm(),
          "chart",
          "teal",
          "goal",
        ],
      ],
    ],
  ];
  const emptyResult = el("p", "empty", "No matching settings.");
  emptyResult.hidden = true;
  for (const [title, items] of groups) {
    const sectionEl = section(title),
      list = el("div", "group");
    for (const [label, value, fn, g, color, extra] of items) {
      const row = settingRow(label, value, fn, g, color);
      row.dataset.search = (label + " " + extra).toLowerCase();
      list.append(row);
    }
    sectionEl.append(list);
    main.append(sectionEl);
  }
  main.append(emptyResult);
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    let count = 0;
    for (const s of main.querySelectorAll("section")) {
      let visible = 0;
      for (const r of s.querySelectorAll("[data-search]")) {
        r.hidden = !r.dataset.search.includes(q);
        if (!r.hidden) visible++;
      }
      s.hidden = !visible;
      count += visible;
    }
    emptyResult.hidden = count > 0;
  };
}
function formValues() {
  return [...$("panelBody").querySelectorAll("input,select,textarea")].map(
    (x) => [x.id, x.type === "checkbox" ? x.checked : x.value],
  );
}
function openPanel(title, draw) {
  if ($("panel").open)
    panelStack.push({
      title: $("panelTitle").textContent,
      nodes: [...$("panelBody").childNodes],
      dirty,
      snapshot: panelSnapshot,
      scroll: $("panel").scrollTop,
    });
  else panelStack = [];
  $("panelTitle").textContent = title;
  $("panelBody").replaceChildren();
  dirty = false;
  draw($("panelBody"));
  panelSnapshot = JSON.stringify(formValues());
  if (!$("panel").open) $("panel").showModal();
  $("panel").scrollTop = 0;
}
function closePanel() {
  if (
    dirty &&
    JSON.stringify(formValues()) !== panelSnapshot &&
    !confirm("Discard these unsaved changes?")
  )
    return false;
  const prior = panelStack.pop();
  if (prior) {
    $("panelTitle").textContent = prior.title;
    $("panelBody").replaceChildren(...prior.nodes);
    dirty = prior.dirty;
    panelSnapshot = prior.snapshot;
    $("panel").scrollTop = prior.scroll;
  } else {
    $("panel").close();
    dirty = false;
    scanRequest = null;
  }
  return true;
}
function finish(message) {
  $("panel").close();
  panelStack = [];
  dirty = false;
  scanRequest = null;
  render();
  if (message) toast(message);
}
$("panelBack").onclick = closePanel;
$("panel").addEventListener("cancel", (e) => {
  e.preventDefault();
  closePanel();
});
$("panelBody").addEventListener("input", () => (dirty = true));
$("panelBody").addEventListener("change", () => (dirty = true));
window.handleAppBack = () => {
  if ($("panel").open) {
    closePanel();
    return true;
  }
  if (tab !== "home") {
    navigate("home");
    return true;
  }
  return false;
};
function form(body) {
  const f = el("form"),
    error = el("p", "form-error");
  error.setAttribute("role", "alert");
  f.error = error;
  body.append(f);
  return f;
}
function field(f, label, type = "text", value = "", options) {
  const wrap = el("div", "field"),
    l = el("label", null, label),
    input = el(options ? "select" : type === "textarea" ? "textarea" : "input");
  input.id = "f-" + uid();
  l.htmlFor = input.id;
  if (options) {
    for (const [v, t] of options) {
      const o = el("option", null, t);
      o.value = v;
      input.append(o);
    }
  } else if (type !== "textarea") input.type = type;
  input.value = value ?? "";
  if (type === "number") {
    input.step = ".01";
    input.inputMode = "decimal";
  }
  input.required = true;
  wrap.append(l, input);
  f.append(wrap);
  return input;
}
function submit(f, label, fn) {
  const wrap = el("div", "fixed-save"),
    b = el("button", "primary", label);
  b.type = "submit";
  wrap.append(f.error, b);
  f.append(wrap);
  f.onsubmit = (e) => {
    e.preventDefault();
    try {
      f.error.textContent = "";
      fn();
    } catch (e) {
      f.error.textContent =
        e.message || "Check your details. Nothing was saved.";
      f.error.scrollIntoView({ block: "nearest" });
    }
  };
}
function numberAmount(input, allowZero = false) {
  const n = L.cents(Number(input.value));
  if (!input.value || !Number.isSafeInteger(n) || (!allowZero && n <= 0))
    throw Error("Enter a valid amount" + (allowZero ? "" : " above zero"));
  return n;
}
function choiceTiles(f, label, options, value, fn, cols = "") {
  const l = el("label", "caption", label),
    grid = el("div", "tile-picker " + cols);
  f.append(l, el("div", "spacer"), grid);
  const current = { value };
  const draw = () => {
    grid.replaceChildren();
    for (const [v, name, g, a] of options) {
      const b = button(
        "",
        () => {
          current.value = v;
          dirty = true;
          draw();
          if (fn) fn(v);
        },
        v === current.value ? "selected" : "",
      );
      b.setAttribute("aria-pressed", String(v === current.value));
      b.append(glyph(g || name, a), el("span", null, name));
      grid.append(b);
    }
  };
  draw();
  return current;
}
function accountPicker(f, value, allowUnassigned = false) {
  const box = el("div"),
    hidden = el("input");
  hidden.type = "hidden";
  hidden.id = "account-" + uid();
  hidden.value = value || "";
  box.append(el("label", "caption", "Paying / receiving account"), hidden);
  const grid = el("div", "tile-picker two");
  box.append(el("div", "spacer"), grid);
  f.append(box);
  function draw() {
    grid.replaceChildren();
    if (allowUnassigned)
      grid.append(
        button(
          "Unassigned",
          () => {
            hidden.value = "";
            dirty = true;
            draw();
          },
          hidden.value === "" ? "selected" : "",
        ),
      );
    for (const a of state.accounts.filter(
      (a) => !a.archived || a.id === hidden.value,
    )) {
      const b = button(
        "",
        () => {
          hidden.value = a.id;
          dirty = true;
          draw();
        },
        hidden.value === a.id ? "selected" : "",
      );
      b.setAttribute("aria-pressed", String(hidden.value === a.id));
      b.append(glyph(accountType(a), a), el("span", null, accountName(a)));
      grid.append(b);
    }
    grid.append(
      button("+ Add account", () =>
        accountForm(null, "bank", (newId) => {
          hidden.value = newId;
          dirty = true;
          draw();
        }),
      ),
    );
  }
  draw();
  return { input: hidden, box, draw };
}
function warnOutflow(id, n, date, except) {
  const a = account(id);
  if (!a || a.needsOpeningBalance) return;
  const available =
    balance(a, date) +
    (except &&
    except.accountId === id &&
    !except.refundOf &&
    L.kind(except.category, state) !== "income"
      ? L.cents(except.amount)
      : 0);
  if (
    !L.isCard(a) &&
    n > available &&
    !confirm("This entry exceeds the recorded account balance. Save anyway?")
  )
    throw Error("Entry not saved");
  if (
    L.isCard(a) &&
    -available + n > a.limit &&
    !confirm("This would exceed the recorded credit limit. Save anyway?")
  )
    throw Error("Entry not saved");
}
function quickSheet() {
  openPanel("Add an entry", (body) => {
    choiceTiles(
      body,
      "Choose what to add",
      [
        ["expense", "Expense", "spend"],
        ["income", "Income", "salary"],
        ["aside", "Investment", "chart"],
        ["transfer", "Transfer", "transfer"],
        ["leave", "Leave", "calendar"],
        ["voice", "Voice", "mic"],
      ],
      null,
      (k) => {
        if (k === "transfer") transferForm();
        else if (k === "leave") leaveForm();
        else if (k === "voice") voiceEntry(true);
        else entryForm(k);
      },
    );
  });
}
function entryForm(type = "expense", old, seed = {}) {
  if (!state) throw Error("Restore data first");
  openPanel(
    old
      ? "Edit entry"
      : type === "income"
        ? "Add income"
        : type === "aside"
          ? "Add investment"
          : "Add expense",
    (body) => {
      const f = form(body);
      if (old?.refundOf) {
        body.append(
          el("p", "warning", "Edit this refund from its original expense."),
        );
        return;
      }
      const amountWrap = el("div", "amount-wrap"),
        amount = el("input", "amount-input");
      amount.type = "number";
      amount.step = ".01";
      amount.min = ".01";
      amount.inputMode = "decimal";
      amount.placeholder = "Amount";
      amount.required = true;
      amount.id = "amount";
      amount.value = old?.amount ?? seed.amount ?? "";
      amountWrap.append(el("span", null, "₹"), amount);
      f.append(amountWrap);
      const categories = L.categoryNames(state).filter(
          (c) => L.kind(c, state) === type,
        ),
        selected = old?.category || seed.category || categories[0],
        category = choiceTiles(
          f,
          "Category",
          categories.map((c) => [c, c, c]),
          selected,
          () => updateSubcategory(),
        );
      const sub = field(
        f,
        "Subcategory",
        "text",
        old?.subcategory || seed.subcategory || "",
        [
          ["", "None"],
          ...L.categoryChildren(selected, state).map((s) => [s, s]),
        ],
      );
      sub.required = false;
      function updateSubcategory() {
        const options = L.categoryChildren(category.value, state);
        sub.parentElement.hidden = !options.length;
        const before = sub.value;
        sub.replaceChildren();
        for (const s of ["", ...options]) {
          const o = el("option", null, s || "None");
          o.value = s;
          sub.append(o);
        }
        sub.value = options.includes(before) ? before : "";
      }
      updateSubcategory();
      const date = field(f, "Date", "date", old?.date || seed.date || today());
      date.max = today();
      const payer =
        type === "expense"
          ? choiceTiles(
              f,
              "Who paid?",
              [
                ["me", "I paid", "wallet"],
                ["other", "Someone else", "people"],
              ],
              old?.paidBy || seed.paidBy || "me",
              () => syncPayer(),
              "two",
            )
          : null;
      const acct = accountPicker(
        f,
        old
          ? old.accountId
          : seed.needsAccount
            ? null
            : seed.accountId ||
              state.defaultAccount ||
              state.accounts.find((a) => !a.archived && !L.isCard(a))?.id,
        !!old && !old.accountId,
      );
      let person, repay;
      if (payer) {
        person = field(
          f,
          "Who paid?",
          "text",
          old?.person || seed.person || "",
        );
        person.maxLength = 40;
        repay = field(
          f,
          "Do you need to repay them?",
          "text",
          old?.repayNeeded ? "yes" : "no",
          [
            ["no", "No — paid for me"],
            ["yes", "Yes — I owe them"],
          ],
        );
        function update() {
          const other = payer.value === "other";
          acct.box.hidden = other;
          person.parentElement.hidden = repay.parentElement.hidden = !other;
          person.required = other;
        }
        f.syncPayer = update;
        update();
      }
      function syncPayer() {
        f.syncPayer?.();
      }
      const note = field(
        f,
        "Note (optional)",
        "text",
        old?.note || seed.note || "",
      );
      note.required = false;
      note.maxLength = 240;
      let amc, scheme, group;
      if (type === "aside") {
        amc = field(f, "AMC (optional)", "text", old?.investment?.amc || "");
        scheme = field(
          f,
          "Scheme (optional)",
          "text",
          old?.investment?.scheme || "",
        );
        group = field(
          f,
          "Investment category (optional)",
          "text",
          old?.investment?.group || "",
        );
        for (const x of [amc, scheme, group]) {
          x.required = false;
          x.maxLength = 60;
        }
      }
      if (seed.heard)
        f.prepend(
          el(
            "p",
            "warning",
            "Heard: “" + seed.heard + "”. Review every field before saving.",
          ),
        );
      submit(
        f,
        "Save " +
          (type === "income"
            ? "income"
            : type === "aside"
              ? "investment"
              : "expense"),
        () => {
          const n = numberAmount(amount),
            other = payer?.value === "other",
            a = account(acct.input.value);
          if (!L.validDate(date.value) || date.value > today())
            throw Error("Choose a date up to today");
          if (!other && !a && !(old && !old.accountId))
            throw Error("Choose an account or add one first");
          if (a && date.value < a.date)
            throw Error(
              "This date is before the account’s opening date. Correct the opening date first.",
            );
          if (other && !person.value.trim()) throw Error("Enter who paid");
          const r = {
            ...old,
            id: old?.id || uid(),
            createdAt: old?.createdAt || Date.now(),
            amount: n / 100,
            category: category.value,
            subcategory: sub.value,
            date: date.value,
            note: note.value.trim(),
            paidBy: other ? "other" : "me",
            accountId: other ? null : a?.id || null,
          };
          if (seed.paymentOrigin) {
            r.paymentDraftId = seed.paymentOrigin.id;
            if (seed.paymentOrigin.reference)
              r.paymentReference = seed.paymentOrigin.reference;
          }
          if (other) {
            r.person = person.value.trim();
            r.repayNeeded = repay.value === "yes";
          } else {
            delete r.person;
            delete r.repayNeeded;
            if (old?.repayments?.length)
              throw Error("Remove repayments before changing who paid");
          }
          if (old?.shared && L.cents(r.amount) < old.shared.amount)
            throw Error(
              "Amount cannot be below the amount owed by someone else",
            );
          if (type === "aside") {
            if ([amc, scheme, group].some((x) => x.value.trim())) {
              if ([amc, scheme, group].some((x) => !x.value.trim()))
                throw Error(
                  "Fill all three investment labels, or leave all blank",
                );
              r.investment = {
                amc: amc.value.trim(),
                scheme: scheme.value.trim(),
                group: group.value.trim(),
              };
            } else delete r.investment;
          }
          if (!other && type !== "income")
            warnOutflow(r.accountId, n, r.date, old);
          change(
            (d) =>
              (d.records = d.records.filter((x) => x.id !== r.id).concat(r)),
          );
          if (seed.paymentOrigin)
            native?.dismissPaymentDraft?.(seed.paymentOrigin.id);
          finish("Entry saved");
        },
      );
    },
  );
}
function entryDetails(r) {
  openPanel(r.refundOf ? "Refund" : "Entry details", (body) => {
    body.append(
      el("div", "detail-amount value", money(L.cents(r.amount))),
      detailsLine(
        "Category",
        r.category + (r.subcategory ? " / " + r.subcategory : ""),
      ),
      detailsLine("Date", dateLabel(r.date)),
      detailsLine("Account", accountName(account(r.accountId))),
      detailsLine("Note", r.note || "—"),
    );
    if (r.paidBy === "other") {
      body.append(
        detailsLine("Paid by", r.person),
        detailsLine("Still owed", money(L.owed(r, today()))),
      );
      if (r.repayNeeded)
        body.append(
          button("Record repayment", () => repaymentForm(r), "secondary"),
        );
      for (const p of r.repayments || [])
        body.append(
          listRow(
            "Repayment",
            dateLabel(p.date),
            money(p.amount),
            () => removeRepayment(r, p),
            "people",
          ),
        );
    }
    if (r.shared) {
      body.append(
        detailsLine(
          "Owed by " + r.shared.person,
          money(
            Math.max(
              0,
              r.shared.amount -
                (r.shared.collections || []).reduce((n, c) => n + c.amount, 0),
            ),
          ),
        ),
      );
      body.append(
        button("Record reimbursement", () => collectionForm(r), "secondary"),
      );
      for (const c of r.shared.collections)
        body.append(
          listRow(
            "Reimbursement",
            dateLabel(c.date),
            money(c.amount),
            () => removeCollection(r, c),
            "people",
          ),
        );
    }
    if (!r.refundOf) {
      body.append(
        button(
          "Edit entry",
          () => entryForm(L.kind(r.category, state), r),
          "secondary",
        ),
      );
      if (
        L.kind(r.category, state) === "expense" &&
        r.paidBy !== "other" &&
        !r.shared
      ) {
        body.append(
          button("Record refund", () => refundForm(r), "secondary"),
          button("Split categories", () => splitForm(r), "secondary"),
          button("Someone owes me part", () => sharedForm(r), "secondary"),
        );
      }
    } else
      body.append(
        button(
          "Edit refund",
          () =>
            refundForm(
              state.records.find((x) => x.id === r.refundOf),
              r,
            ),
          "secondary",
        ),
      );
    body.append(
      button(
        "Delete entry",
        () => {
          if (state.records.some((x) => x.refundOf === r.id))
            throw Error("Delete linked refunds first");
          if (
            (r.repayments || []).length ||
            (r.shared?.collections || []).length
          )
            throw Error("Remove linked repayments or reimbursements first");
          if (confirm("Delete this entry and recalculate balances?")) {
            change((d) => (d.records = d.records.filter((x) => x.id !== r.id)));
            finish("Entry deleted");
          }
        },
        "secondary danger",
      ),
    );
  });
}
function accountsScreen(type) {
  openPanel(
    type
      ? {
          bank: "Bank accounts",
          wallet: "Wallets",
          cash: "Cash",
          card: "Credit cards",
        }[type]
      : "Accounts & cards",
    (body) => {
      const rows = state.accounts.filter(
        (a) => (!type || accountType(a) === type) && !a.archived,
      );
      body.append(
        button(
          "+ Add " + (type === "card" ? "credit card" : "account"),
          () => accountForm(null, type || "bank"),
          "secondary",
        ),
        button("Transfer between accounts", () => transferForm(), "secondary"),
      );
      if (!rows.length)
        body.append(
          empty(
            "No accounts here",
            "Add your current balance once, then select this account when you spend.",
          ),
        );
      body.append(
        makeGroup(
          rows.map((a) =>
            listRow(
              accountName(a),
              a.needsOpeningBalance
                ? "Opening balance missing"
                : a.id === state.defaultAccount
                  ? "Default spending account"
                  : L.isCard(a)
                    ? "Credit card · outstanding"
                    : a.bank,
              knownBalance(a),
              () => accountDetails(a),
              accountType(a),
              a,
            ),
          ),
        ),
      );
      const archived = state.accounts.filter(
        (a) => a.archived && (!type || accountType(a) === type),
      );
      if (archived.length) {
        body.append(
          el("h3", null, "Archived accounts"),
          makeGroup(
            archived.map((a) =>
              listRow(
                accountName(a),
                "Preserved in exports",
                knownBalance(a),
                () => accountDetails(a),
                accountType(a),
                a,
              ),
            ),
          ),
        );
      }
    },
  );
}
function accountDetails(a) {
  openPanel(accountName(a), (body) => {
    body.append(
      el("div", "detail-amount value", knownBalance(a)),
      detailsLine("Type", L.isCard(a) ? "Credit card" : accountType(a)),
      detailsLine("Bank / wallet", a.bank),
      detailsLine("Opening date", dateLabel(a.date)),
      detailsLine(
        "Opening balance",
        a.needsOpeningBalance ? "Not recovered" : money(a.opening),
      ),
    );
    if (a.needsOpeningBalance)
      body.append(
        el(
          "p",
          "warning",
          "Your CSV did not contain this account’s opening balance. Set its actual current balance to correct the ledger.",
        ),
      );
    if (L.isCard(a))
      body.append(
        detailsLine("Credit limit", money(a.limit)),
        detailsLine("Last 4 digits", a.last4 || "Not set"),
        detailsLine(
          "Bill dates",
          "Statement " + a.statementDay + " · due " + a.dueDay,
        ),
        button(
          "Record card bill payment",
          () => transferForm(null, a.id),
          "primary",
        ),
      );
    body.append(
      button("View account history", () => activityScreen(a.id), "secondary"),
      button(
        "Edit account details",
        () => accountForm(a, accountType(a)),
        "secondary",
      ),
      button("Set actual current balance", () => reconcileForm(a), "secondary"),
    );
    if (!L.isCard(a) && !a.archived)
      body.append(
        button(
          a.id === state.defaultAccount
            ? "Default account ✓"
            : "Make default spending account",
          () => {
            change((d) => (d.defaultAccount = a.id));
            finish("Default account saved");
          },
          "secondary",
        ),
      );
    body.append(
      button(
        a.archived ? "Unarchive account" : "Archive account",
        () => {
          if (
            confirm(
              (a.archived ? "Unarchive" : "Archive") +
                " this account? Its history will be kept.",
            )
          ) {
            change((d) => {
              d.accounts.find((x) => x.id === a.id).archived = !a.archived;
              if (d.defaultAccount === a.id && !a.archived)
                d.defaultAccount = null;
            });
            finish("Account updated");
          }
        },
        "secondary",
      ),
    );
    if (
      !state.records.some((r) => r.accountId === a.id) &&
      !state.transfers.some((t) => [t.from, t.to].includes(a.id)) &&
      !state.records.some((r) =>
        [...(r.repayments || []), ...(r.shared?.collections || [])].some(
          (p) => p.accountId === a.id,
        ),
      ) &&
      !["adjustments", "schedules", "moneyMoves"].some((k) =>
        (state[k] || []).some((x) => x.accountId === a.id),
      )
    )
      body.append(
        button(
          "Delete unused account",
          () => {
            if (confirm("Delete this account and its opening balance?")) {
              change((d) => {
                d.accounts = d.accounts.filter((x) => x.id !== a.id);
                if (d.defaultAccount === a.id) d.defaultAccount = null;
              });
              finish("Account deleted");
            }
          },
          "secondary danger",
        ),
      );
  });
}
function accountForm(old, type = "bank", onSaved) {
  openPanel(
    old ? "Edit account" : type === "card" ? "Add credit card" : "Add account",
    (body) => {
      const f = form(body),
        types = old
          ? { value: accountType(old) }
          : choiceTiles(
              f,
              "Account type",
              [
                ["bank", "Bank", "bank"],
                ["wallet", "Wallet", "wallet"],
                ["cash", "Cash", "cash"],
                ["card", "Credit card", "card"],
              ],
              type,
              () => sync(),
            );
      const bank = field(
        f,
        "Bank",
        "text",
        old?.bank && banks[old.bank] ? old.bank : "HDFC",
        [...Object.keys(banks), "Other"].map((x) => [x, x]),
      );
      const wallet = field(
        f,
        "Wallet / payment balance",
        "text",
        old?.bank || "Google Pay",
        [...Object.keys(wallets), "Other wallet"].map((x) => [x, x]),
      );
      const name = field(f, "Account name", "text", old?.name || "");
      name.maxLength = 40;
      const opening = field(
        f,
        "Opening balance (₹)",
        "number",
        old ? (L.isCard(old) ? -old.opening : old.opening) / 100 : "",
      );
      opening.required = true;
      const date = field(
        f,
        "Opening balance date",
        "date",
        old?.date || today(),
      );
      date.max = today();
      const cardFields = el("div");
      f.append(cardFields);
      const last4 = field(
        cardFields,
        "Last four digits (optional)",
        "text",
        old?.last4 || "",
      );
      last4.required = false;
      last4.maxLength = 4;
      last4.pattern = "[0-9]{4}";
      last4.inputMode = "numeric";
      const network = field(cardFields, "Network", "text", old?.network || "", [
        ["", "Not set"],
        ["Visa", "Visa"],
        ["Mastercard", "Mastercard"],
        ["RuPay", "RuPay"],
        ["Amex", "Amex"],
      ]);
      network.required = false;
      const limit = field(
        cardFields,
        "Credit limit (₹)",
        "number",
        old?.limit ? old.limit / 100 : "",
      );
      const statement = field(
          cardFields,
          "Statement day",
          "number",
          old?.statementDay || 1,
        ),
        due = field(cardFields, "Payment due day", "number", old?.dueDay || 20);
      for (const x of [statement, due]) {
        x.min = 1;
        x.max = 31;
        x.step = 1;
      }
      const scan = button(
        "Scan card photo",
        () => {
          if (!native?.scanCard) return;
          scanRequest = {
            ticket: uid(),
            bank,
            last4,
            network,
            baseline: [bank.value, last4.value, network.value],
          };
          native.scanCard(scanRequest.ticket);
        },
        "secondary",
      );
      scan.disabled = !native?.scanCard;
      cardFields.prepend(
        scan,
        el(
          "p",
          "info-note",
          "Only bank, network and last four digits are detected. Review them before saving.",
        ),
      );
      function sync() {
        const t = types.value;
        bank.parentElement.hidden = !["bank", "card"].includes(t);
        wallet.parentElement.hidden = t !== "wallet";
        bank.required = ["bank", "card"].includes(t);
        wallet.required = t === "wallet";
        cardFields.hidden = t !== "card";
        for (const x of [limit, statement, due]) x.required = t === "card";
        opening.previousElementSibling.textContent =
          t === "card" ? "Outstanding at opening (₹)" : "Opening balance (₹)";
      }
      sync();
      if (old?.needsOpeningBalance)
        f.prepend(
          el(
            "p",
            "warning",
            "Opening balance was not recovered. If you do not know it, go back and use “Set actual current balance”.",
          ),
        );
      submit(f, "Save account", () => {
        if (!name.value.trim()) throw Error("Enter a name");
        const t = types.value;
        const a = {
          ...old,
          id: old?.id || uid(),
          name: name.value.trim(),
          bank:
            t === "cash" ? "Cash" : t === "wallet" ? wallet.value : bank.value,
          type: t === "card" ? "credit" : t,
          date: date.value,
          opening: L.cents(Number(opening.value)) * (t === "card" ? -1 : 1),
          needsOpeningBalance: false,
          balanceConfirmed: true,
        };
        if (t === "card") {
          if (Number(opening.value) < 0)
            throw Error("Enter outstanding debt as a positive amount");
          a.limit = numberAmount(limit);
          a.statementDay = Number(statement.value);
          a.dueDay = Number(due.value);
          a.last4 = last4.value;
          a.network = network.value;
        }
        if (
          !L.validDate(a.date) ||
          a.date > today() ||
          !Number.isSafeInteger(a.opening)
        )
          throw Error("Check opening balance and date");
        if (
          old &&
          (old.opening !== a.opening || old.date !== a.date) &&
          !confirm(
            "Changing the opening balance or date recalculates the account’s balance. Continue?",
          )
        )
          return;
        change((d) => {
          d.accounts = d.accounts.filter((x) => x.id !== a.id).concat(a);
          if (!d.defaultAccount && t !== "card") d.defaultAccount = a.id;
        });
        if (onSaved) {
          dirty = false;
          closePanel();
          onSaved(a.id);
          toast("Account added");
        } else finish("Account saved");
      });
    },
  );
}
window.onCardScan = (raw) => {
  try {
    const x = JSON.parse(raw),
      r = scanRequest;
    if (!r || r.ticket !== x.ticket || !r.bank.isConnected) return;
    scanRequest = null;
    if (x.error) {
      toast(x.error);
      return;
    }
    if (
      [r.bank.value, r.last4.value, r.network.value].some(
        (v, i) => v !== r.baseline[i],
      )
    ) {
      toast("Your form changed. Scan again to fill the details.");
      return;
    }
    if (banks[x.bank]) r.bank.value = x.bank;
    if (/^\d{4}$/.test(x.last4)) r.last4.value = x.last4;
    if (["Visa", "Mastercard", "RuPay", "Amex"].includes(x.network))
      r.network.value = x.network;
    dirty = true;
    toast("Review the detected details before saving");
  } catch {
    toast("Could not read scan result");
  }
};
function reconcileForm(a) {
  openPanel("Set actual balance", (body) => {
    const f = form(body);
    f.append(
      el(
        "p",
        "info-note",
        "Enter the actual " +
          (L.isCard(a) ? "outstanding debt" : "balance") +
          " shown today. This adds a balance adjustment and does not change spending or income.",
      ),
    );
    const actual = field(
      f,
      L.isCard(a) ? "Actual outstanding (₹)" : "Actual current balance (₹)",
      "number",
      a.needsOpeningBalance
        ? ""
        : (L.isCard(a) ? -balance(a) : balance(a)) / 100,
    );
    const note = field(
      f,
      "Reason",
      "text",
      a.needsOpeningBalance
        ? "Opening balance recovery"
        : "Balance reconciliation",
    );
    submit(f, "Confirm balance", () => {
      if (actual.value === "") throw Error("Enter the actual balance");
      const target = L.cents(Number(actual.value)) * (L.isCard(a) ? -1 : 1);
      if (
        !Number.isSafeInteger(target) ||
        (L.isCard(a) && Number(actual.value) < 0)
      )
        throw Error("Check the balance");
      const delta = target - balance(a);
      if (
        !confirm(
          "Set " +
            accountName(a) +
            " to " +
            money(L.isCard(a) ? -target : target) +
            " as of today?",
        )
      )
        return;
      change((d) => {
        const x = d.accounts.find((x) => x.id === a.id);
        x.needsOpeningBalance = false;
        x.balanceConfirmed = true;
        if (delta)
          (d.adjustments ??= []).push({
            id: uid(),
            accountId: a.id,
            date: today(),
            amount: delta,
            note: note.value.trim() || "Balance reconciliation",
          });
      });
      finish("Balance corrected");
    });
  });
}
function adjustmentDetails(x) {
  openPanel("Balance adjustment", (body) =>
    body.append(
      detailsLine("Amount", money(x.amount)),
      detailsLine("Account", accountName(account(x.accountId))),
      detailsLine("Date", dateLabel(x.date)),
      detailsLine("Reason", x.note),
      button(
        "Remove adjustment",
        () => {
          if (
            confirm(
              "Remove this adjustment and recalculate the account balance?",
            )
          ) {
            change(
              (d) =>
                (d.adjustments = d.adjustments.filter((a) => a.id !== x.id)),
            );
            finish("Adjustment removed");
          }
        },
        "secondary danger",
      ),
    ),
  );
}
function defaultAccountScreen() {
  openPanel("Default spending account", (body) => {
    for (const a of state.accounts.filter((a) => !a.archived && !L.isCard(a)))
      body.append(
        listRow(
          accountName(a),
          a.bank,
          a.id === state.defaultAccount ? "✓" : null,
          () => {
            change((d) => (d.defaultAccount = a.id));
            finish("Default account saved");
          },
          accountType(a),
          a,
        ),
      );
    if (!state.accounts.some((a) => !L.isCard(a) && !a.archived))
      body.append(
        empty(
          "Add an account first",
          "Bank, wallet and cash accounts can be used as the default.",
          "Add account",
          () => accountForm(),
        ),
      );
  });
}
function transferForm(old, toId) {
  openPanel(
    toId ? "Record card payment" : old ? "Edit transfer" : "Transfer money",
    (body) => {
      const f = form(body),
        options = state.accounts
          .filter(
            (a) => !a.archived || (old && [old.from, old.to].includes(a.id)),
          )
          .map((a) => [a.id, accountName(a)]);
      if (options.length < 2) {
        body.append(
          empty(
            "Two accounts are needed",
            "Add the source and destination accounts first.",
            "Add account",
            () => accountForm(),
          ),
        );
        return;
      }
      f.append(
        el(
          "p",
          "info-note",
          "A transfer or card payment moves money between accounts. It is not counted as another expense.",
        ),
      );
      const from = field(
          f,
          "From",
          "text",
          old?.from || state.defaultAccount || options[0][0],
          options,
        ),
        to = field(
          f,
          "To",
          "text",
          old?.to || toId || options.find((x) => x[0] !== from.value)?.[0],
          options,
        ),
        amount = field(
          f,
          "Amount (₹)",
          "number",
          old?.amount ? old.amount / 100 : "",
        ),
        date = field(f, "Date", "date", old?.date || today());
      date.max = today();
      submit(f, "Save transfer", () => {
        const n = numberAmount(amount);
        if (from.value === to.value) throw Error("Choose different accounts");
        if (
          date.value > today() ||
          !L.validDate(date.value) ||
          [account(from.value), account(to.value)].some(
            (a) => date.value < a.date,
          )
        )
          throw Error("Check the date and both opening dates");
        warnOutflow(from.value, n, date.value);
        change(
          (d) =>
            (d.transfers = d.transfers
              .filter((x) => x.id !== old?.id)
              .concat({
                id: old?.id || uid(),
                from: from.value,
                to: to.value,
                amount: n,
                date: date.value,
              })),
        );
        finish("Transfer saved");
      });
    },
  );
}
function transferDetails(t) {
  openPanel("Transfer details", (body) =>
    body.append(
      el("div", "detail-amount", money(t.amount)),
      detailsLine("From", accountName(account(t.from))),
      detailsLine("To", accountName(account(t.to))),
      detailsLine("Date", dateLabel(t.date)),
      button("Edit transfer", () => transferForm(t), "secondary"),
      button(
        "Delete transfer",
        () => {
          if (
            confirm(
              "Delete this transfer? Both account balances will be recalculated.",
            )
          ) {
            change(
              (d) => (d.transfers = d.transfers.filter((x) => x.id !== t.id)),
            );
            finish("Transfer deleted");
          }
        },
        "secondary danger",
      ),
    ),
  );
}
function categoriesScreen() {
  openPanel("Categories & subcategories", (body) => {
    body.append(button("+ Add category", () => categoryForm(), "secondary"));
    for (const type of ["expense", "income", "aside"]) {
      body.append(
        el(
          "h3",
          null,
          type === "aside"
            ? "Investments & savings"
            : type === "income"
              ? "Income"
              : "Spending",
        ),
      );
      body.append(
        makeGroup(
          L.categoryNames(state)
            .filter((c) => L.kind(c, state) === type)
            .map((c) =>
              listRow(
                c,
                L.categoryChildren(c, state).length + " subcategories",
                null,
                () => categoryForm(c),
                c,
              ),
            ),
        ),
      );
    }
  });
}
function categoryForm(name) {
  openPanel(name || "Add category", (body) => {
    const f = form(body),
      old = state.categoryDefinitions?.find((x) => x.name === name),
      base = L.BASE_CATEGORIES.includes(name);
    const label = field(f, "Category name", "text", name || "");
    label.maxLength = 40;
    label.disabled = !!name;
    const type = field(
      f,
      "Used for",
      "text",
      name ? L.kind(name, state) : "expense",
      [
        ["expense", "Expenses"],
        ["income", "Income"],
        ["aside", "Investments & savings"],
      ],
    );
    type.disabled = !!name;
    const sub = field(
      f,
      "Subcategories — one per line",
      "textarea",
      (old?.subcategories || []).join("\n"),
    );
    sub.required = false;
    submit(f, "Save category", () => {
      const n = label.value.trim();
      if (
        !name &&
        L.categoryNames(state).some((c) => c.toLowerCase() === n.toLowerCase())
      )
        throw Error("That category already exists");
      const children = sub.value
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        used = state.records
          .concat(state.schedules || [])
          .filter((r) => r.category === n && r.subcategory)
          .map((r) => r.subcategory);
      if (used.some((c) => !children.includes(c)))
        throw Error(
          "A used subcategory cannot be removed. Rename it in the entries first.",
        );
      change(
        (d) =>
          (d.categoryDefinitions = (d.categoryDefinitions || [])
            .filter((x) => x.name !== n)
            .concat({ name: n, kind: type.value, subcategories: children })),
      );
      finish("Category saved");
    });
    if (name && !base)
      body.append(
        button(
          "Delete unused category",
          () => {
            if (
              state.records
                .concat(state.schedules || [])
                .some((r) => r.category === name) ||
              (state.budgets || []).some((x) => x.category === name)
            )
              throw Error(
                "This category has entries or planning data. Keep it to preserve history.",
              );
            if (confirm("Delete this unused category?")) {
              change(
                (d) =>
                  (d.categoryDefinitions = d.categoryDefinitions.filter(
                    (x) => x.name !== name,
                  )),
              );
              finish("Category removed");
            }
          },
          "secondary danger",
        ),
      );
  });
}
function refundForm(original, old) {
  if (!original) throw Error("Original entry was not found");
  openPanel(old ? "Edit refund" : "Record refund", (body) => {
    const remaining =
        L.cents(original.amount) -
        state.records
          .filter((r) => r.refundOf === original.id && r.id !== old?.id)
          .reduce((n, r) => n + L.cents(r.amount), 0),
      f = form(body);
    f.append(
      el(
        "p",
        "info-note",
        "A refund reduces spending in the original category. Remaining refundable: " +
          money(remaining),
      ),
    );
    const amount = field(f, "Refund amount (₹)", "number", old?.amount || ""),
      acct = accountPicker(f, old?.accountId || original.accountId),
      date = field(f, "Refund date", "date", old?.date || today()),
      note = field(
        f,
        "Note",
        "text",
        old?.note || "Refund for " + (original.note || original.category),
      );
    date.min = original.date;
    date.max = today();
    note.required = false;
    submit(f, "Save refund", () => {
      const n = numberAmount(amount);
      if (n > remaining)
        throw Error("Refund exceeds remaining purchase amount");
      if (date.value < original.date || date.value > today())
        throw Error("Check the refund date");
      if (!acct.input.value) throw Error("Choose the receiving account");
      const r = {
        ...old,
        id: old?.id || uid(),
        amount: n / 100,
        category: original.category,
        subcategory: original.subcategory || "",
        date: date.value,
        note: note.value.trim(),
        accountId: acct.input.value,
        paidBy: "me",
        refundOf: original.id,
      };
      change(
        (d) => (d.records = d.records.filter((x) => x.id !== r.id).concat(r)),
      );
      finish("Refund saved");
    });
  });
}
function splitForm(r) {
  if (state.records.some((x) => x.refundOf === r.id))
    throw Error("Remove linked refunds before splitting");
  openPanel("Split expense", (body) => {
    const f = form(body),
      options = L.categoryNames(state)
        .filter((c) => L.kind(c, state) === "expense")
        .map((c) => [c, c]),
      first = field(f, "First category", "text", r.category, options),
      amount = field(f, "First part (₹)", "number", ""),
      second = field(f, "Remaining category", "text", "Other", options);
    f.append(
      el(
        "p",
        "info-note",
        "Total stays " +
          money(L.cents(r.amount)) +
          ". The account outflow will not change.",
      ),
    );
    submit(f, "Save split", () => {
      const n = numberAmount(amount),
        total = L.cents(r.amount);
      if (n >= total || first.value === second.value)
        throw Error("Choose different categories and a part below the total");
      const group = uid();
      change(
        (d) =>
          (d.records = d.records
            .filter((x) => x.id !== r.id)
            .concat(
              {
                ...r,
                amount: n / 100,
                category: first.value,
                subcategory: first.value === r.category ? r.subcategory : "",
                splitGroup: group,
              },
              {
                ...r,
                id: uid(),
                amount: (total - n) / 100,
                category: second.value,
                subcategory: second.value === r.category ? r.subcategory : "",
                splitGroup: group,
              },
            )),
      );
      finish("Expense split");
    });
  });
}
function repaymentForm(r) {
  openPanel("Repay " + r.person, (body) => {
    const f = form(body),
      amount = field(f, "Amount (₹)", "number", ""),
      acct = accountPicker(f, state.defaultAccount),
      date = field(f, "Date", "date", today());
    date.min = r.date;
    date.max = today();
    f.append(el("p", "info-note", "Still owed: " + money(L.owed(r))));
    submit(f, "Save repayment", () => {
      const n = numberAmount(amount);
      if (n > L.owed(r)) throw Error("Repayment exceeds amount owed");
      if (!acct.input.value || date.value < r.date || date.value > today())
        throw Error("Check account and date");
      warnOutflow(acct.input.value, n, date.value);
      change((d) =>
        (d.records.find((x) => x.id === r.id).repayments ??= []).push({
          id: uid(),
          amount: n,
          accountId: acct.input.value,
          date: date.value,
        }),
      );
      finish("Repayment saved");
    });
  });
}
function removeRepayment(r, p) {
  if (confirm("Remove this repayment and recalculate what you owe?")) {
    change((d) => {
      const x = d.records.find((x) => x.id === r.id);
      x.repayments = x.repayments.filter((a) => a.id !== p.id);
    });
    finish("Repayment removed");
  }
}
function sharedForm(r) {
  openPanel("Someone owes me part", (body) => {
    const f = form(body),
      person = field(f, "Person", "text", ""),
      amount = field(f, "Their share (₹)", "number", "");
    person.maxLength = 40;
    f.append(
      el(
        "p",
        "info-note",
        "You paid " +
          money(L.cents(r.amount)) +
          ". Their share is excluded from your personal spending and tracked separately.",
      ),
    );
    submit(f, "Save share", () => {
      const n = numberAmount(amount);
      if (n > L.cents(r.amount)) throw Error("Share exceeds the total paid");
      change(
        (d) =>
          (d.records.find((x) => x.id === r.id).shared = {
            person: person.value.trim(),
            amount: n,
            collections: [],
          }),
      );
      finish("Share saved");
    });
  });
}
function collectionForm(r) {
  openPanel("Receive reimbursement", (body) => {
    const f = form(body),
      remaining =
        r.shared.amount -
        r.shared.collections.reduce((n, x) => n + x.amount, 0),
      amount = field(f, "Amount received (₹)", "number", ""),
      acct = accountPicker(f, state.defaultAccount),
      date = field(f, "Date", "date", today());
    date.min = r.date;
    date.max = today();
    f.append(
      el(
        "p",
        "info-note",
        "Still owed by " + r.shared.person + ": " + money(remaining),
      ),
    );
    submit(f, "Save reimbursement", () => {
      const n = numberAmount(amount);
      if (n > remaining) throw Error("Amount exceeds what is owed");
      if (!acct.input.value || date.value < r.date || date.value > today())
        throw Error("Check account and date");
      change((d) =>
        d.records
          .find((x) => x.id === r.id)
          .shared.collections.push({
            id: uid(),
            amount: n,
            accountId: acct.input.value,
            date: date.value,
          }),
      );
      finish("Reimbursement saved");
    });
  });
}
function removeCollection(r, c) {
  if (confirm("Remove this reimbursement?")) {
    change((d) => {
      const x = d.records.find((x) => x.id === r.id);
      x.shared.collections = x.shared.collections.filter((a) => a.id !== c.id);
    });
    finish("Reimbursement removed");
  }
}
function leaveForm(old, start = today(), seed = {}) {
  openPanel(old ? "Edit leave" : "Add leave", (body) => {
    const f = form(body),
      from = field(f, "From", "date", old?.date || seed.date || start),
      to = field(f, "To", "date", old?.date || seed.end || start);
    if (old) to.parentElement.hidden = true;
    const days = field(f, "Leave per day", "text", old?.days || 1, [
        [1, "Full day"],
        [0.5, "Half day"],
      ]),
      include = field(f, "Include", "text", "all", [
        ["all", "All days"],
        ["weekdays", "Monday–Friday"],
      ]);
    if (old) include.parentElement.hidden = true;
    const status = field(
        f,
        "Status",
        "text",
        old?.status || (from.value > today() ? "planned" : "taken"),
        [
          ["taken", "Taken"],
          ["planned", "Planned"],
          ["cancelled", "Cancelled"],
        ],
      ),
      reason = field(f, "Reason", "text", old?.reason || "");
    reason.maxLength = 240;
    submit(f, "Save leave", () => {
      if (
        !L.validDate(from.value) ||
        !L.validDate(to.value) ||
        to.value < from.value
      )
        throw Error("Choose a valid date range");
      const span = Math.round(
        (Date.parse(to.value) - Date.parse(from.value)) / 86400000,
      );
      if (span > 365) throw Error("Use a range of at most one year");
      const dates = [];
      for (let i = 0; i <= (old ? 0 : span); i++) {
        const d = new Date(from.value + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + i);
        if (include.value === "all" || ![0, 6].includes(d.getUTCDay()))
          dates.push(d.toISOString().slice(0, 10));
      }
      if (!dates.length) throw Error("No days match this range");
      if (status.value === "taken" && dates.some((d) => d > today()))
        throw Error("Choose Planned for future leave");
      change(
        (d) =>
          (d.leaves = d.leaves
            .filter((x) => x.id !== old?.id)
            .concat(
              dates.map((date) => ({
                id: old?.id || uid(),
                date,
                days: Number(days.value),
                status: status.value,
                reason: reason.value.trim(),
              })),
            )),
      );
      finish("Leave saved");
    });
    if (old)
      body.append(
        button(
          "Delete leave",
          () => {
            if (confirm("Delete this leave record?")) {
              change(
                (d) => (d.leaves = d.leaves.filter((x) => x.id !== old.id)),
              );
              finish("Leave deleted");
            }
          },
          "secondary danger",
        ),
      );
  });
}
function budgetForm(old) {
  openPanel(old ? "Edit budget" : "Set budget", (body) => {
    const f = form(body),
      m = field(f, "Month", "month", old?.month || month),
      c = field(
        f,
        "Category",
        "text",
        old?.category || "All expenses",
        [
          "All expenses",
          ...L.categoryNames(state).filter(
            (c) => L.kind(c, state) === "expense",
          ),
        ].map((x) => [x, x]),
      ),
      amount = field(
        f,
        "Limit (₹)",
        "number",
        old?.amount ? old.amount / 100 : "",
      );
    submit(f, "Save budget", () => {
      if (
        (state.budgets || []).some(
          (b) =>
            b.id !== old?.id && b.month === m.value && b.category === c.value,
        )
      )
        throw Error("A budget already exists for this month and category");
      change(
        (d) =>
          (d.budgets = (d.budgets || [])
            .filter((x) => x.id !== old?.id)
            .concat({
              id: old?.id || uid(),
              month: m.value,
              category: c.value,
              amount: numberAmount(amount),
            })),
      );
      finish("Budget saved");
    });
    if (old)
      body.append(
        button(
          "Delete budget",
          () => {
            if (confirm("Delete this limit? Spending history will stay.")) {
              change(
                (d) => (d.budgets = d.budgets.filter((x) => x.id !== old.id)),
              );
              finish("Budget deleted");
            }
          },
          "secondary danger",
        ),
      );
  });
}
function schedulesScreen() {
  openPanel("Recurring entries", (body) => {
    body.append(
      el(
        "p",
        "info-note",
        "Scheduled entries are drafts. Confirm each payment or receipt after it happens.",
      ),
      button("+ Add recurring entry", () => scheduleForm(), "secondary"),
    );
    if (!(state.schedules || []).length)
      body.append(
        empty("No recurring entries", "Add salary, bills or a monthly SIP."),
      );
    for (const s of state.schedules || []) {
      const c = el("div", "card section");
      c.append(
        el("strong", null, s.note || s.category),
        el(
          "p",
          "caption",
          money(s.amount) +
            " · " +
            s.frequency +
            " · next " +
            dateLabel(s.date) +
            (s.paused ? " · Paused" : ""),
        ),
      );
      if (!s.paused && s.date <= today())
        c.append(
          button("Confirm paid / received", () => postSchedule(s), "primary"),
          button("Skip this date", () => postSchedule(s, true), "secondary"),
        );
      c.append(
        button("Edit schedule", () => scheduleForm(s), "secondary"),
        button(
          s.paused ? "Resume" : "Pause",
          () => {
            change(
              (d) =>
                (d.schedules.find((x) => x.id === s.id).paused = !s.paused),
            );
            finish("Schedule updated");
          },
          "secondary",
        ),
      );
      body.append(c);
    }
  });
}
function scheduleForm(old) {
  openPanel(old ? "Edit recurring entry" : "Add recurring entry", (body) => {
    const f = form(body),
      note = field(f, "Name", "text", old?.note || ""),
      category = field(
        f,
        "Category",
        "text",
        old?.category || "Salary",
        L.categoryNames(state).map((c) => [c, c]),
      ),
      amount = field(
        f,
        "Amount (₹)",
        "number",
        old?.amount ? old.amount / 100 : "",
      ),
      acct = accountPicker(f, old?.accountId || state.defaultAccount),
      date = field(f, "Next date", "date", old?.date || today()),
      frequency = field(f, "Repeat", "text", old?.frequency || "monthly", [
        ["weekly", "Weekly"],
        ["monthly", "Monthly"],
        ["yearly", "Yearly"],
      ]);
    submit(f, "Save schedule", () => {
      if (!acct.input.value) throw Error("Choose an account");
      const x = {
        ...old,
        id: old?.id || uid(),
        note: note.value.trim(),
        category: category.value,
        subcategory:
          old?.category === category.value ? old.subcategory || "" : "",
        amount: numberAmount(amount),
        accountId: acct.input.value,
        date: date.value,
        frequency: frequency.value,
        anchor:
          old?.date === date.value ? old.anchor : Number(date.value.slice(-2)),
      };
      change(
        (d) =>
          (d.schedules = (d.schedules || [])
            .filter((a) => a.id !== x.id)
            .concat(x)),
      );
      finish("Schedule saved");
    });
    if (old)
      body.append(
        button(
          "Delete schedule",
          () => {
            if (
              confirm("Delete this schedule? Previously posted entries remain.")
            ) {
              change(
                (d) =>
                  (d.schedules = d.schedules.filter((x) => x.id !== old.id)),
              );
              finish("Schedule deleted");
            }
          },
          "secondary danger",
        ),
      );
  });
}
function postSchedule(s, skip = false) {
  if (
    !confirm(
      skip
        ? "Skip this occurrence without changing any balance?"
        : "Record " + money(s.amount) + " on " + dateLabel(s.date) + "?",
    )
  )
    return;
  const token = s.id + ":" + s.date;
  if (state.records.some((r) => r.occurrence === token))
    throw Error("This occurrence is already recorded");
  if (!account(s.accountId) || account(s.accountId).archived)
    throw Error("Choose an active account in the schedule");
  if (!skip && L.kind(s.category, state) !== "income")
    warnOutflow(s.accountId, s.amount, s.date);
  change((d) => {
    if (!skip)
      d.records.push({
        id: uid(),
        amount: s.amount / 100,
        category: s.category,
        subcategory: s.subcategory || "",
        note: s.note,
        date: s.date,
        accountId: s.accountId,
        paidBy: "me",
        occurrence: token,
      });
    d.schedules.find((x) => x.id === s.id).date = L.nextOccurrence(
      s.date,
      s.frequency,
      s.anchor,
    );
  });
  finish(skip ? "Date skipped" : "Entry recorded");
}
function peopleScreen() {
  openPanel("People & settlements", (body) => {
    body.append(
      button("+ Lending / borrowing", () => moneyMoveForm(), "secondary"),
    );
    const other = state.records.filter((r) => r.paidBy === "other"),
      shared = state.records.filter((r) => r.shared);
    for (const r of other)
      body.append(
        listRow(
          "Paid by " + r.person,
          r.note || r.category,
          money(L.owed(r, today())) + " owed",
          () => entryDetails(r),
          "people",
        ),
      );
    for (const r of shared)
      body.append(
        listRow(
          r.shared.person,
          r.note || r.category,
          money(
            Math.max(
              0,
              r.shared.amount -
                r.shared.collections.reduce((n, x) => n + x.amount, 0),
            ),
          ) + " receivable",
          () => entryDetails(r),
          "people",
        ),
      );
    const names = [...new Set((state.moneyMoves || []).map((x) => x.person))];
    for (const person of names) {
      const net = (state.moneyMoves || [])
        .filter((x) => x.person === person && x.date <= today())
        .reduce(
          (n, x) =>
            n + (["lend", "repay"].includes(x.kind) ? x.amount : -x.amount),
          0,
        );
      body.append(
        listRow(
          person,
          net === 0 ? "Settled" : net > 0 ? "Owes you" : "You owe",
          money(Math.abs(net)),
          () => moneyMovesScreen(person),
          "people",
        ),
      );
    }
    if (!other.length && !shared.length && !names.length)
      body.append(
        empty(
          "Keep settlements clear",
          "Use “Someone else” when adding your expense, or record money lent and borrowed.",
        ),
      );
  });
}
function moneyMoveForm(old) {
  openPanel("Lending & borrowing", (body) => {
    const f = form(body),
      person = field(f, "Person", "text", old?.person || ""),
      kind = field(f, "Movement", "text", old?.kind || "lend", [
        ["lend", "I lent money"],
        ["borrow", "I borrowed money"],
        ["receive", "They repaid me"],
        ["repay", "I repaid borrowing"],
      ]),
      amount = field(
        f,
        "Amount (₹)",
        "number",
        old?.amount ? old.amount / 100 : "",
      ),
      acct = field(
        f,
        "Account",
        "text",
        old?.accountId || state.defaultAccount,
        state.accounts
          .filter((a) => !a.archived && !L.isCard(a))
          .map((a) => [a.id, accountName(a)]),
      ),
      date = field(f, "Date", "date", old?.date || today());
    person.maxLength = 40;
    date.max = today();
    submit(f, "Save movement", () => {
      if (!acct.value || date.value > today())
        throw Error("Check account and date");
      const n = numberAmount(amount);
      if (["lend", "repay"].includes(kind.value))
        warnOutflow(acct.value, n, date.value);
      change(
        (d) =>
          (d.moneyMoves = (d.moneyMoves || [])
            .filter((x) => x.id !== old?.id)
            .concat({
              id: old?.id || uid(),
              person: person.value.trim(),
              kind: kind.value,
              amount: n,
              accountId: acct.value,
              date: date.value,
            })),
      );
      finish("Movement saved");
    });
  });
}
function moneyMovesScreen(person) {
  openPanel(person, (body) => {
    for (const x of (state.moneyMoves || []).filter((x) => x.person === person))
      body.append(
        listRow(
          x.kind,
          dateLabel(x.date),
          money(x.amount),
          () => moneyMoveDetails(x),
          "people",
        ),
      );
  });
}
function moneyMoveDetails(x) {
  openPanel("Money movement", (body) =>
    body.append(
      detailsLine("Person", x.person),
      detailsLine("Type", x.kind),
      detailsLine("Amount", money(x.amount)),
      detailsLine("Date", dateLabel(x.date)),
      detailsLine("Account", accountName(account(x.accountId))),
      button("Edit", () => moneyMoveForm(x), "secondary"),
      button(
        "Delete movement",
        () => {
          if (confirm("Delete this movement and recalculate balances?")) {
            change(
              (d) => (d.moneyMoves = d.moneyMoves.filter((a) => a.id !== x.id)),
            );
            finish("Movement deleted");
          }
        },
        "secondary danger",
      ),
    ),
  );
}
function goalForm() {
  openPanel("Savings goal", (body) => {
    const f = form(body),
      g = state.savingsGoal,
      name = field(f, "Goal name", "text", g?.name || ""),
      target = field(
        f,
        "Target (₹)",
        "number",
        g?.target ? g.target / 100 : "",
      ),
      saved = field(
        f,
        "Saved so far (₹)",
        "number",
        g?.saved ? g.saved / 100 : 0,
      );
    name.maxLength = 60;
    f.append(
      el(
        "p",
        "info-note",
        "Manual progress only. This does not move account money.",
      ),
    );
    submit(f, "Save goal", () => {
      const value = numberAmount(saved, true);
      if (value < 0) throw Error("Saved amount cannot be negative");
      change(
        (d) =>
          (d.savingsGoal = {
            name: name.value.trim(),
            target: numberAmount(target),
            saved: value,
          }),
      );
      finish("Goal saved");
    });
    if (g)
      body.append(
        button(
          "Remove goal",
          () => {
            if (confirm("Remove this goal? Investment entries remain.")) {
              change((d) => delete d.savingsGoal);
              finish("Goal removed");
            }
          },
          "secondary danger",
        ),
      );
  });
}
function insightsScreen() {
  openPanel("Insights & reports", (body) => {
    const selectors = el("div", "two-fields"),
      from = field(selectors, "From", "date", range()[0]),
      to = field(selectors, "To", "date", range()[1]);
    body.append(selectors);
    const result = el("div"),
      shortcuts = el("div", "chips");
    for (const [label, a, b] of [
      ["This month", ...range()],
      ["All time", "1900-01-01", today()],
      [
        "Financial year",
        (Number(today().slice(5, 7)) < 4
          ? Number(today().slice(0, 4)) - 1
          : Number(today().slice(0, 4))) + "-04-01",
        today(),
      ],
    ])
      shortcuts.append(
        button(label, () => {
          from.value = a;
          to.value = b;
          draw();
        }),
      );
    body.append(shortcuts, result);
    function draw() {
      result.replaceChildren();
      if (
        from.value > to.value ||
        !L.validDate(from.value) ||
        !L.validDate(to.value)
      ) {
        result.append(el("p", "warning", "Choose a valid date range"));
        return;
      }
      const sums = L.totals(state, from.value, to.value),
        metrics = el("div", "leave-summary");
      for (const [k, label] of [
        ["income", "Income"],
        ["expense", "Spending"],
        ["aside", "Invested"],
      ]) {
        const c = el("div", "card");
        c.append(
          el("small", null, label),
          el("strong", "value", money(sums[k])),
        );
        metrics.append(c);
      }
      result.append(metrics);
      const records = state.records.filter(
        (r) =>
          r.date >= from.value &&
          r.date <= to.value &&
          L.kind(r.category, state) === "expense",
      );
      if (sums.expense > 0)
        result.append(el("div", "card")).append(donut(records));
      const map = new Map();
      for (const r of records)
        map.set(r.category, (map.get(r.category) || 0) + L.reportCents(r));
      for (const [c, v] of [...map].sort((a, b) => b[1] - a[1]))
        result.append(detailsLine(c, money(v)));
      result.append(
        el(
          "p",
          "info-note",
          "Transfers and card bill payments are excluded from spending. Refunds reduce spending on their recorded date.",
        ),
      );
    }
    from.onchange = to.onchange = draw;
    draw();
  });
}
function themeLabel() {
  return (
    {
      blue: "Light",
      teal: "Teal",
      ink: "Stone",
      tangerine: "Rose",
      amoled: "AMOLED black",
    }[document.documentElement.dataset.theme] || "Light"
  );
}
function applyTheme() {
  let theme = state?.theme;
  try {
    theme = theme || localStorage.getItem("salary-theme");
  } catch {}
  if (!["blue", "teal", "ink", "tangerine", "amoled"].includes(theme))
    theme = "blue";
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.size =
    state?.uiPreferences?.textSize || "comfortable";
  document.documentElement.dataset.accent =
    state?.uiPreferences?.amoledAccent || "silver";
  try {
    localStorage.setItem("salary-theme", theme);
    native?.setTheme?.(theme);
  } catch {}
}
function appearanceScreen() {
  openPanel("Appearance", (body) => {
    body.append(el("h3", null, "Theme"));
    for (const [key, label] of [
      ["blue", "Light"],
      ["teal", "Teal"],
      ["ink", "Stone"],
      ["tangerine", "Rose"],
      ["amoled", "AMOLED black"],
    ])
      body.append(
        settingRow(
          label,
          document.documentElement.dataset.theme === key ? "✓" : "",
          () => {
            change((d) => {
              d.theme = key;
              d.uiPreferences = { textSize: "comfortable", ...d.uiPreferences, softSilver54: true };
            });
            finish();
            appearanceScreen();
          },
          "settings",
        ),
      );
    body.append(el("h3", null, "Text size"));
    for (const [key, label] of [
      ["compact", "Compact"],
      ["comfortable", "Comfortable"],
      ["large", "Large"],
    ])
      body.append(
        settingRow(
          label,
          (state.uiPreferences?.textSize || "comfortable") === key ? "✓" : "",
          () => {
            change(
              (d) => (d.uiPreferences = { ...d.uiPreferences, textSize: key }),
            );
            finish();
            appearanceScreen();
          },
          "settings",
        ),
      );
    if (document.documentElement.dataset.theme === "amoled") {
      body.append(el("h3", null, "AMOLED accent"));
      for (const [key, label] of [
        ["mint", "Mint"],
        ["blue", "Slate Blue"],
        ["silver", "Soft Silver"],
        ["lilac", "Lilac"],
      ])
        body.append(
          settingRow(
            label,
            (state.uiPreferences?.amoledAccent || "silver") === key ? "✓" : "",
            () => {
              change(
                (d) =>
                  (d.uiPreferences = {
                    textSize: "comfortable",
                    ...d.uiPreferences,
                    amoledAccent: key,
                    softSilver54: true,
                  }),
              );
              finish();
              appearanceScreen();
            },
            "settings",
          ),
        );
    }
  });
}
function profileForm() {
  openPanel("Your profile", (body) => {
    const f = form(body),
      name = field(
        f,
        "Your name (optional)",
        "text",
        state.profile?.name || "",
      );
    name.maxLength = 40;
    name.required = false;
    submit(f, "Save profile", () => {
      change((d) => (d.profile = { ...d.profile, name: name.value.trim() }));
      finish("Profile saved");
    });
  });
}
function download(name, text, mime) {
  if (native?.exportFile) {
    native.exportFile(name, text, mime);
    return;
  }
  const a = el("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Download started. Keep the file outside the app.");
}
function exportJson() {
  if (!state) throw Error("No readable data to export");
  download(
    "Salary-backup-" + today() + ".json",
    JSON.stringify({ ...state, backupAt: new Date().toISOString() }, null, 2),
    "application/json",
  );
}
function exportCsv() {
  if (!state) throw Error("No readable data to export");
  download(
    "Salary-full-backup-" + today() + ".csv",
    IO.fullCsv(state),
    "text/csv",
  );
}
window.onExportResult = (name, success) => {
  if (!success) {
    toast("File was not saved. Please export again.");
    return;
  }
  if (
    name.startsWith("Salary-backup-") ||
    name.startsWith("Salary-full-backup-")
  )
    savePref("salary-backup-prefs", {
      ...readPref("salary-backup-prefs", {}),
      lastSaved: new Date().toISOString(),
    });
  toast("Backup saved");
  render();
};
function backupScreen() {
  openPanel("Backup & restore", (body) => {
    const prefs = readPref("salary-backup-prefs", {});
    body.append(
      banner(
        "A complete copy",
        prefs.lastSaved
          ? "Last successful export · " +
              new Date(prefs.lastSaved).toLocaleString("en-IN")
          : "No successful export recorded.",
      ),
    );
    if (state)
      body.append(
        button("Save full JSON backup", exportJson, "primary"),
        button("Save full CSV backup", exportCsv, "secondary"),
      );
    body.append(
      button("Restore JSON or full CSV", chooseImport, "secondary"),
      el(
        "p",
        "info-note",
        "Both new formats include every account, opening balance, entry, transfer, leave and planning record. Save outside this app so uninstalling cannot erase the copy.",
      ),
    );
    const copy = native?.phoneBackupStatus
      ? JSON.parse(native.phoneBackupStatus() || "{}")
      : {};
    if (copy.last) {
      body.append(
        el("h3", null, "On-phone recovery"),
        el(
          "p",
          "caption",
          "Last automatic copy · " +
            new Date(copy.last).toLocaleString("en-IN"),
        ),
        button(
          "Restore latest phone copy",
          () => previewJson(native.latestPhoneBackup(), "Automatic phone copy"),
          "secondary",
        ),
      );
    }
    body.append(
      button(
        "Recover data from before last import",
        () => {
          const raw = native?.loadRecoveryData
            ? native.loadRecoveryData()
            : localStorage.getItem("salary-before-restore");
          if (!raw) throw Error("No pre-import recovery copy is available");
          previewJson(raw, "Pre-import recovery copy");
        },
        "secondary",
      ),
    );
    body.append(
      el(
        "p",
        "info-note",
        "Automatic phone copies run weekly after saving an entry. They are removed if the app is uninstalled.",
      ),
    );
  });
}
function importExportScreen() {
  openPanel("Import / export CSV", (body) => {
    body.append(
      banner(
        "Export all, import all",
        "Full CSV exports every stored date and account — the month filter does not restrict it.",
      ),
    );
    body.append(
      button("Export complete CSV", exportCsv, "primary"),
      button("Import CSV or JSON", chooseImport, "secondary"),
      button("Full JSON backup", exportJson, "secondary"),
      el(
        "p",
        "info-note",
        "New full CSV: restores the complete ledger. Older transaction CSV: preview and map accounts first; missing balances are clearly marked. Invalid rows block import rather than disappearing.",
      ),
    );
    if (state)
      body.append(
        detailsLine("Entries", state.records.length),
        detailsLine("Transfers", state.transfers.length),
        detailsLine("Accounts", state.accounts.length),
        detailsLine("Leave records", state.leaves.length),
      );
  });
}
function chooseImport() {
  $("importFile").value = "";
  $("importFile").click();
}
$("importFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 20 * 1024 * 1024) throw Error("Choose a file under 20 MB");
    const text = await file.text();
    if (
      file.name.toLowerCase().endsWith(".json") ||
      text.trim().startsWith("{")
    )
      previewJson(text, file.name);
    else previewCsv(text, file.name);
  } catch (err) {
    openPanel("Import needs attention", (body) =>
      body.append(
        el("p", "warning", err.message || "This file could not be read"),
        button("Choose another file", chooseImport, "secondary"),
      ),
    );
  }
};
function markUnknown(d) {
  if (d.recoveryInfo?.openingBalancesUnknown)
    for (const a of d.accounts)
      if (!a.balanceConfirmed) a.needsOpeningBalance = true;
  return d;
}
function keepRecovery() {
  if (!state) return;
  const text = JSON.stringify(state);
  if (native?.saveRecoveryData) {
    if (!native.saveRecoveryData(text))
      throw Error("Could not keep a recovery copy. Export current data first.");
  } else localStorage.setItem("salary-before-restore", text);
}
function applyImport(d, replace) {
  if (
    replace &&
    !confirm(
      "Replace the current ledger with this file? A recovery copy of the current data will be kept.",
    )
  )
    return;
  keepRecovery();
  if (!save(markUnknown(d))) return;
  finish("Import complete");
}
function importSummary(body, d) {
  const sum = L.totals(d),
    n = el("div", "summary-numbers");
  for (const [label, value] of [
    [
      "Expense entries",
      d.records.filter((r) => L.kind(r.category, d) === "expense").length,
    ],
    [
      "Income entries",
      d.records.filter((r) => L.kind(r.category, d) === "income").length,
    ],
    [
      "Investment entries",
      d.records.filter((r) => L.kind(r.category, d) === "aside").length,
    ],
    ["Transfers", d.transfers.length],
  ]) {
    const c = el("div", "card");
    c.append(el("small", null, label), el("strong", null, value));
    n.append(c);
  }
  body.append(
    n,
    detailsLine("Recorded spending", money(sum.expense)),
    detailsLine("Income", money(sum.income)),
    detailsLine("Investments", money(sum.aside)),
    detailsLine("Accounts", d.accounts.length),
  );
  const group = el("div", "group");
  for (const a of d.accounts)
    group.append(
      listRow(
        accountName(a),
        a.needsOpeningBalance
          ? "Opening balance missing"
          : "Opening " + money(a.opening),
        null,
        () => {},
        accountType(a),
        a,
      ),
    );
  body.append(el("h3", null, "Accounts in this file"), group);
}
function previewJson(text, name) {
  let d;
  try {
    d = markUnknown(L.migrate(JSON.parse(text)));
  } catch (e) {
    throw Error(
      "This JSON is not a valid Money Map backup. " + (e.message || ""),
    );
  }
  openPanel("Restore preview", (body) => {
    body.append(el("p", "caption", name));
    importSummary(body, d);
    if (d.accounts.some((a) => a.needsOpeningBalance))
      body.append(
        el(
          "p",
          "warning",
          "This was reconstructed from a transaction CSV. Opening balances and other missing details still need to be set.",
        ),
      );
    body.append(
      el(
        "p",
        "info-note",
        "Restoring replaces current data. The original data is kept as a local recovery copy.",
      ),
      button("Restore this backup", () => applyImport(d, true), "primary"),
      button("Export current JSON first", exportJson, "secondary"),
    );
  });
}
function previewCsv(text, name) {
  const rows = IO.parse(text);
  if (rows[0]?.includes("Format")) {
    const result = IO.inspect(text, state || L.blank(), uid);
    openPanel("Full CSV restore preview", (body) => {
      body.append(el("p", "caption", name));
      importSummary(body, result.data);
      body.append(
        el(
          "p",
          "info-note",
          "This full CSV contains account opening balances and all stored collections. It will replace the current ledger.",
        ),
        button(
          "Restore complete CSV",
          () => applyImport(result.data, true),
          "primary",
        ),
        button("Export current JSON first", exportJson, "secondary"),
      );
    });
    return;
  }
  const h = rows[0]?.map((x) => x.trim().toLowerCase()),
    ai = h?.indexOf("account"),
    ti = h?.indexOf("type"),
    di = h?.indexOf("description"),
    to = h?.indexOf("to");
  const names = new Set();
  for (const r of rows.slice(1)) {
    if (ai >= 0 && r[ai]) names.add(r[ai]);
    if (ti >= 0 && r[ti] === "transfer") {
      const dest = to >= 0 ? r[to] : di >= 0 ? r[di] : "";
      if (dest) names.add(dest);
    }
  }
  openPanel("Map CSV accounts", (body) => {
    body.append(
      el("p", "caption", name),
      el(
        "p",
        "info-note",
        "Match exported names to an existing account, or create one with its balance marked as missing. BOB and Bank of Baroda are not merged automatically.",
      ),
    );
    const f = form(body),
      mappings = new Map();
    for (const name of names) {
      const exact = state?.accounts.find((a) => a.name === name),
        input = field(f, name, "text", exact?.id || "__new", [
          ["__new", "Create / keep “" + name + "”"],
          ...(state?.accounts || []).map((a) => [a.id, accountName(a)]),
        ]);
      mappings.set(name, input);
    }
    submit(f, "Preview every entry", () => {
      const map = {};
      for (const [name, input] of mappings)
        if (input.value !== "__new") map[name] = input.value;
      const result = IO.inspect(text, state || L.blank(), uid, map);
      openPanel("Transaction CSV preview", (preview) => {
        importSummary(preview, result.data);
        preview.append(
          detailsLine("New rows", result.added),
          detailsLine("Already present — not added twice", result.skipped),
        );
        for (const warning of result.warnings)
          preview.append(el("p", "warning", warning));
        const list = el("div", "group preview-list");
        const existing = new Set(
          [...(state?.records || []), ...(state?.transfers || [])].map(
            (x) => x.id,
          ),
        );
        for (const r of result.data.records.filter((x) => !existing.has(x.id)))
          list.append(
            listRow(
              r.note || r.category,
              dateLabel(r.date) +
                " · " +
                accountName(
                  result.data.accounts.find((a) => a.id === r.accountId),
                ),
              money(L.cents(r.amount)),
              () => {},
              r.category,
            ),
          );
        preview.append(
          el("h3", null, "New entry preview"),
          list,
          button(
            "Import " + result.added + " new rows",
            () => {
              if (!result.added) throw Error("No new rows to import");
              if (
                !confirm(
                  "Add these entries to the current ledger? Missing account balances must be corrected afterwards.",
                )
              )
                return;
              applyImport(result.data, false);
            },
            "primary",
          ),
        );
      });
    });
  });
}
function helpScreen() {
  openPanel("Help & app information", (body) => {
    body.append(el("h2", null, "Money Map 5.4"));
    for (const [title, text] of [
      [
        "Your data",
        "Data stays in the on-phone database. Keep an exported copy outside the app.",
      ],
      [
        "CSV you can restore",
        "Use Full CSV for a complete restorable export. The old CSV only had selected-period transactions and could not recover account opening balances.",
      ],
      [
        "Balances",
        "Opening balance + income − expenses − investments + incoming transfers − outgoing transfers. Refunds and repayments are included once. Credit cards show debt separately.",
      ],
      [
        "Calendar",
        "Record full-day or half-day leave, including ranges. Budgets are inside Calendar.",
      ],
      [
        "Manual investments",
        "Record contributions under Salary → Invest. Group them with AMC, scheme and investment category. No live prices.",
      ],
      [
        "Safe entry",
        "Voice and payment notifications create drafts. Review before saving.",
      ],
      ["Build", "5.4 · offline interface · no external web libraries"],
    ])
      body.append(el("h3", null, title), el("p", "info-note", text));
  });
}
function paymentConfig() {
  try {
    return native?.paymentSettings
      ? JSON.parse(native.paymentSettings())
      : { enabled: false, apps: [] };
  } catch {
    return { enabled: false, apps: [] };
  }
}
function paymentStatus() {
  return native?.configurePayments
    ? paymentConfig().enabled
      ? "On · review drafts"
      : "Off"
    : "Android only";
}
function captureScreen() {
  openPanel("Payment capture", (body) => {
    if (!native?.configurePayments) {
      body.append(
        empty(
          "Available in the Android app",
          "Manual entry and CSV import work in this preview.",
        ),
      );
      return;
    }
    const cfg = paymentConfig(),
      f = form(body);
    f.append(
      el(
        "p",
        "info-note",
        "Optional and off by default. When enabled, Android allows the app to read notifications. Money Map processes payment messages only from the apps you select, stores drafts, and does not fetch your payment history. Nothing is added to your ledger until you review and save it.",
      ),
    );
    const label = el("label", "switch-row"),
      enabled = el("input", "toggle-switch");
    enabled.type = "checkbox";
    enabled.checked = cfg.enabled;
    enabled.setAttribute("aria-label", "Capture payment notifications");
    label.append(el("span", null, "Capture payment notifications"), enabled);
    f.append(label, el("h3", null, "Selected payment apps"));
    const choices = [];
    for (const a of cfg.apps) {
      const row = el("label", "switch-row"),
        input = el("input");
      input.type = "checkbox";
      input.checked = a.enabled;
      row.append(input, el("span", null, a.name));
      f.append(row);
      choices.push([a.id, input]);
    }
    if (cfg.status) f.append(el("p", "warning", cfg.status));
    submit(f, "Save capture settings", () => {
      const apps = choices.filter(([, i]) => i.checked).map(([id]) => id);
      if (enabled.checked && !apps.length)
        throw Error("Select at least one payment app");
      native.configurePayments(enabled.checked, JSON.stringify(apps));
      finish(
        enabled.checked
          ? "Review Android notification access, then return here."
          : "Payment capture turned off",
      );
    });
    body.append(
      button("Review captured drafts", () => paymentInbox(), "secondary"),
    );
  });
}
function paymentInbox() {
  openPanel("Payment drafts", (body) => {
    let drafts = [];
    try {
      drafts = JSON.parse(native?.paymentDrafts?.() || "[]");
    } catch {}
    if (!drafts.length)
      body.append(
        empty(
          "No captured payments",
          "Notifications become drafts only after capture is enabled.",
        ),
      );
    for (const x of drafts) {
      const c = el("div", "card section");
      c.append(
        el("strong", null, x.source || "Payment"),
        el("p", "caption", x.text),
      );
      if (x.special)
        c.append(
          el(
            "p",
            "warning",
            "This looks like a " +
              x.special +
              ". Use the matching transfer or refund form to avoid double-counting.",
          ),
        );
      else
        c.append(
          button(
            "Review entry",
            () => {
              if (
                state.records.some(
                  (r) =>
                    r.paymentDraftId === x.id ||
                    (x.reference && r.paymentReference === x.reference),
                )
              ) {
                toast("This payment is already recorded");
                return;
              }
              const t = new Date(x.time),
                date =
                  t.getFullYear() +
                  "-" +
                  String(t.getMonth() + 1).padStart(2, "0") +
                  "-" +
                  String(t.getDate()).padStart(2, "0");
              entryForm(x.income ? "income" : "expense", null, {
                amount: x.amount ? x.amount / 100 : "",
                category: x.income ? "Other income" : "Other",
                date,
                note: x.source || "",
                paymentOrigin: x,
              });
            },
            "primary",
          ),
        );
      c.append(
        button(
          "Dismiss draft",
          () => {
            if (confirm("Dismiss this draft without recording it?")) {
              native.dismissPaymentDraft(x.id);
              finish("Draft dismissed");
            }
          },
          "secondary",
        ),
      );
      body.append(c);
    }
  });
}
function voiceSettings() {
  openPanel("Voice entry", (body) => {
    body.append(
      el(
        "p",
        "info-note",
        "Your phone’s speech service converts audio to text and may use the internet. Money Map does not store audio. Always review the draft before saving.",
      ),
    );
    for (const [key, label] of [
      ["en-IN", "English / Hinglish"],
      ["hi-IN", "Hindi / हिन्दी"],
    ])
      body.append(
        settingRow(
          label,
          readPref("salary-voice-language", "en-IN") === key ? "✓" : "",
          () => {
            savePref("salary-voice-language", key);
            finish("Voice language saved");
          },
          "mic",
        ),
      );
    body.append(button("Start voice entry", () => voiceEntry(true), "primary"));
  });
}
function voiceEntry(listen = false) {
  openPanel("Voice entry", (body) => {
    const f = form(body),
      text = field(f, "Speak or type a command", "textarea", "");
    text.id = "voiceText";
    text.maxLength = 500;
    text.placeholder = "Spent 250 rupees on lunch from HDFC";
    const status = el("p", "info-note");
    status.id = "voiceStatus";
    status.textContent = "Nothing is saved until you review the details.";
    f.append(status);
    const retry = button(
      "Speak / retry",
      () => {
        if (native?.startVoice) {
          retry.disabled = true;
          native.startVoice(readPref("salary-voice-language", "en-IN"));
        } else
          toast("Speech is available in the Android app. Type a command here.");
      },
      "secondary",
    );
    retry.id = "voiceRetry";
    f.append(retry);
    submit(f, "Review details", () => reviewSpeech(text.value));
    if (listen && native?.startVoice)
      setTimeout(() => {
        if (text.isConnected) {
          retry.disabled = true;
          native.startVoice(readPref("salary-voice-language", "en-IN"));
        }
      }, 50);
  });
}
window.onVoiceResult = (text, error) => {
  if (!$("voiceText")?.isConnected) return;
  $("voiceRetry").disabled = false;
  if (!text) {
    $("voiceStatus").textContent =
      error || "No speech received. Type or retry.";
    return;
  }
  $("voiceText").value = String(text).slice(0, 500);
  dirty = true;
  try {
    reviewSpeech(text);
  } catch (e) {
    $("voiceStatus").textContent = e.message;
  }
};
function reviewSpeech(text) {
  if (!text.trim()) throw Error("Speak or type a command first");
  const r = parseVoice(text);
  if (r.unsupported)
    throw Error(
      "Use the transfer, refund or repayment screen for this command",
    );
  if (r.leave) {
    leaveForm(null, today(), {
      date: r.date || today(),
      end: r.end || r.date || today(),
    });
    return;
  }
  entryForm(L.kind(r.category, state), null, {
    ...r,
    paidBy: r.person ? "other" : "me",
    heard: text,
  });
}
function lockScreen() {
  openPanel("App lock", (body) => {
    if (!native?.setAppLock) {
      body.append(
        empty("Available on Android", "Uses your phone’s screen lock."),
      );
      return;
    }
    const enabled = native.appLockEnabled();
    body.append(
      el(
        "p",
        "info-note",
        "Use your phone’s PIN, pattern or biometrics when opening the app. Set up a phone screen lock first.",
      ),
    );
    const row = el("label", "switch-row"),
      input = el("input", "toggle-switch");
    input.type = "checkbox";
    input.checked = enabled;
    input.setAttribute("aria-label", "Use app lock");
    input.onchange = () => {
      native.setAppLock(input.checked);
      finish("Confirm with your phone screen lock");
    };
    row.append(el("span", null, "Use app lock"), input);
    body.append(row);
  });
}
function cloudValue() {
  const text = native?.cloudStatus?.() || "";
  return text.startsWith("Connected:") ? "Connected" : "Setup required";
}
function cloudScreen() {
  openPanel("Google Drive", (body) => {
    const status =
        native?.cloudStatus?.() ||
        "Google Drive connection is available in the Android app.",
      connected = status.startsWith("Connected:");
    body.append(el("p", "info-note", status));
    if (!connected) {
      body.append(el("p", "info-note", "Connect your Google account to keep private app backups in Drive. Each Google account has its own ledger. Your device-only entries remain on this phone; you can import them after connecting."));
      if (native?.connectDrive) body.append(button("Connect Google account", () => {
        if (confirm("Open a separate Google profile? Your current entries stay in the device-only profile. After connecting, use Import device-only ledger to copy them.")) native.connectDrive();
      }, "primary"));
      body.append(
        button("Google setup details", googleSetupScreen, "secondary"),
        button("Save full backup", exportJson, "secondary"),
      );
      return;
    }
    body.append(
      button("Sync now", () => native.backupDrive(), "primary"),
      button("Renew Google permission", () => native.connectDrive(), "secondary"),
      button(
        "Review incoming changes",
        () => incomingSyncScreen(),
        "secondary",
      ),
      button(
        "List Drive backups",
        () => native.listDriveBackups(),
        "secondary",
      ),
      button(
        "Import device-only ledger into this profile",
        () => {
          if (confirm("Review the separate device-only ledger?"))
            native.importDeviceLedger();
        },
        "secondary",
      ),
      button(
        "Disconnect Google profile",
        () => {
          if (
            confirm(
              "Switch to the separate device-only profile? Export a backup first.",
            )
          )
            native.disconnectDrive();
        },
        "secondary",
      ),
    );
  });
}
function googleSetupScreen() {
  openPanel("Google setup details", body => {
    body.append(el("p", "info-note", "Google must recognise this signed app before it can connect. Enable Google Drive API, configure the consent screen and create an Android OAuth client using these details. Add your Google email as a test user while the project is in testing."));
    let info = {};
    try { info = JSON.parse(native?.googleSetupInfo?.() || "{}"); } catch {}
    body.append(detailsLine("Package name", info.packageName || "com.shubham.salarytracker"));
    body.append(detailsLine("Signing SHA-1", info.sha1 || "Open this screen in the Android app"));
    body.append(el("p", "info-note", "Register the certificate shown here, not a fingerprint from an older APK. Future builds need the same signing key or a new Google registration. No password or client secret is needed in the app."));
  });
}
window.onDriveBackups = (raw) => {
  try {
    const files = JSON.parse(raw);
    openPanel("Drive backups", (body) => {
      if (!files.length)
        body.append(
          empty("No Drive backups", "Save a full local backup first."),
        );
      for (const x of files)
        body.append(
          settingRow(
            x.name,
            new Date(x.createdTime).toLocaleDateString("en-IN"),
            () => {
              if (confirm("Download this backup to review before restoring?"))
                native.restoreDrive(x.id);
            },
            "backup",
          ),
        );
    });
  } catch {
    toast("Could not read Drive backups");
  }
};
window.onDriveRestore = (raw) => {
  try {
    previewJson(raw, "Google Drive backup");
  } catch (e) {
    toast(e.message);
  }
};
window.onCloudEvent = (raw) => {
  try {
    const x = JSON.parse(raw);
    if (x.type === "reload") {
      if (
        dirty &&
        !confirm(
          "Your Google profile changed. Discard the unsaved form and reload this profile?",
        )
      ) {
        toast("Profile changed. Save a copy of your input before switching.");
        return;
      }
      finish();
      load();
      applyTheme();
      render();
    } else toast(x.message || "Drive status updated");
  } catch {
    toast("Drive status updated");
  }
};
function incomingSyncScreen() {
  const raw = native?.pendingSync?.();
  if (!raw) {
    toast("No incoming changes");
    return;
  }
  try {
    const p = JSON.parse(raw),
      d = L.migrate(p.data);
    openPanel("Incoming changes", (body) => {
      importSummary(body, d);
      body.append(
        button(
          "Apply incoming ledger",
          () => {
            if (
              !confirm(
                "Replace this profile with incoming changes? A local recovery copy will be kept.",
              )
            )
              return;
            keepRecovery();
            if (!native.applyPendingSync(p.ticket, JSON.stringify(d)))
              throw Error("Local data changed. Sync again before applying.");
            state = d;
            finish("Incoming changes applied");
          },
          "primary",
        ),
        button(
          "Keep this device’s ledger",
          () => {
            if (confirm("Use this device’s complete ledger for sync?"))
              native.resolveSyncLocal();
          },
          "secondary",
        ),
      );
    });
  } catch (e) {
    toast("Incoming data needs review. " + e.message);
  }
}
window.onSharedPayment = (text) => {
  voiceEntry(false);
  $("voiceText").value = String(text).slice(0, 500);
  dirty = true;
};
window.onAppResume = () => {
  applyTheme();
};

const kind = (c) => L.kind(c, state),
  cents = L.cents,
  isCard = L.isCard,
  validDate = L.validDate,
  bankLogos = banks;
function normalVoice(s) {
  return s
    .toLowerCase()
    .replace(/[०-९]/g, (c) => String(c.charCodeAt(0) - 0x0966))
    .replace(/[’']/g, "")
    .replace(/[,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function voiceNumber(s) {
  s = normalVoice(s)
    .replace(/-/g, " ")
    .replace(/\band\b/g, " ")
    .trim();
  if (/^\d+(\.\d{1,2})?$/.test(s)) return Number(s);
  s = s.replace(/ढाई सौ|dhai sau/g, "250").replace(/डेढ़ सौ|dedh sau/g, "150");
  if (/^\d+$/.test(s)) return Number(s);
  const map = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    ek: 1,
    do: 2,
    teen: 3,
    char: 4,
    paanch: 5,
    panch: 5,
    chhe: 6,
    saat: 7,
    aath: 8,
    nau: 9,
    das: 10,
    bees: 20,
    pachas: 50,
    एक: 1,
    दो: 2,
    तीन: 3,
    चार: 4,
    पांच: 5,
    पाँच: 5,
    छह: 6,
    सात: 7,
    आठ: 8,
    नौ: 9,
    दस: 10,
    बीस: 20,
    तीस: 30,
    चालीस: 40,
    पचास: 50,
    साठ: 60,
    सत्तर: 70,
    अस्सी: 80,
    नब्बे: 90,
  };
  let total = 0,
    part = 0;
  for (const w of s.split(/\s+/)) {
    if (!w) continue;
    if (/^\d+(\.\d+)?$/.test(w)) {
      part += Number(w);
      continue;
    }
    if (w in map) {
      part += map[w];
      continue;
    }
    if (["hundred", "sau", "सौ"].includes(w)) {
      part = (part || 1) * 100;
      continue;
    }
    const scale = ["thousand", "hazar", "hazaar", "हजार", "हज़ार"].includes(w)
      ? 1000
      : ["lakh", "lakhs", "lac", "लाख"].includes(w)
        ? 100000
        : 0;
    if (scale) {
      total += (part || 1) * scale;
      part = 0;
    } else return null;
  }
  return total + part || null;
}
function voiceAmount(t) {
  // Currency-marked or expense/income-verb amounts outrank bare numbers.
  const num =
    "(?:[0-9]+(?:\\.[0-9]{1,2})?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakhs?|lac|and|ek|do|teen|char|paanch|panch|chhe|saat|aath|nau|das|bees|pachas|sau|haza?r|hazaar|dhai|dedh|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस|बीस|तीस|चालीस|पचास|साठ|सत्तर|अस्सी|नब्बे|सौ|हजार|हज़ार|लाख|ढाई|डेढ़)";
  const sequence = num + "(?:[ -]+" + num + ")*";
  let m = t.match(
    new RegExp("(?:₹|rs\\.?|rupees?)\\s*(" + sequence + ")", "i"),
  );
  if (!m)
    m = t.match(
      new RegExp(
        "(" + sequence + ")\\s*(?:rupees?|rs\\b|रुपये|रुपए|रूपये|rupaye|rupay)",
        "i",
      ),
    );
  if (!m)
    m = t.match(
      new RegExp(
        "(?:spent|paid|received|salary|bonus|खर्च|खर्चे|मिले)\\s*(" +
          sequence +
          ")",
        "i",
      ),
    );
  if (m) return voiceNumber(m[1]);
  const numbers = t.match(/\b\d+(?:\.\d{1,2})?\b/g) || [];
  return numbers.length === 1 ? Number(numbers[0]) : null;
}
function voiceDate(t, base = today()) {
  if (/\b(yesterday)\b|बीते दिन/.test(t)) {
    const d = new Date(base + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    return { date: d.toISOString().slice(0, 10), explicit: true };
  }
  if (/\b(today|aaj)\b|आज/.test(t)) return { date: base, explicit: true };
  const iso = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return { date: validDate(iso[1]) ? iso[1] : "", explicit: true };
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const hindi = [
    "जनवरी",
    "फरवरी",
    "मार्च",
    "अप्रैल",
    "मई",
    "जून",
    "जुलाई",
    "अगस्त",
    "सितंबर",
    "अक्टूबर",
    "नवंबर",
    "दिसंबर",
  ];
  const m = t.match(
    new RegExp(
      "(\\d{1,2})(?:st|nd|rd|th)?\\s+(" +
        months.join("|") +
        "|" +
        hindi.join("|") +
        ")(?:\\s+(\\d{4}))?",
    ),
  );
  if (m) {
    const n = Math.max(months.indexOf(m[2]), hindi.indexOf(m[2])) + 1,
      date =
        (m[3] || base.slice(0, 4)) +
        "-" +
        String(n).padStart(2, "0") +
        "-" +
        m[1].padStart(2, "0");
    return { date: validDate(date) ? date : "", explicit: true };
  }
  if (
    /\b(kal|tomorrow|dated|last|ago|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b|\bon\s+\d|कल|तारीख|\d{1,2}[\/.-]\d/.test(
      t,
    )
  )
    return { date: "", explicit: true };
  return { date: base, explicit: false };
}
function parseVoice(raw, accounts = state?.accounts || [], base = today()) {
  const t = normalVoice(raw),
    warnings = [],
    result = {
      amount: null,
      category: "Other",
      accountId: null,
      person: "",
      repayNeeded: false,
      note: "",
      ...voiceDate(t, base),
      warnings,
    };
  if (
    /\b(?:transfer|transferred|delete|remove|repaid|refund|refunded|borrow|borrowed|lent|lend)\b|\b(?:credit\s+)?card\s+(?:bill|payment|repayment)\b|^(?:please\s+)?repay\b/.test(
      t,
    )
  ) {
    result.unsupported = true;
    return result;
  }
  if (/\bleave\b|छुट्टी|chhutti/.test(t)) {
    result.leave = true;
    const m = t.match(
      /(?:from\s+)?(\d{1,2})\s*(?:to|से|se|-)\s*(\d{1,2})\s+([a-z]+|[\u0900-\u097f]+)(?:\s+(\d{4}))?/,
    );
    if (m) {
      result.date = voiceDate(
        m[1] + " " + m[3] + " " + (m[4] || base.slice(0, 4)),
        base,
      ).date;
      result.end = voiceDate(
        m[2] + " " + m[3] + " " + (m[4] || base.slice(0, 4)),
        base,
      ).date;
    } else {
      result.end = result.date;
      if (!result.explicit) result.date = result.end = "";
    }
    return result;
  }
  result.amount = voiceAmount(t);
  if (/(?:^|\s)-\s*\d/.test(t)) {
    result.amount = null;
    warnings.push("Negative amounts need manual review.");
  }
  if (
    /\band\s+(?:₹\s*)?(?:\d|one\b|two\b|three\b|four\b|five\b|six\b|seven\b|eight\b|nine\b|ten\b|twenty\b|thirty\b|forty\b|fifty\b)/.test(
      t,
    ) &&
    /\b(?:on|for)\b.+\band\b/.test(t)
  ) {
    result.amount = null;
    warnings.push("Use one transaction per command.");
  }
  if (/\band\s+(?:₹\s*)?\d/.test(t)) {
    result.amount = null;
    warnings.push("Use one transaction per command.");
  }
  if (!result.amount || !Number.isSafeInteger(cents(result.amount)))
    warnings.push("Enter or check the amount.");
  const income =
    /\b(received|salary|bonus|income|earned)\b|वेतन|सैलरी|बोनस|आय|मिले/.test(
      t,
    ) && !/\b(spent|spend|paid|pay|bought)\b|खर्च/.test(t);
  if (income)
    result.category = /bonus|बोनस/.test(t)
      ? "Bonus"
      : /salary|वेतन|सैलरी/.test(t)
        ? "Salary"
        : "Other income";
  else {
    const cats = [
      [
        "Food",
        /lunch|dinner|breakfast|food|restaurant|khana|खाना|खाने|लंच|डिनर|नाश्ता/,
      ],
      ["Groceries", /grocer|dmart|d mart|kirana|किराना|सब्जी|सब्ज़ी/],
      [
        "Travel",
        /travel|metro|taxi|uber|cab|petrol|diesel|मेट्रो|पेट्रोल|टैक्सी/,
      ],
      ["Shopping", /shopping|clothes|शॉपिंग|कपड़े/],
      ["Mobile recharge", /recharge|रिचार्ज/],
      ["Bills", /bills?|electricity|बिजली|बिल/],
      ["Health", /doctor|medicine|hospital|दवाई|दवा|डॉक्टर/],
      ["Rent", /rent|किराया/],
      ["Education", /school|fees|tuition|फीस/],
    ];
    result.category = cats.find(([, re]) => re.test(t))?.[0] || "Other";
    if (result.category === "Other")
      warnings.push("Choose the right category.");
  }
  const people = [
    ["Father", /\bfather\b|\bdad\b|\bpapa\b|पापा|पिताजी|पिता/],
    ["Mother", /\bmother\b|\bmom\b|\bmummy\b|मम्मी|माँ|मां/],
    ["Wife", /\bwife\b|पत्नी/],
  ];
  if (
    !income &&
    /(?:father|dad|papa|mother|mom|mummy|wife)\s+(?:has\s+)?(?:paid|ne\b)|(?:पापा|पिताजी|पिता|मम्मी|माँ|मां|पत्नी)\s+ने|paid by/.test(
      t,
    )
  )
    result.person = people.find(([, re]) => re.test(t))?.[0] || "";
  const named = t.match(/paid by ([a-z]+(?: [a-z]+)?)(?=\s+(?:for|on|₹|\d)|$)/);
  if (!income && named)
    result.person = named[1].replace(/\b\w/g, (c) => c.toUpperCase());
  result.repayNeeded =
    !!result.person &&
    /repay|owe|return|वापस|लौटा|उधार/.test(t) &&
    !/no repayment|dont(?: need to| have to)? repay|do not(?: need to| have to)? repay|not owed|gift|वापस नहीं/.test(
      t,
    );
  const hasName = (text, name) =>
    (
      " " +
      normalVoice(text).replace(/[^a-z0-9\u0900-\u097f]+/g, " ") +
      " "
    ).includes(
      " " + normalVoice(name).replace(/[^a-z0-9\u0900-\u097f]+/g, " ") + " ",
    );
  const customMatches = (state?.categoryDefinitions || []).filter(
    (c) =>
      kind(c.name) === (income ? "income" : "expense") && hasName(t, c.name),
  );
  if (customMatches.length === 1) {
    result.category = customMatches[0].name;
    const children = customMatches[0].subcategories.filter((s) =>
      hasName(t, s),
    );
    if (children.length === 1) result.subcategory = children[0];
  }
  const aliases = {
    HDFC: ["hdfc", "एचडीएफसी"],
    SBI: ["sbi", "एसबीआई"],
    "Bank of Baroda": ["bank of baroda", "bob", "बैंक ऑफ बड़ौदा"],
    "AU Small Finance Bank": ["au bank", "au small finance", "एयू बैंक"],
    ICICI: ["icici", "आईसीआईसीआई"],
    Cash: ["cash", "नकद"],
    "Google Pay": ["google pay", "gpay", "गूगल पे"],
    CRED: ["cred"],
    PhonePe: ["phonepe", "फोनपे"],
  };
  for (const bank of Object.keys(bankLogos))
    if (!aliases[bank]) aliases[bank] = [bank];
  const mentioned = Object.keys(aliases).filter((k) =>
    aliases[k].some((a) => hasName(t, a)),
  );
  const creditMention = /\bcredit\s+card\b/.test(t),
    pool = accounts.filter((a) => !a.archived && (!creditMention || isCard(a)));
  const matches = pool.filter(
    (a) =>
      (a.name && hasName(t, a.name)) ||
      mentioned.includes(a.bank) ||
      (creditMention && !mentioned.length && pool.length === 1),
  );
  if (!result.person) {
    if (matches.length === 1) result.accountId = matches[0].id;
    else if (
      matches.length > 1 ||
      mentioned.length ||
      /\b(?:from|using|via|through|card|bank|wallet)\b/.test(t)
    ) {
      result.needsAccount = true;
      warnings.push("Choose the account: its name was missing or ambiguous.");
    }
  }
  if (!result.date)
    warnings.push("Choose the date; the spoken date was unclear.");
  if (result.person)
    warnings.push("Confirm who paid and whether repayment is needed.");
  const note = raw.match(/\bnote\s*[:\-]?\s*(.+)$/i);
  if (note) result.note = note[1].slice(0, 120);
  return result;
}

load();
applyTheme();
render();
window.Salary = {
  getState: () => structuredClone(state),
  navigate,
  entryForm,
  transferForm,
  accountForm,
  backupScreen,
  previewCsv,
  previewJson,
  exportCsv,
  exportJson,
  applyImport,
  parseVoice,
};

function currencyScreen() {
  openPanel("Currency format", (body) => {
    body.append(
      el(
        "p",
        "info-note",
        "Currency stays INR (₹). Only number grouping changes.",
      ),
    );
    for (const [k, label] of [
      ["indian", "Indian · ₹1,23,456"],
      ["international", "International · ₹123,456"],
    ])
      body.append(
        settingRow(
          label,
          (state.uiPreferences?.currencyFormat || "indian") === k ? "✓" : "",
          () => {
            change(
              (d) =>
                (d.uiPreferences = {
                  textSize: "comfortable",
                  ...d.uiPreferences,
                  currencyFormat: k,
                }),
            );
            finish("Number format saved");
          },
          "cash",
        ),
      );
  });
}

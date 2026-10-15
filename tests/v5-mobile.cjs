const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("fs"),
  path = require("path");
const file = "file://" + path.resolve("app/src/main/assets/index.html");
function seed() {
  const now = new Date(),
    date =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
  return {
    version: 6,
    accounts: [
      {
        id: "h",
        name: "HDFc",
        bank: "HDFC",
        opening: 6000000,
        date: "2020-01-01",
      },
      {
        id: "au",
        name: "AU Bank",
        bank: "AU Small Finance Bank",
        opening: 2500000,
        date: "2020-01-01",
      },
      {
        id: "cash",
        name: "Cash",
        bank: "Cash",
        opening: 500000,
        date: "2020-01-01",
      },
      {
        id: "bobcard",
        type: "credit",
        name: "BOB card",
        bank: "Bank of Baroda",
        opening: -408500,
        date: "2020-01-01",
        limit: 10000000,
        statementDay: 16,
        dueDay: 5,
        last4: "0872",
        network: "RuPay",
      },
    ],
    records: [
      {
        id: "s",
        date,
        amount: 75000,
        category: "Salary",
        note: "Salary",
        accountId: "h",
      },
      {
        id: "e",
        date,
        amount: 480,
        category: "Food",
        note: "Lunch",
        accountId: "h",
      },
      {
        id: "e2",
        date,
        amount: 220,
        category: "Groceries",
        note: "Groceries",
        accountId: "h",
      },
      {
        id: "e3",
        date,
        amount: 100,
        category: "Travel",
        note: "Cab",
        accountId: "h",
      },
      {
        id: "sip",
        date,
        amount: 15000,
        category: "SIP",
        note: "Monthly SIP",
        accountId: "h",
        investment: { amc: "AMC A", scheme: "Equity fund", group: "Equity" },
      },
      {
        id: "historic",
        date: "2020-02-01",
        amount: 30,
        category: "Food",
        note: "Old expense",
        accountId: "h",
      },
    ],
    transfers: [],
    leaves: [],
    defaultAccount: "h",
    theme: "blue",
  };
}
(async () => {
  fs.mkdirSync("previews", { recursive: true });
  const b = await chromium.launch(),
    p = await b.newPage({
      viewport: { width: 390, height: 844 },
      timezoneId: "Asia/Kolkata",
    }),
    errors = [];
  let accept = true;
  p.on(
    "pageerror",
    (e) => (errors.push(e.stack), console.error("BROWSER_ERROR", e.stack)),
  );
  p.on("dialog", async (d) => (accept ? d.accept() : d.dismiss()));
  await p.addInitScript((data) => {
    if (!localStorage.getItem("v5-seeded")) {
      localStorage.setItem("salary-v3", JSON.stringify(data));
      localStorage.setItem("v5-seeded", "yes");
    }
    window.Android = {
      startVoice: (lang) => {
        window.voiceCalls = (window.voiceCalls || 0) + 1;
        window.voiceLang = lang;
      },
    };
  }, seed());
  await p.goto(file);
  assert.equal((await p.evaluate(() => Salary.getState())).records.length, 6);
  assert.equal(await p.locator("nav button").count(), 5);
  for (const key of ["salary", "spend", "home", "calendar", "settings"]) {
    await p.evaluate((k) => Salary.navigate(k), key);
    assert.equal(await p.locator("nav button[aria-current=page]").count(), 1);
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.screenshot({ path: "previews/v5-" + key + ".png", fullPage: true });
  }
  await p.evaluate(() => Salary.navigate("home"));
  const dock = await p.locator("#homeActions").boundingBox(),
    nav = await p.locator("nav").boundingBox();
  assert(dock.y + dock.height <= nav.y);
  const recent = await p
    .getByRole("heading", { name: "Recent entries", exact: true })
    .boundingBox();
  assert(
    recent.y + recent.height <= dock.y,
    "Home actions overlap Recent entries heading",
  );
  await p.locator("#homeActions .add").click();
  assert.equal(await p.locator("#amount").inputValue(), "");
  assert.equal(
    await p.getByLabel("Date", { exact: true }).inputValue(),
    await p.evaluate(() => today()),
  );
  await p.locator("#amount").fill("25");
  await p.getByLabel("Note (optional)", { exact: true }).fill("Fresh expense");
  accept = false;
  await p.locator("#panelBack").click();
  assert.equal(await p.locator("#amount").inputValue(), "25");
  assert.equal(await p.locator("#panel").evaluate((x) => x.open), true);
  accept = true;
  await p.getByRole("button", { name: "Save expense", exact: true }).click();
  assert.equal((await p.evaluate(() => Salary.getState())).records.length, 7);
  await p.locator("#homeActions .add").click();
  assert.equal(
    await p.getByLabel("Note (optional)", { exact: true }).inputValue(),
    "",
  );
  assert.equal(await p.locator("#amount").inputValue(), "");
  await p.locator("#panelBack").click();
  await p.locator("#homeActions .mic").click();
  await p.waitForFunction(() => window.voiceCalls === 1);
  await p.evaluate(() =>
    onVoiceResult("Spent 250 rupees on lunch from HDFC", ""),
  );
  assert.equal(await p.locator("#amount").inputValue(), "250");
  assert.equal((await p.evaluate(() => Salary.getState())).records.length, 7);
  await p.getByRole("button", { name: "Save expense", exact: true }).click();
  assert.equal((await p.evaluate(() => Salary.getState())).records.length, 8);
  await p.evaluate(() => Salary.navigate("settings"));
  await p.getByRole("textbox", { name: "Search settings" }).fill("csv");
  assert(
    await p.getByRole("button", { name: /Import \/ export CSV/ }).isVisible(),
  );
  assert.equal(await p.getByRole("button", { name: /Voice entry/ }).count(), 0);
  await p.getByRole("textbox", { name: "Search settings" }).fill("");
  await p.getByRole("button", { name: /Categories & subcategories/ }).click();
  await p.getByRole("button", { name: "+ Add category", exact: true }).click();
  await p.getByLabel("Category name", { exact: true }).fill("Pets");
  await p.getByLabel("Subcategories — one per line").fill("Food\nDoctor");
  await p.getByRole("button", { name: "Save category", exact: true }).click();
  assert.equal(
    (await p.evaluate(() => Salary.getState())).categoryDefinitions[0].name,
    "Pets",
  );
  await p.evaluate(() => Salary.accountForm(null, "card"));
  assert(await p.getByRole("button", { name: "Scan card photo" }).isVisible());
  await p.getByLabel("Account name", { exact: true }).fill("New card");
  await p.getByLabel("Outstanding at opening (₹)", { exact: true }).fill("100");
  await p.getByLabel("Credit limit (₹)", { exact: true }).fill("50000");
  await p.getByRole("button", { name: "Save account", exact: true }).click();
  assert.equal(
    (await p.evaluate(() => Salary.getState())).accounts.filter(
      (a) => a.type === "credit",
    ).length,
    2,
  );
  await p.evaluate(() => Salary.navigate("calendar"));
  await p
    .getByRole("button", { name: "+ Add leave or date range", exact: true })
    .click();
  await p.getByLabel("From", { exact: true }).fill("2026-01-01");
  await p.getByLabel("To", { exact: true }).fill("2026-01-03");
  await p.getByLabel("Reason", { exact: true }).fill("Leave range");
  await p.getByRole("button", { name: "Save leave", exact: true }).click();
  assert.equal((await p.evaluate(() => Salary.getState())).leaves.length, 3);
  const csv = await p.evaluate(() => LedgerIO.fullCsv(Salary.getState())),
    before = await p.evaluate(() => Salary.getState());
  await p.evaluate((text) => Salary.previewCsv(text, "Full.csv"), csv);
  assert(
    await p.getByRole("button", { name: "Restore complete CSV" }).isVisible(),
  );
  await p
    .getByRole("button", { name: "Restore complete CSV", exact: true })
    .click();
  assert.deepEqual(await p.evaluate(() => Salary.getState()), before);
  await p.reload();
  assert.deepEqual(await p.evaluate(() => Salary.getState()), before);
  const legacy =
    "Date,Type,Category,Amount,Account,Description,ID,Linked entry,Subcategory\n2026-01-01,expense,Food,15,HDFc,Legacy lunch,legacy1,,\n2026-01-02,transfer,,20,AU Bank,Cash,legacyT,,\n";
  await p.evaluate((text) => Salary.previewCsv(text, "Old.csv"), legacy);
  await p
    .getByRole("button", { name: "Preview every entry", exact: true })
    .click();
  assert(
    await p
      .getByRole("button", { name: "Import 2 new rows", exact: true })
      .isVisible(),
  );
  await p
    .getByRole("button", { name: "Import 2 new rows", exact: true })
    .click();
  assert.equal(
    (await p.evaluate(() => Salary.getState())).records.length,
    before.records.length + 1,
  );
  assert.equal((await p.evaluate(() => Salary.getState())).transfers.length, 1);
  for (const theme of ["blue", "teal", "ink", "tangerine", "amoled"]) {
    await p.evaluate((theme) => {
      change((d) => {
        d.theme = theme;
        d.uiPreferences = { textSize: "comfortable" };
      });
      Salary.navigate("home");
    }, theme);
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    if (theme === "amoled")
      assert.equal(
        await p
          .locator(".hero")
          .evaluate((x) => getComputedStyle(x).backgroundColor),
        "rgb(0, 0, 0)",
      );
    await p.screenshot({ path: "previews/v5-theme-" + theme + ".png" });
    await p.evaluate(() => Salary.navigate("salary"));
    await p.getByRole("button", { name: "Cards", exact: true }).click();
    await p.screenshot({ path: "previews/v5-cards-" + theme + ".png" });
    assert(await p.locator(".credit-card").first().isVisible());
    await p.getByRole("button", { name: "Invest", exact: true }).click();
    await p.screenshot({ path: "previews/v5-invest-" + theme + ".png" });
    await p.evaluate(() => Salary.navigate("settings"));
    await p.screenshot({
      path: "previews/v5-settings-" + theme + ".png",
      fullPage: true,
    });
  }
  for (const width of [320, 390, 430]) {
    await p.setViewportSize({ width, height: 844 });
    await p.evaluate(() => Salary.navigate("calendar"));
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert(
      (
        await p.locator(".calendar-grid button").evaluateAll((xs) =>
          xs.map((x) => ({
            w: x.getBoundingClientRect().width,
            h: x.getBoundingClientRect().height,
          })),
        )
      ).every((x) => x.w >= 43.9 && x.h >= 44),
    );
    await p.evaluate(() => Salary.entryForm("expense"));
    await p.setViewportSize({ width, height: 460 });
    await p.locator("#amount").fill("123");
    await p
      .getByLabel("Note (optional)", { exact: true })
      .fill("Keyboard draft");
    await p
      .getByRole("button", { name: "Save expense", exact: true })
      .scrollIntoViewIfNeeded();
    assert.equal(
      await p.locator("#panel").evaluate((x) => x.scrollWidth > x.clientWidth),
      false,
    );
    await p.screenshot({ path: "previews/v5-keyboard-" + width + ".png" });
    await p.locator("#panelBack").click();
    await p.setViewportSize({ width, height: 844 });
  }
  const result = await p.evaluate(() => {
    const rows = [
      ...document.querySelectorAll(
        "button,input,select,textarea,p,small,label",
      ),
    ].filter(
      (x) =>
        x.getClientRects().length &&
        getComputedStyle(x).visibility !== "hidden",
    );
    return rows
      .filter((x) => parseFloat(getComputedStyle(x).fontSize) < 12)
      .map((x) => x.textContent);
  });
  assert.deepEqual(result, []);
  // Exercise both approved palettes through the real Appearance controls.
  for (const [accent, label] of [["blue", "Slate Blue"], ["silver", "Soft Silver"]]) {
    await p.evaluate(() => { change(d => d.theme = "amoled"); appearanceScreen(); });
    await p.getByRole("button", {name: new RegExp(label)}).click();
    assert.equal(await p.evaluate(() => Salary.getState().uiPreferences.amoledAccent), accent);
    await p.locator("#panelBack").click();
    await p.reload();
    assert.equal(await p.evaluate(() => document.documentElement.dataset.accent), accent);
    for (const tab of ["salary","spend","home","calendar","settings"]) {
      await p.evaluate(k => Salary.navigate(k), tab);
      await p.screenshot({path:`previews/v51-${accent}-${tab}.png`, fullPage:true});
    }
    for (const screen of ["categoriesScreen","categoryForm","accountsScreen","transferForm","budgetForm","schedulesScreen","peopleScreen","backupScreen","importExportScreen","captureScreen","voiceSettings","lockScreen","cloudScreen"]) {
      await p.evaluate(n => window[n](), screen);
      assert.equal(await p.locator("#panel").evaluate(x=>getComputedStyle(x).backgroundColor), "rgb(0, 0, 0)");
      assert.equal(await p.locator("#panel").evaluate(x=>x.scrollWidth>x.clientWidth),false, screen);
      await p.screenshot({path:`previews/v51-${accent}-${screen}.png`,fullPage:true});
      await p.locator("#panelBack").click();
    }
  }
  // Custom categories are usable, not merely visible in Settings.
  await p.evaluate(() => Salary.entryForm("expense"));
  await p.getByRole("button", {name:"Pets",exact:true}).click();
  await p.getByLabel("Subcategory", {exact:true}).selectOption("Doctor");
  await p.locator("#amount").fill("75.25");
  await p.getByRole("button", {name:"Save expense",exact:true}).click();
  assert((await p.evaluate(()=>Salary.getState())).records.some(r=>r.category==="Pets"&&r.subcategory==="Doctor"&&r.amount===75.25));
  await p.evaluate(()=>categoryForm("Pets"));
  await p.getByLabel("Subcategories — one per line").fill("Food");
  await p.getByRole("button",{name:"Save category",exact:true}).click();
  assert.match(await p.locator(".form-error").innerText(), /used subcategory cannot be removed/);
  await p.locator("#panelBack").click();
  // Same-account transfer is rejected without modifying state.
  const transferBefore=await p.evaluate(()=>Salary.getState());
  await p.evaluate(()=>Salary.transferForm());
  await p.getByLabel("From",{exact:true}).selectOption("h");
  await p.getByLabel("To",{exact:true}).selectOption("h");
  await p.getByLabel("Amount (₹)",{exact:true}).fill("100");
  await p.getByRole("button",{name:"Save transfer",exact:true}).click();
  assert.match(await p.locator(".form-error").innerText(),/different accounts/);
  assert.deepEqual(await p.evaluate(()=>Salary.getState()),transferBefore);
  await p.getByLabel("To",{exact:true}).selectOption("cash");
  await p.getByRole("button",{name:"Save transfer",exact:true}).click();
  assert.equal((await p.evaluate(()=>Salary.getState())).transfers.length,transferBefore.transfers.length+1);
  await p.evaluate(()=>budgetForm());
  await p.getByLabel("Limit (₹)",{exact:true}).fill("5000");
  await p.getByRole("button",{name:"Save budget",exact:true}).click();
  assert.equal((await p.evaluate(()=>Salary.getState())).budgets.at(-1).amount,500000);
  // Actual browser downloads and JSON restore, with every collection preserved.
  let exported=await p.evaluate(()=>Salary.getState());
  for(const kind of ["Csv","Json"]){
    const [dl]=await Promise.all([p.waitForEvent("download"),p.evaluate(k=>Salary["export"+k](),kind)]);
    const content=fs.readFileSync(await dl.path(),"utf8");
    assert(content.length>100);
    if(kind==="Csv") assert(content.includes("Pets"));
    else {
      const restored=JSON.parse(content);delete restored.backupAt;assert.deepEqual(restored,exported);
      await p.evaluate(text=>Salary.previewJson(text,"test-backup.json"),content);
      await p.getByRole("button",{name:"Restore this backup",exact:true}).click();
      exported.backupAt = JSON.parse(content).backupAt;
      assert.deepEqual(await p.evaluate(()=>Salary.getState()),exported);
    }
  }
  // Malformed import never changes the live ledger.
  const invalid=await p.evaluate(()=>{try{Salary.previewJson('{broken','bad.json');return false;}catch(e){return true;}});
  assert(invalid);
  assert.deepEqual(await p.evaluate(()=>Salary.getState()),exported);

  assert.deepEqual(errors, []);
  await b.close();
  console.log(
    "PASS five tabs, draft retention, current-date and note reset, one-tap voice, cards, categories, leave ranges, full/legacy CSV restore, persistence, themes, 320/390/430 widths and keyboard layout",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

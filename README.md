# Money Map 5.3

A rebuilt offline personal-finance app with five main tabs: Salary, Spend, Home, Calendar and Settings. Credit cards and manual investments are sections inside Salary. Calendar includes leave ranges and budgets. Home has account-type summaries, spending breakdown, recent entries and expense/voice actions.

## Source structure

- `app/src/main/assets/index.html`: app shell.
- `app/src/main/assets/app.css`: all visual styles and five themes.
- `app/src/main/assets/app.js`: screens, forms, navigation and native bridge.
- `app/src/main/assets/ledger.js`: pure validation and money calculations.
- `app/src/main/assets/io.js`: CSV parsing, export, legacy import and full restore.
- `app/src/main/java/...`: existing native SQLite storage, export/file picker, card scanner, voice, app lock, optional payment drafts, weekly phone copies and legacy Drive connection.

The data schema remains version 6. Android keeps using the existing `salary-ledger.db` and profile databases; browser preview keeps using `salary-v3` and migrates old versions. No existing transactions or accounts are replaced on launch.

## CSV and JSON

Settings → Import / export CSV exports **all stored dates**, including archived accounts and all collections, regardless of the currently selected month. Full CSV uses the `SalaryTracker/2` format. It has readable columns and a `Data` JSON column that preserves original account identifiers, opening balances, payer details, investment labels, nested repayments, and settings. Repayments and reimbursements also have readable rows. Leave, budget, schedule, adjustment and money-movement rows are included. Keep the `Data` column unchanged; edit transactions in the app.

Settings → Backup & restore supports full JSON and full CSV restore, validates the complete file, previews its contents, asks before replacement, and keeps a pre-import recovery copy. A full CSV restores data exactly; it is not a filtered financial report.

Older ledger CSVs can be imported with account mapping and ID duplicate checks. Invalid rows block the entire import; no rows are silently dropped. Opening balances unavailable in an old export are labelled **Set balance**, not treated as verified zero. Old repayment/reimbursement rows are refused when required original details cannot be reconstructed safely. Transaction-only exports cannot recover unexported dates, original payer/share details, opening balances or planning data.

## Android build and tests

Use Java 17, Gradle 8.9 and Android SDK 35:

```
node tests/v5-ledger.cjs
npm install --no-save playwright
npx playwright install --with-deps chromium
node tests/v5-mobile.cjs
gradle testDebugUnitTest assembleDebug bundleDebug lintDebug --no-daemon
```

CI runs the new ledger/import/export and mobile tests, existing native unit tests and Android 16 system-inset smoke test. APKs are split by ABI; arm64 is suitable for recent Android phones. The generated APK is a **debug preview**, not a signed production release. A release requires the private environment variables declared in `app/build.gradle`. Never publish signing credentials in this repository.

Preview this project by opening `app/src/main/assets/index.html` in a browser. No network calls or external web libraries are used by the interface. Voice/photo scanning and phone lock require the Android wrapper. Google Drive now exposes Connect Google account and Renew Google permission. Connection still requires Google Cloud registration of the installed package and certificate; setup details are available in the app. Live Google consent and cross-device backups have not been tested with a configured account. Notification capture is opt-in and creates reviewable drafts only.

Weekly phone-only copies are erased on uninstall. Export a full CSV or JSON outside the app before uninstalling or clearing app data. A differently signed APK cannot update an existing installation.

## 5.1 appearance and verification

Keeps Salary / Spend / Home / Calendar / Settings. Adds Slate Blue and Soft Silver AMOLED palettes, shared across forms and detail screens. Home has no Spent/Saved summary tiles; the spending breakdown remains. Financial year is expandable; leave counts are compact. Existing themes and version-6 data remain compatible.

Mobile checks now cover both approved accents through actual settings, category use and used-subcategory protection, invalid/valid transfers, budget creation, real CSV/JSON downloads and JSON restore. Native device integrations still require on-device validation; no new Google sign-in setup is bundled.

## 5.2 Money Map cleanup

Renames the launcher, app help and Android exit prompt to Money Map. Pocket Map is a native vector adaptive wallet icon with a matching Android themed-icon layer. The package ID, database names, localStorage keys, CSV format marker and existing backup filename prefixes intentionally remain compatible with earlier versions.

Removes obsolete v2–v4 DOM tests, duplicate README and superseded design notes; consolidates repeated styles and removes unused state. Current ledger/mobile/native tests remain the verification gates. All three runtime dependencies have active consumers (OCR, scheduled backups, existing Drive profiles), so none were removed.

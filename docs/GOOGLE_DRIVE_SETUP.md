# Activate Google Drive for Salary 3.5

The APK implements Google account authorization through Google Play services AuthorizationClient. No client secret belongs in the APK. Before connection can work, the app owner must register this signed Android app in their own Google Cloud project.

1. Create/select a Google Cloud project and enable Google Drive API.
2. Configure Google Auth Platform consent (app name, support email, audience and requested scopes). For a testing project, add each tester's Google email.
3. Create an Android OAuth client with package `com.shubham.salarytracker` and signing SHA-1 `88:74:9F:B4:EE:77:22:56:B9:9E:60:D9:FB:BF:C7:25:0D:51:23:95` (signing key created on 21 Oct 2026; the earlier `DE:41:…` key expired with its build cache). Always confirm the SHA-1 in the latest CI "Signing certificate for Google registration" step; the "Keep signing key" workflow keeps the key cache from expiring. Obtain SHA-1 from the CI signing-certificate output or `keytool -list -v -keystore .signing/salary.keystore -alias androiddebugkey` on the signing machine.
4. Scopes: `https://www.googleapis.com/auth/drive.appdata`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`.
5. Install the signed APK on a phone with Google Play services. Open Settings → Google Drive → Connect Google account. Verify the returned email before importing device-only records.
6. Test: create a small entry, Back up now, then list backups. On another phone, connect the same account and explicitly restore that backup. Try a different Google account and verify it starts with separate empty records.

## Sync and backup behavior

- Each Google email uses its own SQLite ledger and recovery file. New profiles start empty. Importing device-only data remains explicit.
- Drive snapshots are immutable, with ancestry links. Existing versions are not overwritten or automatically deleted. The newest 100 are listed for manual restore; synchronization reads all version metadata with pagination.
- WorkManager schedules network-constrained sync approximately every 30 minutes and after changes. Android battery/network restrictions can delay it. Opening the app also requests sync. This is not instant delivery.
- Incoming data is downloaded in the background. When the app is open and no form/dialog is being edited, the ledger is validated before replacing the local database. A recovery copy is kept first.
- Independent edits to different records merge using the last synchronized version, including deletions. Changes to the same record, concurrent branches, or invalid merged financial relationships require review. No last-write-wins overwrite is used.
- In Settings → Google Drive, review backup versions or explicitly choose **Resolve conflict: keep this device**. This creates a new version; other copies remain in backups. To keep a remote version, restore it and then explicitly resolve using this device.
- Work stops when disconnected. Tokens stay in memory and are reacquired through Play services. No token, payment text, or ledger is logged.
- Live Google consent, Drive authorization and cross-device integration still require the app owner's Google Cloud configuration and real-account testing. CI exercises merge rules, branch detection, profile isolation, validation and Android compilation.

## Payment receipts

Automatic reading of payment notifications was removed in Money Map 5.9: Android blocks installs of apps from outside the Play Store that ask for notification access. You can still paste or share a receipt text to Money Map (Settings → Voice & receipts) and review the draft before saving.

## Backups

Schema 6 adds shared-expense reimbursement allocations and collections. Schemas 1–5 migrate forward. Older app versions reject schema 6 instead of misreading the financial data. Install updates over the existing app using its unchanged signing certificate; do not uninstall to update.

Google documentation: https://developer.android.com/identity/authorization and https://developers.google.com/workspace/drive/api/guides/appdata

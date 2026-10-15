# Activate Google Drive for Money Map 5.3

The APK implements Google account authorization through Google Play services AuthorizationClient. No client secret belongs in the APK. Before connection can work, the app owner must register this signed Android app in their own Google Cloud project.

1. Create/select a Google Cloud project and enable Google Drive API.
2. Configure Google Auth Platform consent (app name, support email, audience and requested scopes). For a testing project, add each tester's Google email.
3. Open Money Map → Settings → Google Drive → Google setup details. Create an Android OAuth client using package `com.shubham.salarytracker` and the **Signing SHA-1 shown by the installed APK**. Do not use a fingerprint from an older build. A stable private release keystore is required before registering a lasting production client; CI debug builds may use a different certificate each run. Never commit a private keystore or its password to source control.
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

## Notification drafts

Settings → Payment inbox → Notification settings. Select Google Pay, PhonePe, CRED and/or Paytm, then grant Money Map notification access in Android. Capture is opt-in per profile and is reset when connecting a Google profile. Turn it off from the same screen or revoke Android notification access.

Only new readable payment notifications from selected supported packages are considered. OTP/password messages, failed/pending/request notifications and notification group summaries are ignored. Hindi-only notifications, unavailable notifications and formats the parser cannot recognize may be missed. No past payment history is accessed. Reference matches suppress duplicate drafts; uncertain amount/time matches are flagged for manual review. An inbox holds up to 500 drafts, which remain on the device until a reviewed transaction is saved.

You can also share **text** receipts to Money Map. Image/PDF OCR is not implemented. Credit-card bill, transfer and refund notifications route to the matching workflow rather than being silently recorded as expenses.

## Backups

Schema 6 adds shared-expense reimbursement allocations and collections. Schemas 1–5 migrate forward. Older app versions reject schema 6 instead of misreading the financial data. Install updates over the existing app using its unchanged signing certificate; do not uninstall to update.

Google documentation: https://developer.android.com/identity/authorization and https://developers.google.com/workspace/drive/api/guides/appdata

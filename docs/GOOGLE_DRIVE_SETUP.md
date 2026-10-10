# Activate Google Drive for Salary 3.4

The APK implements Google account authorization through Google Play services AuthorizationClient. No client secret belongs in the APK. Before connection can work, the app owner must register this signed Android app in their own Google Cloud project.

1. Create/select a Google Cloud project and enable Google Drive API.
2. Configure Google Auth Platform consent (app name, support email, audience and requested scopes). For a testing project, add each tester's Google email.
3. Create an Android OAuth client with package `com.shubham.salarytracker` and signing SHA-1 `DE:41:F5:E7:54:0C:88:FF:6D:95:13:99:08:3F:E4:44:0D:42:3C:D0` (verified from the existing signed APK; keep this certificate for updates). Obtain SHA-1 from the CI signing-certificate output or `keytool -list -v -keystore .signing/salary.keystore -alias androiddebugkey` on the signing machine.
4. Scopes: `https://www.googleapis.com/auth/drive.appdata`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile`.
5. Install the signed APK on a phone with Google Play services. Open Settings → Google Drive → Connect Google account. Verify the returned email before importing device-only records.
6. Test: create a small entry, Back up now, then list backups. On another phone, connect the same account and explicitly restore that backup. Try a different Google account and verify it starts with separate empty records.

## Behavior and limits

- New Google profiles start empty. Device-only records are never uploaded to a new account unless the user explicitly imports them.
- Separate SQLite databases and recovery files are used per Google email. Disconnect returns to the original device-only database.
- Immutable JSON snapshots are stored in the app's hidden appDataFolder in the user's own Drive. Prior versions are not overwritten or automatically deleted. Versions consume Drive storage; the most recent 100 are listed.
- Automatic backups run after changes while the app remains open, normally after 10 seconds, no more often than once every five minutes. Manual backup bypasses that delay. Background scheduling and automatic multi-device merging are NOT implemented.
- Restoring is explicit and validates the ledger in JavaScript before committing; the current ledger is kept as a local recovery copy first.
- OAuth access tokens stay in memory and are reacquired through Play services. No token, payment data, or backup is logged.
- Live Google authorization requires the owner's project setup and device testing; CI cannot validate consent or user Drive access.

Google documentation: https://developer.android.com/identity/authorization and https://developers.google.com/workspace/drive/api/guides/appdata

The updated ledger uses backup schema 5. Old schemas 1–4 migrate forward; older app versions reject schema 5 instead of silently treating card debt and refunds as ordinary accounts/expenses.

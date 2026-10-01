SALARY — first version for Shubham

TRY IT NOW
Open app/src/main/assets/index.html in a desktop browser. No account or internet required. Enter salary through Settings > Add income. Enter each expense using amount, category, Save. Date defaults to today. Use Home's month selector for previous months; Insights shows spending categories or a six-month trend.

ANDROID INSTALLATION
This package contains the Android source project, NOT an APK. The native Android wrapper has not been compiled or tested on a phone in this environment.
1. On a computer with Android Studio, extract this folder.
2. Open the SalaryTracker folder as a project. Let Android Studio download SDK 35 and sync Gradle (internet required). Use Java 17 and Gradle 8.9 when prompted; no Gradle wrapper is included.
3. Use Build > Build App Bundle(s) / APK(s) > Build APK(s), or the equivalent APK build action in your Android Studio version.
4. Copy app/build/outputs/apk/debug/app-debug.apk to your phone, open it, and allow installation from that file source if prompted.
A developer can do these steps for you. No Play Store publishing is required for personal use.

IMPORTANT BEHAVIOUR
Income is explicitly entered each month; salary is not copied automatically.
Left = that month's income minus expenses, savings and investments. It is not a bank account balance; previous month balances are not carried forward.
Charts include expenses only, not savings/investments. Six-month charts end in the selected month; no entries means zero recorded spending, not verified zero spending.
Records stay on the device/browser where you entered them. Browser records and Android records do not automatically sync; use backup/restore to transfer.
Use Settings > Export backup regularly. Uninstalling, clearing app data, or browser storage can erase records. Restore replaces current records after confirmation. CSV exports the selected month for Excel.
No bank linking, recurring transactions, automatic imports, cloud sync, app lock, or budgets in this version.
The Android screen uses system window insets for status bars, display cutouts and gesture navigation instead of fixed phone dimensions.

CHECK BEFORE RELYING ON IT
On the phone: enter a salary of 50,000, groceries 2,000, savings 5,000 and investments 3,000 in the same month. Left should be 40,000, Spent 2,000, Set aside 8,000. Check edit/delete, month switching, backup export/restore and CSV export. Check the punch-hole and bottom gesture area on your actual phone.

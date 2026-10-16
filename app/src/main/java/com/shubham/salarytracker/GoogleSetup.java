package com.shubham.salarytracker;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import java.security.MessageDigest;
import java.util.Locale;
import org.json.JSONObject;

/** Public certificate metadata only; never exposes a signing key or access token. */
final class GoogleSetup {
    static String info(Context context) {
        JSONObject result = new JSONObject();
        try {
            result.put("packageName", context.getPackageName());
            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= 28) {
                PackageInfo p = context.getPackageManager().getPackageInfo(
                    context.getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                signatures = p.signingInfo.getApkContentsSigners();
            } else {
                PackageInfo p = context.getPackageManager().getPackageInfo(
                    context.getPackageName(), PackageManager.GET_SIGNATURES);
                signatures = p.signatures;
            }
            if (signatures != null && signatures.length > 0) {
                byte[] digest = MessageDigest.getInstance("SHA-1").digest(signatures[0].toByteArray());
                StringBuilder fingerprint = new StringBuilder();
                for (byte b : digest) {
                    if (fingerprint.length() > 0) fingerprint.append(':');
                    fingerprint.append(String.format(Locale.ROOT, "%02X", b & 255));
                }
                result.put("sha1", fingerprint.toString());
            }
        } catch (Exception ignored) {
            // Omit unavailable information; do not invent a certificate fingerprint.
        }
        return result.toString();
    }
}

package com.shubham.salarytracker;

import android.accounts.Account;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.Scope;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Immutable backups: never overwrite another device's copy. No access tokens persist. */
final class DriveBackup {
 static final int REQUEST=17;
 interface Host {String load() throws Exception;void switchProfile(String email,String name) throws Exception;void event(String type,String message);void javascript(String function,String value);}
 private final Activity activity;private final Host host;private final SharedPreferences prefs;private final Handler handler=new Handler(Looper.getMainLooper());private final ExecutorService executor=Executors.newSingleThreadExecutor();private long lastAutomatic=0;private boolean busy=false;private String operation="",restoreId="",pendingEmail="";private final Runnable automatic=()->run("backup",false);
 DriveBackup(Activity a,Host h){activity=a;host=h;prefs=a.getSharedPreferences("drive",0);}
 String email(){return prefs.getString("email","");}
 String namespace(){return email().isEmpty()?"":hash(email().toLowerCase());}
 String status(){String email=email();return email.isEmpty()?"Not connected. Google Cloud registration for this signed app is required before first use.":"Connected: "+email+". "+prefs.getString("status-"+namespace(),"No confirmed backup yet.");}
 void changed(){handler.removeCallbacks(automatic);if(!email().isEmpty()){DriveSyncWorker.schedule(activity,true);}if(!email().isEmpty())handler.postDelayed(automatic,Math.max(10000,300000-(System.currentTimeMillis()-lastAutomatic)));}
 void run(String op,boolean interactive){if(busy){host.event("status","A Drive operation is already running.");return;}if(!op.equals("connect")&&email().isEmpty()){host.event("status","Connect a Google account first.");return;}busy=true;operation=op;pendingEmail=email();AuthorizationRequest.Builder builder=AuthorizationRequest.builder().setRequestedScopes(Arrays.asList(new Scope("https://www.googleapis.com/auth/drive.appdata"),new Scope("https://www.googleapis.com/auth/userinfo.email"),new Scope("https://www.googleapis.com/auth/userinfo.profile")));if(!op.equals("connect"))builder.setAccount(new Account(pendingEmail,"com.google"));
 Identity.getAuthorizationClient(activity).authorize(builder.build()).addOnSuccessListener(result->{if(result.hasResolution()){if(!interactive){fail("Reconnect Google Drive to renew permission. Local data is safe.");return;}try{activity.startIntentSenderForResult(result.getPendingIntent().getIntentSender(),REQUEST,null,0,0,0);}catch(Exception e){fail("Could not open Google authorization.");}}else authorized(result);}).addOnFailureListener(e->fail("Google connection unavailable. Register this app’s package and signing SHA-1 in Google Cloud, enable Drive API, and add your Google account as a test user. Local data is safe."));
 }
 void result(int result,Intent data){if(result!=Activity.RESULT_OK||data==null){fail("Google connection cancelled. Nothing was uploaded.");return;}try{authorized(Identity.getAuthorizationClient(activity).getAuthorizationResultFromIntent(data));}catch(Exception e){fail("Google authorization did not complete.");}}
 private void authorized(AuthorizationResult authorization){final String token=authorization.getAccessToken(),op=operation,expected=pendingEmail;executor.execute(()->{try{if(token==null)throw new IOException();JSONObject user=new JSONObject(request("GET","https://www.googleapis.com/oauth2/v3/userinfo",token,null,null));String actual=user.getString("email");if(!op.equals("connect")&&!actual.equalsIgnoreCase(expected))throw new IOException("Account mismatch");
 if(op.equals("connect")){String name=user.optString("name","");activity.runOnUiThread(()->{try{host.switchProfile(actual,name);prefs.edit().putString("email",actual).apply();DriveSyncWorker.schedule(activity,true);activity.getSharedPreferences("payments",0).edit().putBoolean("enabled-"+PaymentDrafts.profile(activity),false).apply();busy=false;host.event("reload","");}catch(Exception e){fail("Could not open this profile. Existing records were kept.");}});return;}
 if(op.equals("backup")||op.equals("resolve")){DriveSync.cycle(activity,actual,token,op.equals("resolve"));finish(status());}

 else if(op.equals("list")){JSONObject files=new JSONObject(request("GET","https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=trashed%3Dfalse&fields=files(id,name,createdTime)&orderBy=createdTime%20desc&pageSize=100",token,null,null));activity.runOnUiThread(()->{busy=false;host.javascript("onDriveBackups",files.optJSONArray("files").toString());});}
 else if(op.equals("restore")){String data=request("GET","https://www.googleapis.com/drive/v3/files/"+restoreId+"?alt=media",token,null,null);new JSONObject(data);activity.runOnUiThread(()->{busy=false;host.javascript("onDriveRestore",data);});}
 }catch(Exception e){fail("Drive operation failed. Check your internet and Google permission. Your local data was kept.");}});}
 void restore(String id){if(id==null||!id.matches("[A-Za-z0-9_-]+")){fail("Invalid backup.");return;}restoreId=id;run("restore",true);}
 void disconnect(){if(busy){host.event("status","Wait for the current Drive operation to finish.");return;}handler.removeCallbacks(automatic);DriveSyncWorker.cancel(activity);try{host.switchProfile("","");prefs.edit().remove("email").apply();host.event("reload","");}catch(Exception e){fail("Could not switch profiles.");}}
 private void finish(String message){activity.runOnUiThread(()->{busy=false;host.event("status",message);});}
 private void fail(String message){activity.runOnUiThread(()->{busy=false;host.event("status",message);});}
 static String hash(String s){try{byte[] bytes=MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));StringBuilder out=new StringBuilder();for(byte b:bytes)out.append(String.format("%02x",b));return out.toString();}catch(Exception e){throw new IllegalStateException(e);}}
 static String request(String method,String url,String token,String body,String type)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(20000);c.setReadTimeout(20000);c.setRequestMethod(method);c.setRequestProperty("Authorization","Bearer "+token);c.setInstanceFollowRedirects(false);try{if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",type);try(OutputStream out=c.getOutputStream()){out.write(body.getBytes(StandardCharsets.UTF_8));}}int code=c.getResponseCode();if(code<200||code>=300)throw new IOException("HTTP "+code);try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>16*1024*1024)throw new IOException("Backup too large");out.write(buffer,0,n);}return out.toString("UTF-8");}}finally{c.disconnect();}}
 void close(){handler.removeCallbacks(automatic);executor.shutdownNow();}
}

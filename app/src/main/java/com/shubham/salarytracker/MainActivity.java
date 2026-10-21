package com.shubham.salarytracker;
import android.app.Activity;import android.os.Bundle;import android.webkit.*;import android.content.Intent;import android.net.Uri;import android.view.View;import android.view.WindowInsets;import android.view.WindowInsetsController;import android.widget.FrameLayout;import android.os.Build;import android.graphics.Insets;import android.graphics.Color;import android.widget.Toast;import java.io.OutputStream;import java.nio.charset.StandardCharsets;
public class MainActivity extends Activity {

 private DriveBackup drive; private String profileNamespace="",bridgeNamespace=""; private boolean lockPrompt=false, unlocked=false, disableLockAfterAuth=false;
 private boolean darkMode=false; private FrameLayout safeArea; private WebView web; private ValueCallback<Uri[]> chooser; private String exportText,exportName; private LedgerStore ledger;
 public void onCreate(Bundle state){super.onCreate(state);profileNamespace=getSharedPreferences("drive",0).getString("email","");profileNamespace=profileNamespace.isEmpty()?"":DriveBackup.hash(profileNamespace.toLowerCase());ledger=new LedgerStore(this,profileNamespace);
 drive=new DriveBackup(this,new DriveBackup.Host(){public String load()throws Exception{return ledger.load();}public void switchProfile(String email,String name)throws Exception{String ns=email.isEmpty()?"":DriveBackup.hash(email.toLowerCase());LedgerStore next=new LedgerStore(MainActivity.this,ns);if(next.load().isEmpty()&&!ns.isEmpty()){org.json.JSONObject data=new org.json.JSONObject().put("version",6).put("accounts",new org.json.JSONArray()).put("records",new org.json.JSONArray()).put("transfers",new org.json.JSONArray()).put("leaves",new org.json.JSONArray()).put("defaultAccount",org.json.JSONObject.NULL).put("profile",new org.json.JSONObject().put("name",name.length()>40?name.substring(0,40):name));next.save(data.toString());}ledger.close();ledger=next;profileNamespace=ns;}public void event(String type,String message){try{javascript("onCloudEvent",new org.json.JSONObject().put("type",type).put("message",message).toString());}catch(Exception ignored){}}public void javascript(String function,String value){sendJavascript(function,value);}});
 // Move the WebView itself into the safe area. WebView padding does not reliably
 // move HTML content below system bars on edge-to-edge Android devices.
 if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
 else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
 safeArea=new FrameLayout(this);safeArea.setBackgroundColor(Color.parseColor("#000000"));
 web=new WebView(this);web.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);safeArea.addView(web,new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.MATCH_PARENT));
 safeArea.setOnApplyWindowInsetsListener((v,insets)->{
  if(Build.VERSION.SDK_INT>=30){
   int types=WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout();
   Insets bars=insets.getInsets(types);
   v.setPadding(bars.left,bars.top,bars.right,bars.bottom);
   // Forward zeroed safe-area insets so newer WebViews do not add a second gap.
   // Keep IME insets flowing so the keyboard can resize the web viewport.
   return new WindowInsets.Builder(insets).setInsets(types,Insets.NONE).setInsetsIgnoringVisibility(types,Insets.NONE).setDisplayCutout(null).build();
  }
  int left=insets.getSystemWindowInsetLeft(),top=insets.getSystemWindowInsetTop(),right=insets.getSystemWindowInsetRight(),bottom=insets.getSystemWindowInsetBottom();
  if(Build.VERSION.SDK_INT>=28&&insets.getDisplayCutout()!=null){
   android.view.DisplayCutout cutout=insets.getDisplayCutout();
   left=Math.max(left,cutout.getSafeInsetLeft());top=Math.max(top,cutout.getSafeInsetTop());right=Math.max(right,cutout.getSafeInsetRight());bottom=Math.max(bottom,cutout.getSafeInsetBottom());
  }
  v.setPadding(left,top,right,bottom);
  WindowInsets handled=insets.consumeSystemWindowInsets();
  return Build.VERSION.SDK_INT>=28?handled.consumeDisplayCutout():handled;
 });
 setContentView(safeArea);
 // Paint system bars with the last theme before the page loads, so a light theme never starts with a black strip.
 applyTheme(getSharedPreferences("ui",0).getString("theme","blue"));
 if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleAppBack);
 web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(true);web.getSettings().setAllowFileAccessFromFileURLs(false);web.getSettings().setAllowUniversalAccessFromFileURLs(false);
 web.setWebViewClient(new WebViewClient(){public void onPageFinished(WebView view,String url){if(pendingVoiceText!=null)sendVoiceResult(pendingVoiceText,pendingVoiceError);deliverSharedText();}public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !request.getUrl().toString().equals("file:///android_asset/index.html");}});
 web.setWebChromeClient(new WebChromeClient(){public boolean onJsAlert(WebView v,String u,String msg,JsResult r){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(msg).setPositiveButton("OK",(d,w)->r.confirm()).setOnCancelListener(d->r.cancel()).show();return true;}public boolean onJsConfirm(WebView v,String u,String msg,JsResult r){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(msg).setPositiveButton("Continue",(d,w)->r.confirm()).setNegativeButton("Cancel",(d,w)->r.cancel()).setOnCancelListener(d->r.cancel()).show();return true;}public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){if(chooser!=null)chooser.onReceiveValue(null);chooser=cb;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("*/*");i.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/csv","text/comma-separated-values","application/octet-stream"});i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,12);return true;}});
 web.addJavascriptInterface(new Object(){
 @JavascriptInterface public String pendingSync(){return DriveSync.readPending(MainActivity.this);}
 @JavascriptInterface public boolean applyPendingSync(String ticket,String data){boolean ok=DriveSync.apply(MainActivity.this,ticket,data);if(ok)runOnUiThread(()->drive.changed());return ok;}
 @JavascriptInterface public void resolveSyncLocal(){runOnUiThread(()->drive.run("resolve",true));}
 @JavascriptInterface public String paymentDrafts(){return PaymentDrafts.read(MainActivity.this).optJSONArray("drafts").toString();}
 @JavascriptInterface public String paymentSettings(){try{return PaymentDrafts.settings(MainActivity.this);}catch(Exception e){return "{}";}}
 @JavascriptInterface public void configurePayments(boolean enabled,String apps){try{org.json.JSONArray chosen=new org.json.JSONArray(apps);android.content.SharedPreferences.Editor prefs=getSharedPreferences("payments",0).edit().putBoolean("enabled-"+PaymentDrafts.profile(MainActivity.this),enabled);for(String pkg:PaymentDrafts.APPS.keySet()){boolean selected=false;for(int i=0;i<chosen.length();i++)if(pkg.equals(chosen.getString(i)))selected=true;prefs.putBoolean("app-"+PaymentDrafts.profile(MainActivity.this)+"-"+pkg,selected);}prefs.apply();if(enabled)runOnUiThread(()->startActivity(new Intent(android.provider.Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)));}catch(Exception ignored){}}
 @JavascriptInterface public boolean dismissPaymentDraft(String id){try{PaymentDrafts.dismiss(MainActivity.this,id);return true;}catch(Exception e){return false;}}
 @JavascriptInterface public String cloudStatus(){return drive.status();}
 @JavascriptInterface public void connectDrive(){runOnUiThread(()->startActivityForResult(android.accounts.AccountManager.newChooseAccountIntent(null,null,new String[]{"com.google"},"Choose your personal Google Drive account",null,null,null),19));}
 @JavascriptInterface public void backupDrive(){runOnUiThread(()->drive.run("backup",true));}
 @JavascriptInterface public void listDriveBackups(){runOnUiThread(()->drive.run("list",true));}
 @JavascriptInterface public void restoreDrive(String id){runOnUiThread(()->drive.restore(id));}
 @JavascriptInterface public void disconnectDrive(){runOnUiThread(()->drive.disconnect());}
 @JavascriptInterface public void importDeviceLedger(){runOnUiThread(()->{if(profileNamespace.isEmpty())return;try(LedgerStore source=new LedgerStore(MainActivity.this)){String data=source.load();if(data.isEmpty())return;sendJavascript("onDriveRestore",data);}catch(Exception e){Toast.makeText(MainActivity.this,"Device records could not be read",Toast.LENGTH_LONG).show();}});}
 @JavascriptInterface public void setAppLock(boolean enabled){runOnUiThread(()->{android.app.KeyguardManager keyguard=(android.app.KeyguardManager)getSystemService(KEYGUARD_SERVICE);if(!keyguard.isDeviceSecure()){Toast.makeText(MainActivity.this,"Set up a phone screen lock first",Toast.LENGTH_LONG).show();return;}if(enabled){getPreferences(0).edit().putBoolean("appLock",true).apply();unlocked=false;requestUnlock();}else{disableLockAfterAuth=true;unlocked=false;requestUnlock();}});}
 @JavascriptInterface public boolean appLockEnabled(){return getPreferences(0).getBoolean("appLock",false);}
 
 @JavascriptInterface public void startVoice(String language){runOnUiThread(()->launchVoice(language));}
 @JavascriptInterface public boolean saveRecoveryData(String data){
  android.util.AtomicFile file=new android.util.AtomicFile(new java.io.File(getFilesDir(),"before-restore"+profileNamespace+".json"));java.io.FileOutputStream out=null;
  try{new org.json.JSONObject(data);out=file.startWrite();out.write(data.getBytes(StandardCharsets.UTF_8));file.finishWrite(out);return true;}catch(Exception e){if(out!=null)file.failWrite(out);return false;}
 }
 @JavascriptInterface public String loadRecoveryData(){try{return new String(new android.util.AtomicFile(new java.io.File(getFilesDir(),"before-restore"+profileNamespace+".json")).readFully(),StandardCharsets.UTF_8);}catch(Exception e){return "";}}
 @JavascriptInterface public String loadData(){try{synchronized(DriveSync.LOCK){bridgeNamespace=profileNamespace;return ledger.load();}}catch(Exception e){return "DATABASE_ERROR";}}
 @JavascriptInterface public boolean saveData(String data){try{synchronized(DriveSync.LOCK){if(!profileNamespace.equals(bridgeNamespace))return false;ledger.save(data);}runOnUiThread(()->drive.changed());return true;}catch(Exception e){return false;}}
@JavascriptInterface public void setTheme(String name){runOnUiThread(()->{getSharedPreferences("ui",0).edit().putString("theme",name).apply();applyTheme(name);});}
@JavascriptInterface public boolean isSystemDark(){return (getResources().getConfiguration().uiMode&android.content.res.Configuration.UI_MODE_NIGHT_MASK)==android.content.res.Configuration.UI_MODE_NIGHT_YES;}
@JavascriptInterface public void exportFile(String name,String data,String mime){runOnUiThread(()->{if(exportText!=null){Toast.makeText(MainActivity.this,"Finish the current export first",Toast.LENGTH_SHORT).show();return;}exportName=name;exportText=data;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(mime);i.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,13);});}},"Android");web.loadUrl("file:///android_asset/index.html");captureSharedText(getIntent());}
 // Must match the page colour of each theme in v8/app.css; the strip under the menu shows this colour.
private void applyTheme(String name){boolean light=!"amoled".equals(name)&&!"night".equals(name);darkMode=!light;int bg=Color.parseColor("amoled".equals(name)?"#000000":"night".equals(name)?"#16181B":"teal".equals(name)?"#F5F7FB":"#FAF8F4");web.setBackgroundColor(bg);safeArea.setBackgroundColor(bg);getWindow().getDecorView().setBackgroundColor(bg);getWindow().setStatusBarColor(bg);getWindow().setNavigationBarColor(bg);if(Build.VERSION.SDK_INT>=30){
 WindowInsetsController controller=getWindow().getInsetsController();
 int appearance=WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
 if(controller!=null)controller.setSystemBarsAppearance(light?appearance:0,appearance);
 }else{
 int layout=View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
 getWindow().getDecorView().setSystemUiVisibility(layout|(light?(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR):0));
 }safeArea.requestApplyInsets();}
 private boolean voicePending=false; private String pendingVoiceText,pendingVoiceError;
 private void launchVoice(String language){
  if(voicePending)return;
  Intent speech=new Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
  speech.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL,android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
  speech.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE,"hi-IN".equals(language)?"hi-IN":"en-IN");
  speech.putExtra(android.speech.RecognizerIntent.EXTRA_PROMPT,"Say your expense, income or leave dates");
  speech.putExtra(android.speech.RecognizerIntent.EXTRA_MAX_RESULTS,1);
  try{voicePending=true;startActivityForResult(speech,14);}catch(android.content.ActivityNotFoundException e){voicePending=false;sendVoiceResult("","No speech service is available. Enable a speech service on your phone, or type the command.");}catch(SecurityException e){voicePending=false;sendVoiceResult("","Speech access was denied. Check your phone’s speech-service permissions, or type the command.");}
 }
 private void sendVoiceResult(String text,String error){pendingVoiceText=text;pendingVoiceError=error;if(web!=null)web.evaluateJavascript("(function(){if(!window.onVoiceResult)return false;window.onVoiceResult("+org.json.JSONObject.quote(text)+","+org.json.JSONObject.quote(error)+");return true;})()",result->{if("true".equals(result)){pendingVoiceText=null;pendingVoiceError=null;}});}
 @Override protected void onResume(){super.onResume();if(drive!=null)drive.changed();if(getPreferences(0).getBoolean("appLock",false)&&!unlocked)requestUnlock();if(web!=null)web.evaluateJavascript("window.onAppResume && window.onAppResume()",null);}
 @Override public void onBackPressed(){handleAppBack();}
 private void handleAppBack(){
  if(web==null)return;
  web.evaluateJavascript("(function(){return typeof window.handleAppBack==='function'?window.handleAppBack():true;})()",value->{
   if("false".equals(value)&&!isFinishing())new android.app.AlertDialog.Builder(MainActivity.this,darkMode?android.app.AlertDialog.THEME_DEVICE_DEFAULT_DARK:android.app.AlertDialog.THEME_DEVICE_DEFAULT_LIGHT)
    .setTitle("Close Money Map?").setMessage("Your saved entries are safe.").setNegativeButton("Stay",(d,w)->d.dismiss()).setPositiveButton("Close",(d,w)->finish()).show();
  });
 }
 protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==19){if(result==RESULT_OK&&data!=null){String email=data.getStringExtra(android.accounts.AccountManager.KEY_ACCOUNT_NAME);if(email!=null)drive.connect(email);}return;}if(request==DriveBackup.REQUEST){drive.result(result,data);return;}if(request==18){lockPrompt=false;if(result==RESULT_OK){unlocked=true;if(disableLockAfterAuth)getPreferences(0).edit().putBoolean("appLock",false).apply();disableLockAfterAuth=false;web.setVisibility(View.VISIBLE);if(!getPreferences(0).getBoolean("appLock",false))getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);}else{disableLockAfterAuth=false;finish();}return;}if(request==14){voicePending=false;java.util.ArrayList<String> words=data==null?null:data.getStringArrayListExtra(android.speech.RecognizerIntent.EXTRA_RESULTS);if(result==RESULT_OK&&words!=null&&!words.isEmpty())sendVoiceResult(words.get(0),"");else sendVoiceResult("",result==RESULT_CANCELED?"Speech cancelled. Nothing was saved.":"Speech was not understood. Try again or type the command.");return;}Uri uri=result==RESULT_OK&&data!=null?data.getData():null;if(request==12&&chooser!=null){chooser.onReceiveValue(uri==null?null:new Uri[]{uri});chooser=null;}if(request==13){boolean success=false;String name=exportName;if(uri!=null&&exportText!=null){try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new java.io.IOException("No output stream");out.write(exportText.getBytes(StandardCharsets.UTF_8));out.flush();success=true;Toast.makeText(this,"File saved",Toast.LENGTH_SHORT).show();}catch(Exception e){success=false;Toast.makeText(this,"Could not save file",Toast.LENGTH_LONG).show();}}exportText=null;exportName=null;web.evaluateJavascript("window.onExportResult && window.onExportResult("+org.json.JSONObject.quote(name==null?"":name)+","+success+")",null);}}
 private void sendJavascript(String function,String text){runOnUiThread(()->{if(web!=null)web.evaluateJavascript("window."+function+" && window."+function+"("+org.json.JSONObject.quote(text)+")",null);});}
 private void requestUnlock(){if(lockPrompt||isFinishing())return;android.app.KeyguardManager keyguard=(android.app.KeyguardManager)getSystemService(KEYGUARD_SERVICE);Intent intent=keyguard.createConfirmDeviceCredentialIntent("Unlock Salary","Use your phone’s screen lock");if(intent==null){Toast.makeText(this,"Restore your phone screen lock to unlock Salary",Toast.LENGTH_LONG).show();finish();return;}lockPrompt=true;web.setVisibility(View.INVISIBLE);getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);startActivityForResult(intent,18);}
 @Override protected void onPause(){if(getPreferences(0).getBoolean("appLock",false)&&!lockPrompt){unlocked=false;if(web!=null)web.setVisibility(View.INVISIBLE);}super.onPause();}
 @Override protected void onDestroy(){if(drive!=null)drive.close();if(ledger!=null)ledger.close();super.onDestroy();}
 private String sharedText;
 private void captureSharedText(Intent intent){if(intent!=null&&Intent.ACTION_SEND.equals(intent.getAction())&&"text/plain".equals(intent.getType())){String text=intent.getStringExtra(Intent.EXTRA_TEXT);if(text!=null)sharedText=text.substring(0,Math.min(500,text.length()));}}
 private void deliverSharedText(){if(sharedText!=null){String text=sharedText;sharedText=null;sendJavascript("onSharedPayment",text);}}
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);captureSharedText(intent);deliverSharedText();}

}

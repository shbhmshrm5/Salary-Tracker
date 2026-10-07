package com.shubham.salarytracker;
import android.app.Activity;import android.os.Bundle;import android.webkit.*;import android.content.Intent;import android.net.Uri;import android.view.View;import android.view.WindowInsets;import android.view.WindowInsetsController;import android.widget.FrameLayout;import android.os.Build;import android.graphics.Insets;import android.graphics.Color;import android.widget.Toast;import java.io.OutputStream;import java.nio.charset.StandardCharsets;
public class MainActivity extends Activity {
 private boolean darkMode=false; private FrameLayout safeArea; private WebView web; private ValueCallback<Uri[]> chooser; private String exportText,exportName; private LedgerStore ledger;
 public void onCreate(Bundle state){super.onCreate(state);ledger=new LedgerStore(this);
 // Move the WebView itself into the safe area. WebView padding does not reliably
 // move HTML content below system bars on edge-to-edge Android devices.
 if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
 else getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
 safeArea=new FrameLayout(this);safeArea.setBackgroundColor(Color.parseColor("#000000"));
 web=new WebView(this);safeArea.addView(web,new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.MATCH_PARENT));
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
 setContentView(safeArea);safeArea.requestApplyInsets();
 if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleAppBack);
 web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(true);web.getSettings().setAllowFileAccessFromFileURLs(false);web.getSettings().setAllowUniversalAccessFromFileURLs(false);
 web.setWebViewClient(new WebViewClient(){public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !request.getUrl().toString().equals("file:///android_asset/index.html");}});
 web.setWebChromeClient(new WebChromeClient(){public boolean onJsAlert(WebView v,String u,String msg,JsResult r){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(msg).setPositiveButton("OK",(d,w)->r.confirm()).setOnCancelListener(d->r.cancel()).show();return true;}public boolean onJsConfirm(WebView v,String u,String msg,JsResult r){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(msg).setPositiveButton("Continue",(d,w)->r.confirm()).setNegativeButton("Cancel",(d,w)->r.cancel()).setOnCancelListener(d->r.cancel()).show();return true;}public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){if(chooser!=null)chooser.onReceiveValue(null);chooser=cb;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("application/json");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,12);return true;}});
 web.addJavascriptInterface(new Object(){
 @JavascriptInterface public String loadData(){try{return ledger.load();}catch(Exception e){return "DATABASE_ERROR";}}
 @JavascriptInterface public boolean saveData(String data){try{ledger.save(data);return true;}catch(Exception e){return false;}}
@JavascriptInterface public void setTheme(String name){runOnUiThread(()->{boolean light=!"amoled".equals(name);darkMode=!light;int bg=android.graphics.Color.parseColor("amoled".equals(name)?"#000000":"teal".equals(name)?"#F3F8F8":"#F6F8FC");web.setBackgroundColor(bg);safeArea.setBackgroundColor(bg);getWindow().setStatusBarColor(bg);getWindow().setNavigationBarColor(bg);if(Build.VERSION.SDK_INT>=30){
 WindowInsetsController controller=getWindow().getInsetsController();
 int appearance=WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
 if(controller!=null)controller.setSystemBarsAppearance(light?appearance:0,appearance);
 }else{
 int layout=View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
 getWindow().getDecorView().setSystemUiVisibility(layout|(light?(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR):0));
 }safeArea.requestApplyInsets();});}@JavascriptInterface public void exportFile(String name,String data,String mime){runOnUiThread(()->{if(exportText!=null){Toast.makeText(MainActivity.this,"Finish the current export first",Toast.LENGTH_SHORT).show();return;}exportName=name;exportText=data;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(mime);i.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,13);});}},"Android");web.loadUrl("file:///android_asset/index.html");}
 @Override public void onBackPressed(){handleAppBack();}
 private void handleAppBack(){
  if(web==null)return;
  web.evaluateJavascript("(function(){return typeof window.handleAppBack==='function'?window.handleAppBack():true;})()",value->{
   if("false".equals(value)&&!isFinishing())new android.app.AlertDialog.Builder(MainActivity.this,darkMode?android.app.AlertDialog.THEME_DEVICE_DEFAULT_DARK:android.app.AlertDialog.THEME_DEVICE_DEFAULT_LIGHT)
    .setTitle("Close Salary Tracker?").setMessage("Your saved entries are safe.").setNegativeButton("Stay",(d,w)->d.dismiss()).setPositiveButton("Close",(d,w)->finish()).show();
  });
 }
 protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);Uri uri=result==RESULT_OK&&data!=null?data.getData():null;if(request==12&&chooser!=null){chooser.onReceiveValue(uri==null?null:new Uri[]{uri});chooser=null;}if(request==13){boolean success=false;String name=exportName;if(uri!=null&&exportText!=null){try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new java.io.IOException("No output stream");out.write(exportText.getBytes(StandardCharsets.UTF_8));out.flush();success=true;Toast.makeText(this,"File saved",Toast.LENGTH_SHORT).show();}catch(Exception e){success=false;Toast.makeText(this,"Could not save file",Toast.LENGTH_LONG).show();}}exportText=null;exportName=null;web.evaluateJavascript("window.onExportResult && window.onExportResult("+org.json.JSONObject.quote(name==null?"":name)+","+success+")",null);}}
}

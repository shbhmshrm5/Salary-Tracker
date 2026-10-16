package com.shubham.salarytracker;

import android.content.Context;
import android.util.AtomicFile;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import androidx.work.WorkManager;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/** Local recovery snapshot. The JSON export remains the portable backup format. */
public final class PhoneBackupWorker extends Worker {
 static final String PROFILE="profile";
 public PhoneBackupWorker(Context context, WorkerParameters parameters){super(context,parameters);}
 static File path(Context c,String namespace){return new File(c.getFilesDir(),"weekly-"+namespace+".json");}
 static long last(Context c,String namespace){return c.getSharedPreferences("phone-backups",0).getLong("last-"+namespace,0L);}
 static String latest(Context c,String namespace){try{return new String(new AtomicFile(path(c,namespace)).readFully(),StandardCharsets.UTF_8);}catch(Exception e){return "";}}
 static boolean snapshot(Context c,String namespace) throws Exception {
  synchronized(DriveSync.LOCK){try(LedgerStore store=new LedgerStore(c,namespace)){
   String data=store.load();if(data.isEmpty())return false;
   JSONObject json=new JSONObject(data);if(json.optInt("version")!=6)return false;
   AtomicFile file=new AtomicFile(path(c,namespace));FileOutputStream out=null;
   try{out=file.startWrite();out.write(data.getBytes(StandardCharsets.UTF_8));file.finishWrite(out);out=null;}
   finally{if(out!=null)file.failWrite(out);}
   c.getSharedPreferences("phone-backups",0).edit().putLong("last-"+namespace,System.currentTimeMillis()).apply();
   return true;
  }}
 }
 static void schedule(Context c,String namespace){
  WorkManager manager=WorkManager.getInstance(c);
  androidx.work.Data data=new androidx.work.Data.Builder().putString(PROFILE,namespace).build();
  manager.enqueueUniquePeriodicWork("salary-phone-weekly-"+namespace,ExistingPeriodicWorkPolicy.KEEP,
   new PeriodicWorkRequest.Builder(PhoneBackupWorker.class,7,TimeUnit.DAYS).setInputData(data).build());
  if(last(c,namespace)==0L)manager.enqueueUniqueWork("salary-phone-first-"+namespace,ExistingWorkPolicy.KEEP,
   new OneTimeWorkRequest.Builder(PhoneBackupWorker.class).setInputData(data).build());
 }
 @Override public Result doWork(){
  Context c=getApplicationContext();String namespace=getInputData().getString(PROFILE);if(namespace==null)return Result.failure();
  try{snapshot(c,namespace);return Result.success();}catch(Exception e){return Result.retry();}
 }
}

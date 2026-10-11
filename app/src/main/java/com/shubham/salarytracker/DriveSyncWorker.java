package com.shubham.salarytracker;
import android.content.Context;
import android.accounts.Account;
import androidx.work.*;
import com.google.android.gms.auth.api.identity.*;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.Tasks;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

public final class DriveSyncWorker extends Worker {
 public DriveSyncWorker(Context c,WorkerParameters p){super(c,p);}
 static void schedule(Context c,boolean immediate){Constraints constraints=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();WorkManager manager=WorkManager.getInstance(c);manager.enqueueUniquePeriodicWork("salary-drive-periodic",ExistingPeriodicWorkPolicy.KEEP,new PeriodicWorkRequest.Builder(DriveSyncWorker.class,30,TimeUnit.MINUTES).setConstraints(constraints).build());if(immediate)manager.enqueueUniqueWork("salary-drive-change",ExistingWorkPolicy.KEEP,new OneTimeWorkRequest.Builder(DriveSyncWorker.class).setInitialDelay(20,TimeUnit.SECONDS).setConstraints(constraints).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).build());}
 static void cancel(Context c){WorkManager.getInstance(c).cancelUniqueWork("salary-drive-periodic");WorkManager.getInstance(c).cancelUniqueWork("salary-drive-change");}
 @Override public Result doWork(){String email=getApplicationContext().getSharedPreferences("drive",0).getString("email","");if(email.isEmpty())return Result.success();try{AuthorizationResult result=Tasks.await(Identity.getAuthorizationClient(getApplicationContext()).authorize(AuthorizationRequest.builder().setAccount(new Account(email,"com.google")).setRequestedScopes(Arrays.asList(new Scope("https://www.googleapis.com/auth/drive.appdata"),new Scope("https://www.googleapis.com/auth/userinfo.email"),new Scope("https://www.googleapis.com/auth/userinfo.profile"))).build()),45,TimeUnit.SECONDS);if(result.hasResolution()||result.getAccessToken()==null){DriveSync.status(getApplicationContext(),email,"Reconnect Google Drive to renew permission. Local data is safe.");return Result.success();}DriveSync.cycle(getApplicationContext(),email,result.getAccessToken(),false);return Result.success();}catch(Exception e){DriveSync.status(getApplicationContext(),email,"Sync waiting for network / Google permission. Local records are safe.");return getRunAttemptCount()<3?Result.retry():Result.failure();}}
}

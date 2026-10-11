package com.shubham.salarytracker;
import android.app.Notification;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

public final class PaymentListener extends NotificationListenerService {
 @Override public void onNotificationPosted(StatusBarNotification sbn){try{String profile=PaymentDrafts.profile(this);if(!PaymentDrafts.APPS.containsKey(sbn.getPackageName())||!getSharedPreferences("payments",0).getBoolean("enabled-"+profile,false)||!getSharedPreferences("payments",0).getBoolean("app-"+profile+"-"+sbn.getPackageName(),false))return;Notification n=sbn.getNotification();if((n.flags&Notification.FLAG_GROUP_SUMMARY)!=0)return;CharSequence title=n.extras.getCharSequence(Notification.EXTRA_TITLE),body=n.extras.getCharSequence(Notification.EXTRA_BIG_TEXT);if(body==null)body=n.extras.getCharSequence(Notification.EXTRA_TEXT);PaymentDrafts.capture(this,sbn.getPackageName(),sbn.getKey(),String.valueOf(title==null?"":title)+" "+String.valueOf(body==null?"":body),sbn.getPostTime());}catch(Exception ignored){/* Never log notification contents. */}}
}

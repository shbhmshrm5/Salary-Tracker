package com.shubham.salarytracker;

import android.app.Activity;
import android.content.Intent;
import android.content.ClipData;
import android.net.Uri;
import android.provider.MediaStore;
import androidx.core.content.FileProvider;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import org.json.JSONObject;
import java.io.File;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** On-device OCR. Only an allowlisted bank, network and last four digits leave this class. */
final class CardScanner {
 static final int CAMERA=41,PHOTO=42;
 interface Host {void result(String value);}
 private final Activity activity;private final Host host;private File cameraFile;private Uri cameraUri;private String ticket="";private boolean busy=false;
 CardScanner(Activity a,Host h){activity=a;host=h;File dir=new File(a.getCacheDir(),"card-scan");File[] old=dir.listFiles();if(old!=null)for(File f:old)f.delete();}
 void start(String id){if(busy)return;ticket=id;new android.app.AlertDialog.Builder(activity).setTitle("Scan one card").setItems(new String[]{"Take photo","Choose photo"},(d,which)->launch(which)).setNegativeButton("Cancel",(d,w)->finish(null,"Scan cancelled. Your form is unchanged.")).setOnCancelListener(d->finish(null,"Scan cancelled. Your form is unchanged.")).show();}
 private void launch(int source){try{busy=true;if(source==0){File dir=new File(activity.getCacheDir(),"card-scan");dir.mkdirs();cameraFile=File.createTempFile("scan-",".jpg",dir);cameraUri=FileProvider.getUriForFile(activity,activity.getPackageName()+".scanfiles",cameraFile);Intent intent=new Intent(MediaStore.ACTION_IMAGE_CAPTURE);intent.putExtra(MediaStore.EXTRA_OUTPUT,cameraUri);intent.setClipData(ClipData.newRawUri("Card image",cameraUri));intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);activity.startActivityForResult(intent,CAMERA);}else{Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE);activity.startActivityForResult(intent,PHOTO);}}catch(Exception e){finish(null,"Camera or photo picker unavailable. Enter the details manually.");}}
 boolean result(int request,int code,Intent data){if(request!=CAMERA&&request!=PHOTO)return false;if(!busy){cleanup();return true;}if(code!=Activity.RESULT_OK){finish(null,"Scan cancelled. Your form is unchanged.");return true;}Uri uri=request==CAMERA?cameraUri:data==null?null:data.getData();if(uri==null){finish(null,"No image selected.");return true;}
 try{InputImage image=InputImage.fromFilePath(activity,uri);TextRecognizer recognizer=TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);recognizer.process(image).addOnSuccessListener(text->{try{finish(parse(text.getText()),"");}catch(Exception e){finish(null,"Could not recognise this card. Try a clear photo of one card.");}}).addOnFailureListener(e->finish(null,"Could not read this photo. Try again or enter manually.")).addOnCompleteListener(task->recognizer.close());}catch(Exception e){finish(null,"Could not open this photo.");}return true;}
 static JSONObject parse(String raw)throws Exception{
  String text=raw.toUpperCase(java.util.Locale.ROOT);Set<String> banks=new LinkedHashSet<>();String[][] choices={{"HDFC","HDFC"},{"ICICI","ICICI"},{"BOBCARD|BANK OF BARODA","Bank of Baroda"},{"AU SMALL FINANCE|AU BANK","AU Small Finance Bank"},{"\\bSBI\\b|STATE BANK","SBI"},{"AXIS","Axis"},{"KOTAK","Kotak"},{"INDUSIND","IndusInd Bank"},{"IDFC","IDFC FIRST Bank"},{"YES BANK","YES BANK"},{"CANARA","Canara Bank"},{"FEDERAL","Federal Bank"},{"PUNJAB NATIONAL|\\bPNB\\b","PNB"},{"UNION BANK","Union Bank of India"},{"(?<!UNION )BANK OF INDIA","Bank of India"},{"INDIAN BANK","Indian Bank"}};
  for(String[] p:choices)if(Pattern.compile(p[0]).matcher(text).find())banks.add(p[1]);
  Set<String> tails=new LinkedHashSet<>();Matcher full=Pattern.compile("(?<![0-9])(?:[0-9][ \\-]?){12,18}[0-9](?![0-9])").matcher(text);while(full.find()){String digits=full.group().replaceAll("[^0-9]","");if(luhn(digits))tails.add(digits.substring(digits.length()-4));}
  Matcher masked=Pattern.compile("[X*•·.]{2,}[ \\-]*([0-9]{4})(?![0-9])").matcher(text);while(masked.find())tails.add(masked.group(1));
  if(banks.size()>1||tails.size()>1)return new JSONObject().put("error","More than one card detected. Crop or photograph one card at a time.");
  String network=text.contains("RUPAY")?"RuPay":text.contains("MASTERCARD")?"Mastercard":text.contains("VISA")?"Visa":text.contains("AMERICAN EXPRESS")?"Amex":"";
  return new JSONObject().put("bank",banks.isEmpty()?"":banks.iterator().next()).put("last4",tails.isEmpty()?"":tails.iterator().next()).put("network",network);
 }
 static boolean luhn(String s){if(s.length()<13||s.length()>19)return false;int sum=0;boolean twice=false;for(int i=s.length()-1;i>=0;i--){int n=s.charAt(i)-'0';if(twice){n*=2;if(n>9)n-=9;}sum+=n;twice=!twice;}return sum%10==0;}
 private void finish(JSONObject fields,String error){try{JSONObject out=fields==null?new JSONObject():fields;out.put("ticket",ticket);if(!error.isEmpty())out.put("error",error);cleanup();busy=false;if(!activity.isDestroyed())host.result(out.toString());}catch(Exception ignored){cleanup();busy=false;}}
 private void cleanup(){if(cameraUri!=null)activity.revokeUriPermission(cameraUri,Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);if(cameraFile!=null)cameraFile.delete();cameraFile=null;cameraUri=null;}
 void close(){cleanup();}
}

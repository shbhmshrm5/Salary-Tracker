package com.shubham.salarytracker;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.json.JSONObject;
import org.json.JSONArray;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=28,manifest=Config.NONE)
public class LedgerStoreTest {
 private LedgerStore fresh(){RuntimeEnvironment.getApplication().deleteDatabase("salary-ledger.db");return new LedgerStore(RuntimeEnvironment.getApplication());}
 private JSONObject empty() throws Exception{return new JSONObject("{\"version\":3,\"accounts\":[],\"records\":[],\"transfers\":[],\"leaves\":[],\"defaultAccount\":null}");}
 @Test public void persistsRowsAndRollsBackWholeSave() throws Exception{
  LedgerStore store=fresh();assertEquals("",store.load());JSONObject data=empty();data.getJSONArray("records").put(new JSONObject("{\"id\":\"r1\",\"amount\":100}"));data.getJSONArray("leaves").put(new JSONObject("{\"id\":\"l1\",\"days\":0.5}"));store.save(data.toString());store.close();store=new LedgerStore(RuntimeEnvironment.getApplication());assertEquals(1,new JSONObject(store.load()).getJSONArray("records").length());
  store.getWritableDatabase().execSQL("CREATE TRIGGER fail_save BEFORE INSERT ON metadata BEGIN SELECT RAISE(ABORT,'test failure'); END");data.put("records",new JSONArray());try{store.save(data.toString());fail("Must fail atomically");}catch(android.database.SQLException expected){}assertEquals(1,new JSONObject(store.load()).getJSONArray("records").length());assertEquals(1,new JSONObject(store.load()).getJSONArray("leaves").length());
  store.getWritableDatabase().execSQL("DROP TRIGGER fail_save");store.save(data.toString());assertEquals(0,new JSONObject(store.load()).getJSONArray("records").length());store.close();
 }
 @Test public void storesMoreThanFiveMegabytesAndRejectsDuplicates() throws Exception{
  LedgerStore store=fresh();JSONObject data=empty();JSONArray rows=data.getJSONArray("records");String note=new String(new char[600]).replace('\0','x');for(int i=0;i<10000;i++)rows.put(new JSONObject().put("id","r"+i).put("amount",10).put("note",note));assertTrue(data.toString().length()>5000000);store.save(data.toString());store.close();store=new LedgerStore(RuntimeEnvironment.getApplication());assertEquals(10000,new JSONObject(store.load()).getJSONArray("records").length());rows.put(rows.getJSONObject(0));try{store.save(data.toString());fail("Duplicate IDs must be rejected");}catch(IllegalArgumentException expected){}assertEquals(10000,new JSONObject(store.load()).getJSONArray("records").length());store.close();
 }
 @Test public void googleProfilesNeverShareLedgerRows() throws Exception {
  android.content.Context context=RuntimeEnvironment.getApplication();
  context.deleteDatabase("salary-alice.db");context.deleteDatabase("salary-bob.db");
  LedgerStore device=fresh(), alice=new LedgerStore(context,"alice"),bob=new LedgerStore(context,"bob");
  JSONObject data=empty().put("version",5).put("profile",new JSONObject().put("name","Alice"));data.getJSONArray("records").put(new JSONObject().put("id","only-alice").put("amount",100));
  alice.save(data.toString());assertEquals("",bob.load());assertEquals("",device.load());alice.close();alice=new LedgerStore(context,"alice");assertEquals("Alice",new JSONObject(alice.load()).getJSONObject("profile").getString("name"));alice.close();bob.close();device.close();
 }
 @Test public void versionSixSnapshotCanRestoreToFreshDatabase() throws Exception {
  android.content.Context c=RuntimeEnvironment.getApplication();
  c.deleteDatabase("salary-ledger.db");c.deleteDatabase("salary-fresh-install.db");
  JSONObject data=empty().put("version",6).put("profile",new JSONObject().put("name","Asha"));
  data.getJSONArray("accounts").put(new JSONObject().put("id","bank").put("name","Bank").put("bank","HDFC").put("opening",100000).put("date","2026-01-01"));
  data.getJSONArray("records").put(new JSONObject().put("id","pay").put("accountId","bank").put("category","Salary").put("amount",25000).put("date","2026-01-05").put("note","Salary"));
  data.put("defaultAccount","bank").put("uiPreferences",new JSONObject().put("textSize","large"));
  try(LedgerStore source=new LedgerStore(c)){source.save(data.toString());}
  assertTrue(PhoneBackupWorker.snapshot(c,""));assertTrue(PhoneBackupWorker.last(c,"")>0);
  String exported=PhoneBackupWorker.latest(c,"");assertEquals(6,new JSONObject(exported).getInt("version"));
  try(LedgerStore restored=new LedgerStore(c,"fresh-install")){restored.save(exported);JSONObject result=new JSONObject(restored.load());
   assertEquals("Asha",result.getJSONObject("profile").getString("name"));
   assertEquals("bank",result.getString("defaultAccount"));
   assertEquals(25000,result.getJSONArray("records").getJSONObject(0).getInt("amount"));
   assertEquals("large",result.getJSONObject("uiPreferences").getString("textSize"));}
 }
}

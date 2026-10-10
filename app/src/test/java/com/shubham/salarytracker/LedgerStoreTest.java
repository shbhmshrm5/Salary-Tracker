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
  JSONObject data=empty().put("profile",new JSONObject().put("name","Alice"));data.getJSONArray("records").put(new JSONObject().put("id","only-alice").put("amount",100));
  alice.save(data.toString());assertEquals("",bob.load());assertEquals("",device.load());alice.close();alice=new LedgerStore(context,"alice");assertEquals("Alice",new JSONObject(alice.load()).getJSONObject("profile").getString("name"));alice.close();bob.close();device.close();
 }
}

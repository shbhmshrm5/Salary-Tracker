package com.shubham.salarytracker;

import android.content.Context;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;

/** Each account, transaction, transfer and leave is a separate durable row.
 * One atomic transaction applies a save; unchanged rows are not rewritten. */
public class LedgerStore extends SQLiteOpenHelper {
 private static final String[] TABLES={"accounts","records","transfers","leaves"};
 public LedgerStore(Context context){this(context, "");}
 public LedgerStore(Context context,String namespace){super(context,namespace.isEmpty()?"salary-ledger.db":"salary-"+namespace+".db",null,1);}
 @Override public void onCreate(SQLiteDatabase db){
  for(String table:TABLES)db.execSQL("CREATE TABLE "+table+" (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL)");
  db.execSQL("CREATE TABLE metadata (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL)");
 }
 @Override public void onUpgrade(SQLiteDatabase db,int oldVersion,int newVersion){throw new IllegalStateException("Unsupported database upgrade");}
 public synchronized String load() throws Exception {
  SQLiteDatabase db=getReadableDatabase(); JSONObject state;
  try(Cursor c=db.rawQuery("SELECT payload FROM metadata WHERE id='state'",null)){
   if(!c.moveToFirst())return "";state=new JSONObject(c.getString(0));
  }
  for(String table:TABLES){JSONArray rows=new JSONArray();try(Cursor c=db.rawQuery("SELECT payload FROM "+table+" ORDER BY rowid",null)){while(c.moveToNext())rows.put(new JSONObject(c.getString(0)));}state.put(table,rows);}
  return state.toString();
 }
 public synchronized void save(String text) throws Exception {
  JSONObject state=new JSONObject(text);if(state.getInt("version")!=3 && state.getInt("version")!=4 && state.getInt("version")!=5 && state.getInt("version")!=6)throw new IllegalArgumentException("Unsupported data version");
  // Parse all collections first. Any duplicate ID rejects the complete save.
  HashMap<String,HashMap<String,String>> incoming=new HashMap<>();
  for(String table:TABLES){JSONArray list=state.getJSONArray(table);HashMap<String,String> rows=new HashMap<>();for(int i=0;i<list.length();i++){JSONObject row=list.getJSONObject(i);String id=row.getString("id");if(id.isEmpty()||rows.put(id,row.toString())!=null)throw new IllegalArgumentException("Duplicate ID");}incoming.put(table,rows);}
  JSONObject meta=new JSONObject();for(Iterator<String> it=state.keys();it.hasNext();){String key=it.next();if(!incoming.containsKey(key))meta.put(key,state.get(key));}
  SQLiteDatabase db=getWritableDatabase();db.beginTransaction();
  try{
   for(String table:TABLES){HashMap<String,String> rows=incoming.get(table);HashSet<String> found=new HashSet<>();
    HashMap<String,String> existing=new HashMap<>();try(Cursor c=db.rawQuery("SELECT id,payload FROM "+table,null)){while(c.moveToNext())existing.put(c.getString(0),c.getString(1));}
    for(String id:existing.keySet()){String next=rows.get(id);if(next==null)db.delete(table,"id=?",new String[]{id});else{found.add(id);if(!next.equals(existing.get(id))){ContentValues v=new ContentValues();v.put("payload",next);db.update(table,v,"id=?",new String[]{id});}}}
    // Insert in input order so migration preserves transaction ordering.
    JSONArray list=state.getJSONArray(table);for(int i=0;i<list.length();i++){JSONObject row=list.getJSONObject(i);String id=row.getString("id");if(!found.contains(id)){ContentValues v=new ContentValues();v.put("id",id);v.put("payload",rows.get(id));db.insertOrThrow(table,null,v);}}
   }
   ContentValues v=new ContentValues();v.put("id","state");v.put("payload",meta.toString());db.insertWithOnConflict("metadata",null,v,SQLiteDatabase.CONFLICT_REPLACE);
   db.setTransactionSuccessful();
  }finally{db.endTransaction();}
 }
}

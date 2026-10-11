package com.shubham.salarytracker;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.json.JSONObject;
import static org.junit.Assert.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=35)
public class CardScannerTest {
 @Test public void fullNumberNeverLeavesParser()throws Exception{JSONObject x=CardScanner.parse("HDFC BANK VISA\n4111 1111 1111 1111\nCVV 123\nVALID 12/29\nTEST PERSON");assertEquals("HDFC",x.getString("bank"));assertEquals("1111",x.getString("last4"));assertEquals("Visa",x.getString("network"));assertEquals(3,x.length());assertFalse(x.toString().contains("4111"));assertFalse(x.toString().contains("123"));assertFalse(x.toString().contains("TEST PERSON"));}
 @Test public void maskedCardsAndMultipleCardPhotos()throws Exception{JSONObject x=CardScanner.parse("BOBCARD RuPay •• 0872");assertEquals("Bank of Baroda",x.getString("bank"));assertEquals("0872",x.getString("last4"));assertTrue(CardScanner.parse("BOBCARD •• 0872\nICICI VISA •• 5006").has("error"));}
 @Test public void noGuessFromAmountOrExpiry()throws Exception{JSONObject x=CardScanner.parse("HDFC BANK\nRs 4085.00\n12/2029\nCVV 321");assertEquals("",x.getString("last4"));assertEquals("Union Bank of India",CardScanner.parse("UNION BANK OF INDIA VISA").getString("bank"));assertEquals("",CardScanner.parse("1234 5678 9012 3456").getString("last4"));}
}

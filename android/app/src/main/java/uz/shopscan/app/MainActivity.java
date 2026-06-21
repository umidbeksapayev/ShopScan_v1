package uz.shopscan.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Mahalliy plaginlar super.onCreate'dan OLDIN ro'yxatdan o'tkaziladi.
        registerPlugin(HtmlPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

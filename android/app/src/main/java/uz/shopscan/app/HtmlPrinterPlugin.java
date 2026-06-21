package uz.shopscan.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * HtmlPrinter — HTML'ni Android tizim print dialogi orqali chop etadi
 * (PrintManager + offscreen WebView). Capacitor WebView'da window.print()
 * ishlamaydi; bu plagin chek (receipt-print.ts) va A4 yorliq (labels.ts)
 * uchun haqiqiy print/PDF dialogini ochadi (istalgan printer yoki "PDF saqlash").
 *
 * JS tomondan: registerPlugin("HtmlPrinter").print({ html, name }).
 */
@CapacitorPlugin(name = "HtmlPrinter")
public class HtmlPrinterPlugin extends Plugin {

    // WebView GC bo'lib ketmasligi uchun print oqimi davomida ref'ni ushlaymiz.
    private WebView printWebView;

    @PluginMethod
    public void print(final PluginCall call) {
        final String html = call.getString("html");
        final String name = call.getString("name", "uscan");
        if (html == null) {
            call.reject("html majburiy");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                final WebView webView = new WebView(getContext());
                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        // Rasm/shrift joylashishi uchun qisqa kechikish, so'ng print.
                        view.postDelayed(() -> {
                            try {
                                createPrintJob(view, name);
                                call.resolve();
                            } catch (Exception e) {
                                call.reject(e.getMessage(), e);
                            }
                        }, 250);
                    }
                });
                webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
                // Eng so'nggi WebView'ni ushlab turamiz (print adapter unga tayanadi).
                printWebView = webView;
            } catch (Exception e) {
                call.reject(e.getMessage(), e);
            }
        });
    }

    private void createPrintJob(WebView webView, String jobName) {
        PrintManager printManager =
                (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
        if (printManager == null) {
            throw new IllegalStateException("PrintManager mavjud emas");
        }
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
        PrintAttributes attributes = new PrintAttributes.Builder().build();
        printManager.print(jobName, adapter, attributes);
    }
}

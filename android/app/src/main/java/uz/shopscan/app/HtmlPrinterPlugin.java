package uz.shopscan.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * HtmlPrinter — HTML'ni Android tizim print dialogi orqali chop etadi
 * (PrintManager + WebView). Capacitor WebView'da window.print() ishlamaydi;
 * bu plagin chek (receipt-print.ts) va A4 yorliq (labels.ts) uchun haqiqiy
 * print/PDF dialogini ochadi (istalgan printer yoki "PDF saqlash").
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

                // Ayrim qurilmalarda hardware accel WebView createPrintDocumentAdapter'da
                // BO'SH sahifa beradi → software layer.
                webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);

                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setLoadWithOverviewMode(true);
                settings.setUseWideViewPort(true);

                // MUHIM: WebView'ni ko'rinish ierarxiyasiga BIRIKTIRAMIZ. Samsung/Xiaomi
                // va boshqalarda biriktirilmagan WebView render qilmaydi → print adapteri
                // 0 sahifa beradi (dialog ochilmaydi) yoki onPageFinished umuman
                // ishlamaydi (JS promise abadiy osilib qoladi). 1×1 px — ko'rinmaydi.
                final ViewGroup root = getActivity().findViewById(android.R.id.content);
                root.addView(webView, new ViewGroup.LayoutParams(1, 1));

                // Bir martagina settle bo'lsin (success-path yoki timeout).
                final boolean[] done = { false };
                final Runnable cleanup = () -> {
                    try {
                        root.removeView(webView);
                    } catch (Exception ignored) {
                    }
                };

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        // Barcode data: rasmlari render bo'lib ulgurishi uchun kutamiz.
                        view.postDelayed(() -> {
                            if (done[0]) return;
                            done[0] = true;
                            try {
                                createPrintJob(view, name);
                                call.resolve();
                            } catch (Exception e) {
                                call.reject(e.getMessage(), e);
                            } finally {
                                cleanup.run();
                            }
                        }, 600);
                    }
                });

                // null EMAS — haqiqiy base URL data: rasmlarni ayrim WebView'larda o'qiydi.
                webView.loadDataWithBaseURL(
                    "https://www.uscan.uz/", html, "text/html", "UTF-8", null);
                printWebView = webView;

                // Xavfsizlik timeout: onPageFinished/render ishlamasa ham promise SETTLE
                // bo'lsin — aks holda JS abadiy kutib, hech qanday toast chiqmaydi.
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (done[0]) return;
                    done[0] = true;
                    call.reject("Print timeout — sahifa render bo'lmadi (onPageFinished)");
                    cleanup.run();
                }, 6000);

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

import { toast } from "sonner";

/**
 * HTML chop etish ko'prigi — bitta yo'l, ikki platforma.
 *
 * - Native (Capacitor Android): `HtmlPrinter` plagini → Android tizim print
 *   dialogi (PrintManager). WebView'da window.print() ISHLAMAYDI, shuning uchun
 *   shart. Chek (receipt-print.ts) va A4 yorliq (labels.ts) shu yo'ldan o'tadi.
 * - Web/brauzer: yashirin iframe + window.print() (popup-blocker'siz).
 *
 * Capacitor importlari DINAMIK — Vercel web build'iga ta'sir qilmaydi.
 */

interface HtmlPrinterPlugin {
  print(options: { html: string; name?: string }): Promise<void>;
}

/** Native platformami (faqat klientda; web yoki SSR'da false). */
export async function isNativePlatform(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Native HtmlPrinter plagini orqali tizim print dialogini ochadi. */
async function printHtmlNative(html: string, name: string): Promise<void> {
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  // Plagin shu APK'da ro'yxatdan o'tganmi? Yo'q bo'lsa (eski/noto'g'ri build) —
  // DIAGNOSTIKA: APK'da ROSAMAN ro'yxatdan o'tgan plaginlar ro'yxatini ko'rsatamiz.
  // HtmlPrinter ro'yxatda bo'lmasa → APK build/o'rnatish muammosi (JS emas).
  if (!Capacitor.isPluginAvailable("HtmlPrinter")) {
    const cap = Capacitor as unknown as { PluginHeaders?: { name: string }[] };
    const names = (cap.PluginHeaders ?? []).map((p) => p.name).join(", ") || "—";
    throw new Error(
      `HtmlPrinter plagini bu APK'da yo'q. APK'dagi plaginlar: [${names}]`
    );
  }
  const HtmlPrinter = registerPlugin<HtmlPrinterPlugin>("HtmlPrinter");
  await HtmlPrinter.print({ html, name });
}

/** Yashirin iframe + window.print() (brauzer; popup-blocker'siz). */
function printHtmlViaIframe(html: string): void {
  if (typeof window === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  win.onafterprint = () => window.setTimeout(() => iframe.remove(), 1000);

  doc.open();
  doc.write(html);
  doc.close();

  // Layout + shrift/rasm yuklanishi uchun bir oz kutamiz, keyin print dialogi.
  window.setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      iframe.remove();
    }
  }, 300);
}

/**
 * HTML'ni mos yo'l bilan chop etadi: native bo'lsa tizim print dialogi,
 * aks holda brauzer iframe print. Klient komponentlardan chaqiriladi.
 */
export async function printHtmlAuto(html: string, name = "uscan"): Promise<void> {
  if (await isNativePlatform()) {
    try {
      await printHtmlNative(html, name);
      // DIAGNOSTIKA (vaqtinchalik): native print() muvaffaqiyatli QAYTDI.
      // Bu toast chiqsa-yu, lekin print oynasi ochilmasa → native print
      // dialogi muammosi (WebView/PrintManager), JS to'g'ri ishlayapti.
      toast.success("Print yuborildi ✓", {
        description: "Agar print oynasi ochilmasa — shuni menga ayting.",
      });
    } catch (err) {
      // Native print xatosi JIM qolmasin (avval shunday edi → "tugma ishlamaydi").
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Chop etib bo'lmadi", { description: msg });
    }
    return;
  }
  printHtmlViaIframe(html);
}

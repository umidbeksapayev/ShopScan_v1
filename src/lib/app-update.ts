/**
 * APK yuklab olish + versiya-tekshiruv (native yangilanish).
 *
 * Web auto-yangilanadi (remote-URL) — bu faqat NATIVE APK uchun: o'rnatilgan
 * versiyani serverdagi app-version.json bilan solishtirib, "yangilanish bor"
 * deb ko'rsatadi. apkUrl app-version.json'da (kodsiz o'zgartiriladi).
 */

export interface AppVersionInfo {
  versionCode: number;
  versionName: string;
  apkUrl: string;
}

/** Serverdagi eng so'nggi versiya (public/app-version.json). */
export async function fetchAppVersion(): Promise<AppVersionInfo> {
  const res = await fetch("/app-version.json", { cache: "no-store" });
  if (!res.ok) throw new Error("app-version.json o'qilmadi");
  return (await res.json()) as AppVersionInfo;
}

/** O'rnatilgan APK versiya kodi (faqat native; web → null). */
export async function getInstalledVersionCode(): Promise<number | null> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return null;
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    // Android'da build = versionCode (raqam string)
    return parseInt(info.build, 10) || null;
  } catch {
    return null;
  }
}

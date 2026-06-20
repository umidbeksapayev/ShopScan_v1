"use client";

import { useEffect } from "react";

/**
 * Native splash'ni web ilova interaktiv bo'lgach yashiradi (oq miltillashsiz).
 * Capacitor importlari dinamik + native-only → web build'ga ta'sir qilmaydi.
 * Splash launchAutoHide:false (capacitor.config) → shu komponent yashiradi.
 */
export function SplashHider() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { SplashScreen } = await import("@capacitor/splash-screen");
        if (!cancelled) await SplashScreen.hide({ fadeOutDuration: 250 });
      } catch {
        // Plugin yo'q yoki web muhiti — e'tiborsiz
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

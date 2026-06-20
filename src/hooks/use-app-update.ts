"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAppVersion, getInstalledVersionCode } from "@/lib/app-update";

/** Native platformami (mount'dan keyin; SSR/web → false). */
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (active) setNative(Capacitor.isNativePlatform());
      } catch {
        /* web — native emas */
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return native;
}

/** Serverdagi eng so'nggi APK versiyasi (public/app-version.json). */
export function useAppVersion() {
  return useQuery({
    queryKey: ["app-version"],
    queryFn: fetchAppVersion,
    staleTime: 60 * 60 * 1000,
  });
}

/** Native: o'rnatilgan APK eskirgan-yo'qligi (server versiyasi > o'rnatilgan). */
export function useUpdateAvailable(): { available: boolean; apkUrl: string | null } {
  const { data } = useAppVersion();
  const [installed, setInstalled] = useState<number | null>(null);

  useEffect(() => {
    getInstalledVersionCode().then(setInstalled);
  }, []);

  if (!data || installed == null) {
    return { available: false, apkUrl: data?.apkUrl ?? null };
  }
  return { available: data.versionCode > installed, apkUrl: data.apkUrl };
}

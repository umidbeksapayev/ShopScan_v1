"use client";

import { useState } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { getQueryClient } from "@/lib/query-client";
import { createIDBPersister } from "@/lib/query-persister";
import { I18nProvider } from "@/components/i18n-provider";

// IndexedDB'ga saqlanadigan so'rovlar:
//  - products/categories — offline katalog
//  - profile/memberships — ilova qobig'i (topbar + nav). Sovuq ishga tushishda
//    shell darhol keshdan chiziladi (tarmoqni kutmaydi → "tez ochildi" hissi).
// Hisobot/dashboard kabi maxfiy/yirik ma'lumotlar diskda saqlanmaydi.
const PERSISTED_KEYS = new Set([
  "products",
  "categories",
  "profile",
  "memberships",
]);

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [persister] = useState(() => createIDBPersister());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 kun
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                PERSISTED_KEYS.has(String(query.queryKey?.[0])),
            },
          }}
        >
          {children}
          <Toaster position="top-center" richColors closeButton theme="system" />
        </PersistQueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

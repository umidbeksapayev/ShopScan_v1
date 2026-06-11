"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScanLine, Settings, LogOut, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShop } from "@/hooks/use-shop";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { data: shop } = useShop();
  const router = useRouter();
  const { t } = useTranslation();
  const initial = shop?.name?.trim()?.[0]?.toUpperCase() ?? "S";

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Chap: mobil logo / do'kon nomi */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-pop xl:hidden">
          <ScanLine className="h-5 w-5" />
        </span>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <Store className="h-4 w-4" />
          <span className="font-medium text-foreground">{shop?.name ?? t("auth.shopNamePlaceholder")}</span>
        </div>
      </div>

      {/* O'ng: til + tema + avatar menyu */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent"
            aria-label={t("nav.settings")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initial}
            </span>
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:inline">
              {shop?.name ?? t("auth.shopNamePlaceholder")}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" /> {t("nav.settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" /> {t("nav.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

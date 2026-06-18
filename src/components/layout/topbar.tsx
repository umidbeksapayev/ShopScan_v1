"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScanLine, Settings, LogOut, Store, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/hooks/use-shop";
import { useMemberships, useIsOwner } from "@/hooks/use-membership";
import { useActiveShop } from "@/stores/active-shop";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar() {
  const { data: shop } = useShop();
  const { data: memberships } = useMemberships();
  const { setActiveShopId } = useActiveShop();
  const isOwner = useIsOwner();
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const initial = shop?.name?.trim()?.[0]?.toUpperCase() ?? "S";
  const list = memberships ?? [];

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function switchShop(id: string) {
    if (id === shop?.id) return;
    setActiveShopId(id);
    // Barcha so'rovlar yangi faol do'kon bo'yicha qayta yuklanadi
    qc.invalidateQueries();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Chap: mobil logo / do'kon nomi */}
      <div className="flex items-center gap-3">
        {shop?.logo_url ? (
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl xl:hidden">
            <Image src={shop.logo_url} alt="" fill sizes="36px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-pop xl:hidden">
            <ScanLine className="h-5 w-5" />
          </span>
        )}
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <Store className="h-4 w-4" />
          <span className="font-medium text-foreground">
            {shop?.name ?? t("auth.shopNamePlaceholder")}
          </span>
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
              {shop?.logo_url ? (
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <Image src={shop.logo_url} alt="" fill sizes="36px" className="object-cover" />
                </span>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground">
                  {initial}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:inline">
                {shop?.name ?? t("auth.shopNamePlaceholder")}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Do'kon almashtirgich — bir nechta do'kon a'zosi bo'lsa */}
            {list.length > 1 && (
              <>
                <DropdownMenuLabel>{t("nav.switchShop")}</DropdownMenuLabel>
                {list.map((m) => (
                  <DropdownMenuItem
                    key={m.shop.id}
                    onClick={() => switchShop(m.shop.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        shop?.id === m.shop.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{m.shop.name}</span>
                    <span className="ml-auto pl-2 text-xs text-muted-foreground">
                      {m.role === "owner" ? t("staff.owner") : t("staff.cashier")}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {isOwner && (
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" /> {t("nav.settings")}
                </Link>
              </DropdownMenuItem>
            )}
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

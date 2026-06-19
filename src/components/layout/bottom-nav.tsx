"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  BarChart3,
  ShieldCheck,
  Users,
  Truck,
  PackagePlus,
  Settings,
  UserCog,
  LayoutGrid,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useMembership } from "@/hooks/use-membership";
import { cn } from "@/lib/utils";
import type { PermissionKey } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  perm?: PermissionKey | "owner";
}

// Telefon uchun: 4 asosiy (ruxsatga qarab) + "Ko'proq".
const primaryItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard, perm: "view_reports" },
  { href: "/catalog", labelKey: "nav.catalog", icon: Package, perm: "manage_products" },
  { href: "/sell", labelKey: "nav.sell", icon: ShoppingCart },
  { href: "/history", labelKey: "nav.history", icon: ReceiptText },
];

const moreItems: NavItem[] = [
  { href: "/customers", labelKey: "nav.customers", icon: Users, perm: "manage_debt" },
  { href: "/purchases", labelKey: "nav.purchases", icon: PackagePlus, perm: "purchase" },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: Truck, perm: "purchase" },
  { href: "/reports", labelKey: "nav.report", icon: BarChart3, perm: "view_reports" },
  { href: "/staff", labelKey: "nav.staff", icon: UserCog, perm: "owner" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, perm: "owner" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: membership } = useMembership();
  const [moreOpen, setMoreOpen] = useState(false);

  const can = (item: NavItem) => {
    if (!item.perm) return true;
    if (!membership) return false;
    if (membership.role === "owner") return true;
    if (item.perm === "owner") return false;
    return membership.permissions[item.perm] === true;
  };

  const primary = primaryItems.filter(can);
  const more = moreItems.filter(can);
  if (profile?.role === "super_admin") {
    more.push({ href: "/admin", labelKey: "nav.admin", icon: ShieldCheck });
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const moreActive = more.some((m) => isActive(m.href));

  return (
    <>
      {/* Suzuvchi (floating) yumaloq pill nav — ekran chetidan uzilgan, premium */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] xl:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-around gap-1 rounded-[1.75rem] border border-border/60 bg-card/90 px-2 py-2 shadow-[0_12px_36px_-10px_rgba(17,20,45,0.4)] backdrop-blur-xl">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 transition-transform duration-150 active:scale-90"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 ease-out",
                    active
                      ? "scale-105 bg-brand-gradient text-primary-foreground shadow-pop"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate text-[10.5px] tracking-tight transition-colors duration-200",
                    active ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}

          {more.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-label={t("nav.more")}
              className="flex min-h-[52px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 outline-none transition-transform duration-150 active:scale-90"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-out",
                  moreActive || moreOpen
                    ? "scale-105 bg-brand-gradient text-primary-foreground shadow-pop"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <LayoutGrid className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
              </span>
              <span
                className={cn(
                  "text-[10.5px] tracking-tight transition-colors duration-200",
                  moreActive || moreOpen
                    ? "font-semibold text-primary"
                    : "font-medium text-muted-foreground"
                )}
              >
                {t("nav.more")}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* "Ko'proq" — iconli to'liq enli ro'yxat (bottom-sheet) */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("nav.more")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pb-1">
            {more.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl border p-3 transition-all duration-150 active:scale-[0.98]",
                    active
                      ? "border-primary/40 bg-accent"
                      : "border-border bg-card hover:bg-accent/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-brand-gradient text-primary-foreground shadow-pop"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium leading-tight",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

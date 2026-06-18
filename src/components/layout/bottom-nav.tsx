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
  MoreHorizontal,
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
      <div className="flex items-stretch justify-around gap-0.5 px-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-0.5 transition-transform duration-150 active:scale-90"
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
                  "max-w-full truncate text-[11px] tracking-tight transition-colors duration-200",
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
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-0.5 outline-none transition-transform duration-150 active:scale-90"
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 ease-out",
                moreActive || moreOpen
                  ? "scale-105 bg-brand-gradient text-primary-foreground shadow-pop"
                  : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive || moreOpen ? 2.4 : 2} />
            </span>
            <span
              className={cn(
                "text-[11px] tracking-tight transition-colors duration-200",
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

      {/* "Ko'proq" — app-drawer uslubidagi bottom-sheet */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("nav.more")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2.5 pb-1">
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
                    "flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all duration-150 active:scale-95",
                    active
                      ? "border-primary/40 bg-accent"
                      : "border-border bg-card hover:bg-accent/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                      active
                        ? "bg-brand-gradient text-primary-foreground shadow-pop"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium leading-tight",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

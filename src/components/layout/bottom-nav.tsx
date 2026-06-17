"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
    <div className="flex items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      {primary.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                active && "bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </Link>
        );
      })}

      {more.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("nav.more")}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 outline-none transition-colors",
                moreActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  moreActive && "bg-accent"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-medium">{t("nav.more")}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="mb-1 w-48">
            {more.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex cursor-pointer items-center gap-2",
                      isActive(item.href) && "text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {t(item.labelKey)}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

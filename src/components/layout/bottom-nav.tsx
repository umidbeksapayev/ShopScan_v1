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
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
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
}

// Telefon uchun maksimal 5 tugma: 4 asosiy + "Ko'proq" (qolganlari menyuda).
const primaryItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/catalog", labelKey: "nav.catalog", icon: Package },
  { href: "/sell", labelKey: "nav.sell", icon: ShoppingCart },
  { href: "/history", labelKey: "nav.history", icon: ReceiptText },
];

const moreItems: NavItem[] = [
  { href: "/customers", labelKey: "nav.customers", icon: Users },
  { href: "/purchases", labelKey: "nav.purchases", icon: PackagePlus },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: Truck },
  { href: "/reports", labelKey: "nav.report", icon: BarChart3 },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const more =
    profile?.role === "super_admin"
      ? [...moreItems, { href: "/admin", labelKey: "nav.admin", icon: ShieldCheck }]
      : moreItems;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const moreActive = more.some((m) => isActive(m.href));

  return (
    <div className="flex items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      {primaryItems.map((item) => {
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

      {/* Ko'proq — qolgan sahifalar menyuda */}
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
    </div>
  );
}

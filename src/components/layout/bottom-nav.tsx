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
  type LucideIcon,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const baseItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/catalog", labelKey: "nav.catalog", icon: Package },
  { href: "/sell", labelKey: "nav.sell", icon: ShoppingCart },
  { href: "/history", labelKey: "nav.history", icon: ReceiptText },
  { href: "/reports", labelKey: "nav.report", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const navItems =
    profile?.role === "super_admin"
      ? [...baseItems, { href: "/admin", labelKey: "nav.admin", icon: ShieldCheck }]
      : baseItems;

  return (
    <div className="flex items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                isActive && "bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </div>
  );
}

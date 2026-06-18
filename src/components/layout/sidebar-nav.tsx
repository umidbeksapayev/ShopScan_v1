"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  ScanLine,
  Users,
  PackagePlus,
  Truck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useMembership } from "@/hooks/use-membership";
import { useShop } from "@/hooks/use-shop";
import { cn } from "@/lib/utils";
import type { PermissionKey } from "@/types/database";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  perm?: PermissionKey | "owner";
}

const baseItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, perm: "view_reports" },
  { href: "/catalog", labelKey: "nav.products", icon: Package, perm: "manage_products" },
  { href: "/sell", labelKey: "nav.sell", icon: ShoppingCart },
  { href: "/history", labelKey: "nav.history", icon: ReceiptText },
  { href: "/customers", labelKey: "nav.customers", icon: Users, perm: "manage_debt" },
  { href: "/purchases", labelKey: "nav.purchases", icon: PackagePlus, perm: "purchase" },
  { href: "/suppliers", labelKey: "nav.suppliers", icon: Truck, perm: "purchase" },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3, perm: "view_reports" },
  { href: "/staff", labelKey: "nav.staff", icon: UserCog, perm: "owner" },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, perm: "owner" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: membership } = useMembership();
  const { data: shop } = useShop();
  const [signingOut, setSigningOut] = useState(false);

  const can = (item: NavItem) => {
    if (!item.perm) return true;
    if (!membership) return false;
    if (membership.role === "owner") return true;
    if (item.perm === "owner") return false;
    return membership.permissions[item.perm] === true;
  };

  const navItems = baseItems.filter(can);
  const items =
    profile?.role === "super_admin"
      ? [...navItems, { href: "/admin", labelKey: "nav.admin", icon: ShieldCheck }]
      : navItems;

  async function handleLogout() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        {shop?.logo_url ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
            <Image src={shop.logo_url} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-pop">
            <ScanLine className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">ShopScan</h1>
          <p className="text-xs text-muted-foreground">{t("common.tagline")}</p>
        </div>
      </div>

      {/* Navigatsiya */}
      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-gradient text-primary-foreground shadow-pop"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Chiqish */}
      <div className="px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {signingOut ? t("nav.loggingOut") : t("nav.logout")}
        </button>
      </div>
    </div>
  );
}

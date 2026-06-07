"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Bosh", icon: "📊" },
  { href: "/catalog", label: "Katalog", icon: "📦" },
  { href: "/sell", label: "Sotuv", icon: "🛒" },
  { href: "/history", label: "Tarix", icon: "📋" },
  { href: "/reports", label: "Hisobot", icon: "📈" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-around px-2 py-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg min-w-[56px] transition-colors ${
              isActive ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

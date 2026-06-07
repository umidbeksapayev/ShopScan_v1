"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/catalog", label: "Mahsulotlar", icon: "📦" },
  { href: "/sell", label: "Sotuv", icon: "🛒" },
  { href: "/history", label: "Tarix", icon: "📋" },
  { href: "/reports", label: "Hisobotlar", icon: "📈" },
  { href: "/settings", label: "Sozlamalar", icon: "⚙️" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-blue-600">ShopScan</h1>
        <p className="text-xs text-gray-400 mt-1">Aqlli Do&apos;kon Boshqaruvi</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <span className="text-lg">🚪</span>
          Chiqish
        </button>
      </div>
    </div>
  );
}

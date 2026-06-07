import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar — 1280px+ */}
      <aside className="hidden xl:flex w-64 flex-col bg-white border-r border-gray-200">
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 pb-20 xl:pb-4">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — < 1280px */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <BottomNav />
      </nav>
    </div>
  );
}

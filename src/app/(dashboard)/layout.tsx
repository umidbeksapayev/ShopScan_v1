import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { SyncStatus } from "@/components/layout/sync-status";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] bg-background">
      {/* Desktop sidebar — 1280px+ */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card xl:flex">
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <SyncStatus />
        <Topbar />
        <div className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto p-4 pb-24 sm:p-6 xl:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — < 1280px */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 shadow-[0_-4px_20px_-8px_rgba(17,20,45,0.12)] backdrop-blur-md xl:hidden">
        <BottomNav />
      </nav>
    </div>
  );
}

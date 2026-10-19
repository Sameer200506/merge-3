import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

/**
 * Dashboard layout — wraps all authenticated routes under /dashboard, /customers,
 * /pipeline, /projects, /tasks, /time, /payouts, /activity, /notifications, /search,
 * /settings. Provides the sidebar + topbar shell.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

import Sidebar from "@/components/mem/Sidebar";
import Topbar from "@/components/mem/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}




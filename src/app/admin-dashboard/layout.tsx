import "../globals.css";     // site base styles
import "./admin.css";        // admin-only styles

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import "../globals.css";     // base site css
import "./admin.css";        // admin-only css

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

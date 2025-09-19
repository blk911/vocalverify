"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/dashboard/invites", label: "Invites", icon: "📨" },
  { href: "/dashboard/groups", label: "Groups", icon: "👥" },
  { href: "/dashboard/network", label: "Network", icon: "🌐" },
  { href: "/dashboard/vaults", label: "Vaults", icon: "🔒" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  { href: "/dashboard/admin", label: "Admin", icon: "👑" },
  { href: "/dashboard/notices", label: "Notices", icon: "📢" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <img 
          src="/api/logo/insert" 
          alt="AM I HUMAN" 
          className="h-6 object-contain"
        />
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

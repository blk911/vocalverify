"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/bonds", label: "Trust Bonds" },
  { href: "/dashboard/units", label: "Trust Units" },
];

export default function TabsBar() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-slate-200 px-6">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              pathname === tab.href
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}




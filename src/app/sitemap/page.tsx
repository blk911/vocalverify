import Link from "next/link";

const routes = [
  { path: "/", title: "Home (redirects to /connect)" },
  { path: "/connect", title: "Connect" },
  // placeholder: enroll is referenced by client code but not implemented in repo
  { path: "/enroll", title: "Enroll (placeholder route referenced in client)" },
];

export default function SitemapPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sitemap</h1>
      <p className="text-sm text-gray-600 mb-4">Pages currently built in this app:</p>
      <ul className="space-y-2">
        {routes.map((r) => (
          <li key={r.path}>
            <Link href={r.path} className="text-blue-600 underline">
              {r.title} — <code className="text-xs text-gray-500">{r.path}</code>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-xs text-gray-500">
        <div>Note: API routes live under <code>/api/*</code> and are not listed here.</div>
      </div>
    </div>
  );
}

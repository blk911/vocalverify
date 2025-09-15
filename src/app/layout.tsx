export const metadata = { title: "Simple Next", description: "Minimal starter" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f7f7f8" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 24 }}>Simple Next</h1>
            <a href="/admin/status" style={{ fontSize: 12, color: "#666", textDecoration: "none" }}>
              System Status (admin)
            </a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

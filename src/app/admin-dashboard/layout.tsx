export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Admin Dashboard</title>
        <meta name="description" content="AM I HUMAN.net Admin Dashboard" />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f7f7f8" }}>
        {children}
      </body>
    </html>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Admin Dashboard</title>
        <meta name="description" content="AM I HUMAN.net Admin Dashboard" />
      </head>
      <body className="font-sans m-0 bg-gray-100">
        {children}
      </body>
    </html>
  );
}

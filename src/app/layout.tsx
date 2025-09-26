export const metadata = { title: "Simple Next", description: "Minimal starter" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f7f7f8" }}>
        {children}
      </body>
    </html>
  );
}

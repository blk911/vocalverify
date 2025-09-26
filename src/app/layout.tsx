export const metadata = { title: "Simple Next", description: "Minimal starter" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="font-sans m-0 bg-gray-50">
        {children}
      </body>
    </html>
  );
}

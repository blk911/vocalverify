export const metadata = { title: "Simple Next", description: "Minimal starter" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans m-0 bg-gray-100" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

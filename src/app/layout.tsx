import "./globals.css"; // must exist

export const metadata = {
  title: 'Simple Next',
  description: 'Minimal starter',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "AM I HUMAN.net",
  description: "Voice Bridge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
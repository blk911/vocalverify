export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <script src="https://cdn.tailwindcss.com"></script>
      {children}
    </div>
  );
}

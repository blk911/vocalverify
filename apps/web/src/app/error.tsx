'use client';
export default function Error({ error }: { error: Error }) {
  return (
    <main className="p-8">
      <h2>Something broke.</h2>
      <pre className="whitespace-pre-wrap text-sm">{error.message}</pre>
    </main>
  );
}

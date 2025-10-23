export default async function SelfTest() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "(unset)";
  let health = "n/a";
  try {
    const r = await fetch(`${base}/health`, { cache: "no-store" });
    health = `${r.status} ${await r.text()}`;
  } catch (e: any) {
    health = `ERR ${e.message}`;
  }
  return (
    <pre style={{ padding: 16 }}>
{`API_BASE = ${base}
API /health = ${health}
`}
    </pre>
  );
}

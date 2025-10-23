const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
export const runtime = "nodejs";
export async function GET() {
  const r = await fetch(`${API}/profile/anticipate`, { method: "GET" });
  return new Response(await r.text(), { status: r.status, headers: { "content-type":"application/json" }});
}

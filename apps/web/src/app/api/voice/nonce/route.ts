const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export async function POST() {
  if (API_BASE.includes(":3000")) {
    return new Response(
      JSON.stringify({ error: "API_BASE misconfigured (points to web:3000)" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
  const r = await fetch(`${API_BASE}/voice/nonce`, { method: "POST" });
  const j = await r.json();
  return Response.json(j);
}

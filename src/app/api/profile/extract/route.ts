export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const r = await fetch(`${API_BASE}/agents/run/profile-extract`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await r.json();

  // Guard response shape
  const ok =
    j?.preview &&
    typeof j.preview.summary === "string" &&
    Array.isArray(j.preview.anchors) &&
    typeof j.preview.confidence === "number";

  if (!ok) return new Response(JSON.stringify({ error: "invalid_preview" }), { status: 400 });
  return Response.json(j);
}
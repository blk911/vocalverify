const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const body = await req.json();
  const r = await fetch(`${API}/profile/artifacts`, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify(body)
  });
  return new Response(await r.text(), { status: r.status, headers: { "content-type":"application/json" }});
}

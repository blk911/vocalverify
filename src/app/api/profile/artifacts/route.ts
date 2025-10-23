export const runtime = 'nodejs';
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // TODO: write to DB; for now, pretend success
  return Response.json({ ok: true, stored: body?.preview ?? null });
}
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params?: Promise<{ id?: string }> }) {
  try {
    const params = await ctx?.params;
    const id = params?.id ?? "unknown";
    return new Response(JSON.stringify({ ok: true, id, messages: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    // This ensures you SEE the real error in the Next dev console
    console.error("GET /api/chat/thread/[id] failed:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

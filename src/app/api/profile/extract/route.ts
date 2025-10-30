export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain, prompt, answer } = body || {};
    
    if (typeof domain !== "string" || typeof prompt !== "string" || typeof answer !== "string") {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400 });
    }

    // Mock response for single Next.js app (no external API server)
    const mockResponse = {
      ok: true,
      preview: {
        summary: "Mother taught by example; first copied biscuits.",
        anchors: ["Cooking", "Biscuits", "Observation"],
        confidence: 0.92,
      },
    };

    return Response.json(mockResponse);
  } catch (error: any) {
    console.error('Profile extract error:', error);
    return new Response(JSON.stringify({ error: "server_error" }), { status: 500 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let method = "none", ok = false, starts = false, ends = false;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      method = "file";
      const fs = await import("node:fs/promises");
      const raw = await fs.readFile(process.env.FIREBASE_SERVICE_ACCOUNT_PATH!, "utf8");
      const svc = JSON.parse(raw);
      const k = String(svc?.private_key || "");
      const norm = k.replace(/\\n/g, "\n").replace(/\r\n?/g, "\n").trim();
      starts = norm.startsWith("-----BEGIN");
      ends = norm.endsWith("-----END PRIVATE KEY-----");
      ok = starts && ends;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      method = "json-env";
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      const k = String(svc?.private_key || "");
      const norm = k.replace(/\\n/g, "\n").replace(/\r\n?/g, "\n").trim();
      starts = norm.startsWith("-----BEGIN");
      ends = norm.endsWith("-----END PRIVATE KEY-----");
      ok = starts && ends;
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      method = "legacy-env";
      const k = String(process.env.FIREBASE_PRIVATE_KEY);
      const norm = k.replace(/\\n/g, "\n").replace(/\r\n?/g, "\n").trim();
      starts = norm.startsWith("-----BEGIN");
      ends = norm.endsWith("-----END PRIVATE KEY-----");
      ok = starts && ends;
    }
  } catch (e: any) {
    return Response.json({ ok: false, method, error: String(e?.message || e) });
  }
  return Response.json({ ok, method, startsWithBegin: starts, endsWithEnd: ends });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db, bucket, firebaseCredSource } from "@/lib/firebaseAdmin";

type Check = { name: string; ok: boolean; info?: string; error?: string };

export async function GET() {
  const results: Check[] = [];
  results.push({ name: "Credential source", ok: true, info: firebaseCredSource });

  // Env
  const miss = ["FIREBASE_STORAGE_BUCKET"].filter(k => !(process.env as any)[k]);
  results.push({ name: "Env vars", ok: miss.length === 0, info: miss.length ? `Missing: ${miss.join(", ")}` : "All present" });

  // Firestore
  try {
    const ref = db.collection("_selftest").doc();
    await ref.set({ ts: Date.now() });
    const snap = await ref.get();
    await ref.delete();
    results.push({ name: "Firestore write/read/delete", ok: snap.exists, info: "Round-trip OK" });
  } catch (e: any) {
    results.push({ name: "Firestore write/read/delete", ok: false, error: String(e?.message || e) });
  }

  // Storage
  try {
    const p = `_selftest/${Date.now()}.txt`;
    const f = bucket.file(p);
    await f.save("ok", { resumable: false, validation: false, metadata: { contentType: "text/plain" } });
    await f.delete();
    results.push({ name: "Storage write/delete", ok: true, info: "GCS round-trip OK" });
  } catch (e: any) {
    results.push({ name: "Storage write/delete", ok: false, error: String(e?.message || e) });
  }

  const ok = results.every(r => r.ok);
  return Response.json({ ok, ts: Date.now(), results });
}

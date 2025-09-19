export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { bucket } from "@/lib/firebaseAdmin";

function badRequest(body: any) {
	return Response.json(body, { status: 400 });
}

export async function POST(req: Request) {
	try {
		const ct = req.headers.get("content-type") || "";
		if (!ct.includes("application/json")) {
			return badRequest({ ok: false, error: "Expected application/json", code: "BAD_CONTENT_TYPE" });
		}
		const { uploadId, userId } = await req.json().catch(() => ({}));
		if (!uploadId || !userId) return badRequest({ ok: false, error: "Missing uploadId or userId", code: "MISSING_FIELDS" });

		const tmpPath = `voices/tmp/${uploadId}.webm`;
		const finalPath = `voices/final/${userId}.webm`;
		const tmpFile = bucket.file(tmpPath);
		const finalFile = bucket.file(finalPath);

		const [exists] = await tmpFile.exists();
		if (!exists) return badRequest({ ok: false, error: "Upload not found", code: "NOT_FOUND" });

		await tmpFile.move(finalPath);

		// Score stub 0.90 - 0.99
		const score = Math.round((0.90 + Math.random() * 0.09) * 1000) / 1000;
		const passed = score >= 0.95;

		// Cleanup: delete any leftover tmp file (should be moved, but guard)
		try { await tmpFile.delete({ ignoreNotFound: true } as any); } catch {}

		return Response.json({ ok: true, score, passed });
	} catch (e: any) {
		return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
	}
}


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

		// Move file from temporary to permanent storage
		const tempPath = `voices/tmp/${uploadId}.webm`;
		const finalPath = `voices/final/${userId}.webm`;

		try {
			// Check if temp file exists
			const tempFile = bucket.file(tempPath);
			const [exists] = await tempFile.exists();
			
			if (!exists) {
				return Response.json({ 
					ok: false, 
					error: "Upload not found", 
					code: "UPLOAD_NOT_FOUND" 
				}, { status: 404 });
			}

			// Move file to final location
			const finalFile = bucket.file(finalPath);
			await tempFile.move(finalFile);

			// Clean up temp file (move already deletes source)
			console.log("Voice file committed to permanent storage", { 
				uploadId, 
				userId, 
				tempPath, 
				finalPath 
			});

			// Score stub 0.90 - 0.99 (can be replaced with real voice analysis)
			const score = Math.round((0.90 + Math.random() * 0.09) * 1000) / 1000;
			const passed = score >= 0.95;

			return Response.json({ 
				ok: true, 
				score, 
				passed,
				finalPath,
				message: "Voice processing completed and stored permanently"
			});
		} catch (storageError) {
			console.error("Firebase Storage commit error:", storageError);
			return Response.json({ 
				ok: false, 
				error: "Firebase Storage commit failed", 
				code: "STORAGE_ERROR" 
			}, { status: 500 });
		}
	} catch (e: any) {
		return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
	}
}


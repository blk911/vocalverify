export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const method = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? "file"
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? "json-env"
    : process.env.FIREBASE_PRIVATE_KEY
    ? "legacy-env"
    : "none";

  return Response.json({
    method,
    filePath: method === "file" ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH : null,
    hasBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
  });
}

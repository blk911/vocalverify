// src/lib/api.ts
import { NextRequest, NextResponse } from "next/server";

export type H = (req: NextRequest) => Promise<NextResponse>;

export function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, issues?: any) {
  return json({ ok: false, error: message, issues }, 400);
}

export function wrap(handler: H): H {
  return async (req) => {
    try {
      return await handler(req);
    } catch (err: any) {
      console.error("🔥 API Error in", req.url, err);
      const msg = err?.message ?? "Internal Server Error";
      const stack = process.env.NODE_ENV !== "production" ? err?.stack : undefined;
      return json({ ok: false, error: msg, stack }, 500);
    }
  };
}

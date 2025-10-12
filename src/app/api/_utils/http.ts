import { NextResponse } from "next/server";

/**
 * HTTP utility helpers for consistent API responses
 */

export function ok(data: any, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(error: any, status = 500) {
  const message = error?.message || "An error occurred";
  const code = error?.code || "SERVER_ERROR";
  
  console.error("[API Error]", { message, code, error });
  
  return NextResponse.json(
    { 
      ok: false, 
      error: message,
      code 
    }, 
    { status }
  );
}

export function bad(message: string, code = "BAD_REQUEST", status = 400) {
  return NextResponse.json(
    { 
      ok: false, 
      error: message,
      code 
    }, 
    { status }
  );
}

export function notFound(message = "Resource not found") {
  return NextResponse.json(
    { 
      ok: false, 
      error: message,
      code: "NOT_FOUND" 
    }, 
    { status: 404 }
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(
    { 
      ok: false, 
      error: message,
      code: "UNAUTHORIZED" 
    }, 
    { status: 401 }
  );
}












import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";         // needed for firebase-admin
export const dynamic = "force-dynamic";  // avoid edge caching

export async function POST() {
  console.log('Voice init API called - generating upload ID');
  
  // Generate unique upload ID
  const uploadId = randomUUID();
  
  console.log('Generated upload ID:', uploadId);
  
  return NextResponse.json({ uploadId });
}

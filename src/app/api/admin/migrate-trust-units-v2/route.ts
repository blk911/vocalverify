/**
 * API Endpoint: Migrate Trust Units to V2 Clean Design
 * 
 * Usage:
 * - Dry run: POST /api/admin/migrate-trust-units-v2?dryRun=true
 * - Apply: POST /api/admin/migrate-trust-units-v2?dryRun=false
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanTrustUnitsV2 } from "@/lib/migrations/cleanTrustUnitsV2";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get('dryRun') !== 'false'; // Default: true

  try {
    console.log(`[MIGRATION-API] Starting Trust Units V2 migration (dryRun: ${dryRun})`);
    const result = await cleanTrustUnitsV2(dryRun);
    
    return NextResponse.json({ 
      ok: true, 
      message: dryRun ? "Dry run complete" : "Migration complete",
      result 
    });
  } catch (error: any) {
    console.error("[MIGRATION-API] Error during migration:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 });
  }
}












/**
 * Admin API: Run rootSponsorId + depth migration
 *
 * Query params:
 * - dryRun=true (default) → just simulate, don't write
 * - dryRun=false → actually update database
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrateAddRootSponsorFields } from '@/lib/migrations/addRootSponsorFields';

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [ADMIN] Migration request received');

    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') !== 'false';

    console.log(`🚀 [ADMIN] Starting migration (dryRun=${dryRun})`);

    const result = await migrateAddRootSponsorFields(dryRun);

    return NextResponse.json({
      ok: true,
      dryRun,
      ...result,
    });
  } catch (error: any) {
    console.error('❌ [ADMIN] Migration failed:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

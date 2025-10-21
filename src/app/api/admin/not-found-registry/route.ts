import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // Get not found registry from Firestore
    const notFoundSnapshot = await db
      .collection('notFoundRegistry')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const notFound: any[] = [];
    notFoundSnapshot.docs.forEach(doc => {
      notFound.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({
      ok: true,
      notFound: notFound,
      count: notFound.length,
    });
  } catch (error: any) {
    console.error('Error fetching not found registry:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch not found registry' },
      { status: 500 }
    );
  }
}

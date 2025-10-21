import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export const GET = async (req: Request) => {
  try {
    const db = getDb();

    // Test basic write operation
    const testDoc = await db.collection('test').add({
      message: 'Firestore connection test',
      timestamp: new Date(),
    });

    // Test basic read operation
    const testSnapshot = await db.collection('test').doc(testDoc.id).get();

    return NextResponse.json({
      ok: true,
      message: 'Firestore connection successful',
      testDocId: testDoc.id,
      testData: testSnapshot.data(),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Firestore connection failed',
        details: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};



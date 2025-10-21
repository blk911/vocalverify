import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function DELETE(request: NextRequest) {
  try {
    const { bondId } = await request.json();

    if (!bondId) {
      return NextResponse.json(
        { error: 'Bond ID is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Delete the Trust Bond
    await db.collection('trustBonds').doc(bondId).delete();

    // Also delete any associated Trust Connection
    const connectionsSnapshot = await db
      .collection('trustConnections')
      .where('bondId', '==', bondId)
      .get();

    const batch = db.batch();
    connectionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ Deleted Trust Bond ${bondId}`);

    return NextResponse.json({
      ok: true,
      message: `Trust Bond ${bondId} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Error deleting Trust Bond:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete Trust Bond',
      },
      { status: 500 }
    );
  }
}

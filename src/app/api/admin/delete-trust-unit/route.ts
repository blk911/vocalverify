import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function DELETE(request: NextRequest) {
  try {
    const { unitId } = await request.json();
    
    if (!unitId) {
      return NextResponse.json({ error: 'Unit ID is required' }, { status: 400 });
    }

    const db = getDb();
    
    // Delete the Trust Unit
    await db.collection('trustUnits').doc(unitId).delete();
    
    // Remove from all users' trustUnits arrays
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.trustUnits && userData.trustUnits.includes(unitId)) {
        const updatedTrustUnits = userData.trustUnits.filter((id: string) => id !== unitId);
        batch.update(doc.ref, { trustUnits: updatedTrustUnits });
      }
    });
    
    await batch.commit();
    
    console.log(`✅ Deleted Trust Unit ${unitId}`);
    
    return NextResponse.json({ 
      ok: true, 
      message: `Trust Unit ${unitId} deleted successfully` 
    });
    
  } catch (error: any) {
    console.error('Error deleting Trust Unit:', error);
    return NextResponse.json({ 
      error: 'Failed to delete Trust Unit' 
    }, { status: 500 });
  }
}




import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ vaultId: string }> }) {
  try {
    const { vaultId } = await params;
    const { searchParams } = new URL(req.url);
    const memberCode = searchParams.get('memberCode');

    console.log('🔍 [VAULT-MESSAGES] Request:', { vaultId, memberCode });

    if (!vaultId || !memberCode) {
      console.log('❌ [VAULT-MESSAGES] Missing required params');
      return NextResponse.json(
        { ok: false, error: 'Vault ID and member code are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify vault exists and user has access
    const vaultDoc = await db.collection('vaults').doc(vaultId).get();
    
    if (!vaultDoc.exists) {
      console.log('❌ [VAULT-MESSAGES] Vault not found:', vaultId);
      return NextResponse.json(
        { ok: false, error: 'Vault not found' },
        { status: 404 }
      );
    }

    const vaultData = vaultDoc.data();
    console.log('🔍 [VAULT-MESSAGES] Vault data:', vaultData);
    
    const hasAccess = vaultData?.participants?.includes(memberCode);
    console.log('🔍 [VAULT-MESSAGES] Access check:', { 
      participants: vaultData?.participants, 
      memberCode, 
      hasAccess 
    });
    
    if (!hasAccess) {
      console.log('❌ [VAULT-MESSAGES] Access denied');
      return NextResponse.json(
        { ok: false, error: 'Access denied to vault' },
        { status: 403 }
      );
    }

    // Get messages for this vault
    const messagesSnapshot = await db
      .collection('messages')
      .where('vaultId', '==', vaultId)
      .orderBy('timestamp', 'asc')
      .get();

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      message: doc.data().message,
      memberCode: doc.data().memberCode,
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().createdAt,
      threadId: doc.data().threadId,
    }));

    console.log(`[VAULT-MESSAGES] Loaded ${messages.length} messages for vault ${vaultId}`);

    return NextResponse.json({
      ok: true,
      vaultId,
      messages,
      count: messages.length,
    });
  } catch (error: any) {
    console.error('Get vault messages error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to get vault messages' },
      { status: 500 }
    );
  }
}
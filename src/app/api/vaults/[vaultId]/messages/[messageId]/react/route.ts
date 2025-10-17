import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vaultId: string; messageId: string }> }
) {
  try {
    const { vaultId, messageId } = await params;
    const body = await request.json();
    const { userId, reaction } = body;

    if (!userId || !reaction) {
      return NextResponse.json({ 
        ok: false, 
        error: 'User ID and reaction are required' 
      }, { status: 400 });
    }

    // Verify user has access to this vault
    const db = getDb();
    const vaultDoc = await db.collection('vaults').doc(vaultId).get();
    if (!vaultDoc.exists) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Vault not found' 
      }, { status: 404 });
    }

    const vaultData = vaultDoc.data();
    if (!vaultData?.participants?.includes(userId)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Get the message
    const messageRef = db.collection('vaults')
      .doc(vaultId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Message not found' 
      }, { status: 404 });
    }

    const messageData = messageDoc.data();
    const currentReactions = messageData?.reactions || {};

    // Update reaction
    if (reaction === 'remove') {
      delete currentReactions[userId];
    } else {
      currentReactions[userId] = reaction;
    }

    // Update the message
    await messageRef.update({
      reactions: currentReactions
    });

    return NextResponse.json({
      ok: true,
      reactions: currentReactions,
      message: 'Reaction updated successfully'
    });

  } catch (error) {
    console.error('Error updating reaction:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Failed to update reaction' 
    }, { status: 500 });
  }
}

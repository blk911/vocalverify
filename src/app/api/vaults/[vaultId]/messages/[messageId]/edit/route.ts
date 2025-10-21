import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vaultId: string; messageId: string }> }
) {
  try {
    const { vaultId, messageId } = await params;
    const body = await request.json();
    const { userId, content } = body;

    if (!userId || !content) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User ID and content are required',
        },
        { status: 400 }
      );
    }

    // Verify user has access to this vault
    const db = getDb();
    const vaultDoc = await db.collection('vaults').doc(vaultId).get();
    if (!vaultDoc.exists) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Vault not found',
        },
        { status: 404 }
      );
    }

    const vaultData = vaultDoc.data();
    if (!vaultData?.participants?.includes(userId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Access denied',
        },
        { status: 403 }
      );
    }

    // Get the message
    const messageRef = db
      .collection('vaults')
      .doc(vaultId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Message not found',
        },
        { status: 404 }
      );
    }

    const messageData = messageDoc.data();

    // Verify user is the sender
    if (messageData?.senderId !== userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Only message sender can edit',
        },
        { status: 403 }
      );
    }

    // Update the message
    await messageRef.update({
      content,
      editedAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      message: 'Message updated successfully',
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to edit message',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vaultId: string }> }
) {
  try {
    const { vaultId } = await params;
    const { searchParams } = new URL(request.url);
    const memberCode = searchParams.get('memberCode');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!memberCode) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Member code is required',
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
    if (!vaultData?.participants?.includes(memberCode)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Access denied',
        },
        { status: 403 }
      );
    }

    // Get messages for this vault
    const messagesSnapshot = await db
      .collection('vaults')
      .doc(vaultId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const messages = [];

    for (const doc of messagesSnapshot.docs) {
      const messageData = doc.data();

      // Get sender details
      let senderDetails = null;
      try {
        const senderDoc = await db
          .collection('members')
          .doc(messageData.senderId)
          .get();
        if (senderDoc.exists) {
          const senderData = senderDoc.data();
          senderDetails = {
            memberCode: messageData.senderId,
            name: senderData?.name || senderData?.displayName || 'Unknown',
            profilePicture: senderData?.profilePicture || null,
          };
        }
      } catch (error) {
        console.error(`Error fetching sender ${messageData.senderId}:`, error);
      }

      messages.push({
        id: doc.id,
        senderId: messageData.senderId,
        senderDetails,
        messageType: messageData.messageType || 'text',
        content: messageData.content,
        mediaUrl: messageData.mediaUrl || null,
        reactions: messageData.reactions || {},
        editedAt: messageData.editedAt || null,
        deletedAt: messageData.deletedAt || null,
        createdAt: messageData.createdAt,
        vaultId,
      });
    }

    // Reverse to get chronological order
    messages.reverse();

    return NextResponse.json({
      ok: true,
      messages,
      count: messages.length,
      vaultId,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch messages',
      },
      { status: 500 }
    );
  }
}

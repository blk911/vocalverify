import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vaultId: string }> }
) {
  try {
    const { vaultId } = await params;
    const body = await request.json();
    const { senderId, content, messageType = 'text', mediaUrl = null } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Sender ID and content are required',
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
    if (!vaultData?.participants?.includes(senderId)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Access denied',
        },
        { status: 403 }
      );
    }

    // Create message
    const messageData = {
      senderId,
      messageType,
      content,
      mediaUrl,
      reactions: {},
      createdAt: new Date(),
      vaultId,
    };

    // Add message to vault's messages subcollection
    const messageRef = await db
      .collection('vaults')
      .doc(vaultId)
      .collection('messages')
      .add(messageData);

    // Update vault's lastActivity and messageCount
    await db
      .collection('vaults')
      .doc(vaultId)
      .update({
        lastActivity: new Date(),
        messageCount: (vaultData.messageCount || 0) + 1,
      });

    // Get sender details for response
    let senderDetails = null;
    try {
      const senderDoc = await db.collection('members').doc(senderId).get();
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        senderDetails = {
          memberCode: senderId,
          name: senderData?.name || senderData?.displayName || 'Unknown',
          profilePicture: senderData?.profilePicture || null,
        };
      }
    } catch (error) {
      console.error(`Error fetching sender ${senderId}:`, error);
    }

    return NextResponse.json({
      ok: true,
      message: {
        id: messageRef.id,
        senderId,
        senderDetails,
        messageType,
        content,
        mediaUrl,
        reactions: {},
        createdAt: messageData.createdAt,
        vaultId,
      },
      messageId: messageRef.id,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to send message',
      },
      { status: 500 }
    );
  }
}

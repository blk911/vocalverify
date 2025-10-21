import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vaultId: string }> }
) {
  try {
    const { vaultId } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const senderId = formData.get('senderId') as string;
    const messageType = (formData.get('messageType') as string) || 'file';

    if (!file || !senderId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'File and sender ID are required',
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

    // Validate file type and size
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'File type not allowed',
        },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          ok: false,
          error: 'File too large (max 10MB)',
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(
      process.cwd(),
      'public',
      'uploads',
      'vaults',
      vaultId
    );
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/vaults/${vaultId}/${fileName}`;

    // Create message with media
    const messageData = {
      senderId,
      messageType,
      content: file.name,
      mediaUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
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
      const senderDoc = await db.collection('users').doc(senderId).get();
      if (senderDoc.exists) {
        const senderData = senderDoc.data();
        senderDetails = {
          memberCode: senderId,
          name: senderData?.name || senderData?.fullName || 'Unknown',
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
        content: file.name,
        mediaUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        reactions: {},
        createdAt: messageData.createdAt,
        vaultId,
      },
      messageId: messageRef.id,
      mediaUrl: publicUrl,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}

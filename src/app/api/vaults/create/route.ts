import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, participantId, vaultType = 'chat', tuId = null } = body;

    if (!creatorId || !participantId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Creator ID and participant ID are required',
        },
        { status: 400 }
      );
    }

    // Validate that creator and participant exist
    const db = getDb();
    const [creatorDoc, participantDoc] = await Promise.all([
      db.collection('users').doc(creatorId).get(),
      db.collection('users').doc(participantId).get(),
    ]);

    if (!creatorDoc.exists) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Creator not found',
        },
        { status: 404 }
      );
    }

    if (!participantDoc.exists) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Participant not found',
        },
        { status: 404 }
      );
    }

    // Check if vault already exists between these participants
    const existingVaultSnapshot = await db
      .collection('vaults')
      .where('participants', 'array-contains', creatorId)
      .where('type', '==', tuId ? 'tu' : 'personal')
      .get();

    for (const doc of existingVaultSnapshot.docs) {
      const vaultData = doc.data();
      if (vaultData.participants.includes(participantId)) {
        // Vault already exists
        return NextResponse.json({
          ok: true,
          vaultId: doc.id,
          message: 'Vault already exists',
          existing: true,
        });
      }
    }

    // Create new vault
    const participants = tuId
      ? // For TU vaults, get all TU members
        await getTUMembers(tuId)
      : [creatorId, participantId];

    console.log('🏗️ Creating vault with participants:', participants);

    const vaultData = {
      type: tuId ? 'tu' : 'personal',
      creatorId,
      participants,
      tuId: tuId || null,
      vaultType, // chat, video, share
      status: 'active',
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
    };

    const vaultRef = await db.collection('vaults').add(vaultData);

    return NextResponse.json({
      ok: true,
      vaultId: vaultRef.id,
      vault: {
        id: vaultRef.id,
        ...vaultData,
      },
      message: 'Vault created successfully',
    });
  } catch (error) {
    console.error('Error creating vault:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create vault',
      },
      { status: 500 }
    );
  }
}

// Helper function to get TU members
async function getTUMembers(tuId: string): Promise<string[]> {
  try {
    const db = getDb();
    const tuDoc = await db.collection('trustUnits').doc(tuId).get();
    if (tuDoc.exists) {
      const tuData = tuDoc.data();
      const memberCodes = tuData?.memberCodes || [];
      // Remove duplicates and return unique member codes
      const uniqueMembers = [...new Set(memberCodes)] as string[];
      console.log('👥 TU Members for vault:', uniqueMembers);
      return uniqueMembers;
    }
    return [];
  } catch (error) {
    console.error('Error fetching TU members:', error);
    return [];
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();

    // Create sample vault
    const vaultData = {
      name: 'Spencer & Ash Vault',
      description: 'Private conversation between Spencer and Ash',
      members: [
        { memberCode: 'demo', name: 'Spencer Wendt', role: 'owner' },
        { memberCode: 'ash123', name: 'Ash Johnson', role: 'member' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const vaultRef = await db.collection('vaults').add(vaultData);
    console.log('[SEED] Created vault:', vaultRef.id);

    // Create sample thread
    const threadData = {
      vaultId: vaultRef.id,
      memberCode: 'demo',
      title: 'Spencer & Ash Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 3,
    };

    const threadRef = await db.collection('threads').add(threadData);
    console.log('[SEED] Created thread:', threadRef.id);

    // Create sample messages
    const messages = [
      {
        threadId: threadRef.id,
        vaultId: vaultRef.id,
        message: 'Hey Ash! How are you doing today?',
        memberCode: 'demo',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        threadId: threadRef.id,
        vaultId: vaultRef.id,
        message: 'Hi Spencer! I\'m doing great, thanks for asking. How about you?',
        memberCode: 'ash123',
        timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
        createdAt: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        threadId: threadRef.id,
        vaultId: vaultRef.id,
        message: 'I\'m doing well too! Just working on some new features for our app.',
        memberCode: 'demo',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      }
    ];

    for (const messageData of messages) {
      await db.collection('messages').add(messageData);
    }

    console.log('[SEED] Created messages:', messages.length);

    // Create sample trust bond
    const bondData = {
      fromMemberCode: 'demo',
      toMemberCode: 'ash123',
      fromMemberName: 'Spencer Wendt',
      toMemberName: 'Ash Johnson',
      status: 'accepted',
      message: 'We trust each other completely',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bondRef = await db.collection('trustBonds').add(bondData);
    console.log('[SEED] Created trust bond:', bondRef.id);

    // Create sample trust unit
    const unitData = {
      name: 'Spencer & Ash Unit',
      description: 'Our private trust unit',
      members: [
        { memberCode: 'demo', name: 'Spencer Wendt', status: 'active' },
        { memberCode: 'ash123', name: 'Ash Johnson', status: 'active' }
      ],
      creatorCode: 'demo',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const unitRef = await db.collection('trustUnits').add(unitData);
    console.log('[SEED] Created trust unit:', unitRef.id);

    return NextResponse.json({
      ok: true,
      message: 'Sample data created successfully',
      data: {
        vaultId: vaultRef.id,
        threadId: threadRef.id,
        messageCount: messages.length,
        bondId: bondRef.id,
        unitId: unitRef.id,
      }
    });
  } catch (error: any) {
    console.error('Seed sample data error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create sample data' },
      { status: 500 }
    );
  }
}


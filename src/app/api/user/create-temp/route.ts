import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, message } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Create temporary member
    const tempMemberData = {
      name: name.trim(),
      phone: phone.trim(),
      message: message || "Hello! You've been invited to join our network.",
      sponsorId: '0000000000',
      sponsorName: 'Admin',
      status: 'temp',
      createdAt: new Date().toISOString(),
      tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const docRef = await db.collection('tempMembers').add(tempMemberData);

    return NextResponse.json({
      ok: true,
      message: 'Temporary member created successfully',
      tempMember: {
        id: docRef.id,
        ...tempMemberData,
      },
    });
  } catch (error: any) {
    console.error('Error creating temporary member:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create temporary member' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    
    // Create demo user in Firestore
    const demoUserData = {
      name: 'Demo User',
      fullName: 'Demo User',
      phone: '555-0123',
      memberCode: 'demo',
      email: 'demo@amihuman.net',
      profilePicture: '',
      hasVoice: false,
      status: 'demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Profile completion steps
      profileSteps: {
        primaryVoice: false,
        profileConfirm: true,
        phoneVoice: false,
      },
      currentStep: 1,
      // Sponsor fields (demo user has no sponsor)
      sponsorId: null,
      sponsorName: null,
      sponsorMemberCode: null,
      sponsorProfilePicture: null,
    };

    // Create demo user document
    await db.collection('users').doc('demo').set(demoUserData);

    return NextResponse.json({
      ok: true,
      message: 'Demo user created successfully',
      demoUser: demoUserData,
    });
  } catch (error: any) {
    console.error('Create demo user error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create demo user' },
      { status: 500 }
    );
  }
}


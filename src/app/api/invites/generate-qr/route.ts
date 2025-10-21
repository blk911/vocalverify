import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getDb } from '@/lib/firebaseAdmin';
// import { uploadQRCode } from '@/lib/firebaseStorage';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔥🔥🔥 [QR-GENERATE] API CALLED 🔥🔥🔥');

    const body = await request.json();
    const { inviteId, inviteeName, inviteePhone, inviterName, inviterCode } =
      body;

    console.log('[QR-GENERATE] Request:', {
      inviteId,
      inviteeName,
      inviteePhone,
      inviterName,
      inviterCode,
    });

    if (!inviteId) {
      console.log('[QR-GENERATE] ❌ Missing inviteId');
      return NextResponse.json({ error: 'Missing inviteId' }, { status: 400 });
    }

    // Skip invite verification for now - just generate QR code
    console.log('[QR-GENERATE] Generating QR code for invite:', inviteId);

    // Generate QR code data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrData = `${baseUrl}/connect?invite=${inviteId}`;

    console.log('[QR-GENERATE] QR data:', qrData);

    // Generate QR code image buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    console.log(
      '[QR-GENERATE] QR code buffer generated, size:',
      qrCodeBuffer.length
    );

    // Use base64 for now (Firebase Storage needs real API key)
    console.log(
      '[QR-GENERATE] Using base64 QR code (Firebase Storage disabled)'
    );
    const base64Image = qrCodeBuffer.toString('base64');
    const qrCodeUrl = `data:image/png;base64,${base64Image}`;

    // Skip Firestore update for now - just return QR code
    console.log('[QR-GENERATE] QR code generated, skipping Firestore update');

    console.log('[QR-GENERATE] ✅ QR code generated successfully');

    return NextResponse.json({
      success: true,
      qrCodeUrl: qrCodeUrl,
      qrData: qrData,
      alreadyExists: false,
    });
  } catch (error) {
    console.error('[QR-GENERATE] ❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate QR code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');

    if (!inviteId) {
      return NextResponse.json({ error: 'Missing inviteId' }, { status: 400 });
    }

    const db = getDb();
    const inviteDoc = await db.collection('invites').doc(inviteId).get();

    if (!inviteDoc.exists) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const inviteData = inviteDoc.data();

    return NextResponse.json({
      success: true,
      qrCodeUrl: inviteData?.qrCodeUrl || null,
      qrGeneratedAt: inviteData?.qrGeneratedAt || null,
      hasQRCode: !!inviteData?.qrCodeUrl,
    });
  } catch (error) {
    console.error('[QR-GENERATE] ❌ GET Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get QR code info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

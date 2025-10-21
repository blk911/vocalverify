import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST-QR] Testing QR code generation...');

    // Generate simple QR code
    const qrData = 'https://example.com/test';
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    const base64Image = qrCodeBuffer.toString('base64');
    const qrCodeUrl = `data:image/png;base64,${base64Image}`;

    console.log('[TEST-QR] ✅ QR code generated successfully');

    return NextResponse.json({
      success: true,
      qrCodeUrl: qrCodeUrl,
      qrData: qrData,
      bufferSize: qrCodeBuffer.length,
    });
  } catch (error) {
    console.error('[TEST-QR] ❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate test QR code',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



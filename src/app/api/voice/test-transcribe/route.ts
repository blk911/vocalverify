import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { audioData } = await req.json();

    if (!audioData) {
      return NextResponse.json(
        { ok: false, error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Mock transcription response
    const transcription = {
      text: 'This is a test transcription',
      confidence: 0.95,
      language: 'en-US',
      duration: 5.2,
    };

    return NextResponse.json({
      ok: true,
      transcription: transcription,
      message: 'Transcription test completed successfully',
    });
  } catch (error: any) {
    console.error('Error testing transcription:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to test transcription' },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { voiceAuthBenchmark } from "@/lib/benchmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log('🚀 Starting comprehensive benchmark...');
    
    const benchmark = await voiceAuthBenchmark.runCompleteBenchmark();
    
    console.log('✅ Benchmark complete!');
    console.log(`📊 Overall Score: ${benchmark.overallScore.toFixed(1)}/100`);
    
    return NextResponse.json({
      ok: true,
      benchmark,
      report: voiceAuthBenchmark.getReport(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Benchmark error:', error);
    return NextResponse.json({
      ok: false,
      error: "Benchmark failed",
      details: error.message
    }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { voiceAuthBenchmark } from "@/lib/benchmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const benchmark = await voiceAuthBenchmark.runCompleteBenchmark();
    
    }/100`);
    
    return NextResponse.json({
      ok: true,
      benchmark,
      report: voiceAuthBenchmark.getReport(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: "Benchmark failed",
      details: error.message
    }, { status: 500 });
  }
}

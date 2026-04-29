import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { name, description, language, topics } = await req.json();
    const analysis = await analyzeRepo(name, description, language, topics ?? []);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("AI analyze error:", err);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

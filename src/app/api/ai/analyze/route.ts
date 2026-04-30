import { NextRequest, NextResponse } from "next/server";
import { analyzeReposBatch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { repos } = await req.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ error: "repos array required" }, { status: 400 });
    }
    const results = await analyzeReposBatch(repos);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("AI analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

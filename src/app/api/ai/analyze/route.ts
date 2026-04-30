import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeReposBatch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

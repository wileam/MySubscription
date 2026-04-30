import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchUserRepos, PER_PAGE } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Number(req.nextUrl.searchParams.get("page") ?? "2");

  try {
    const repos = await fetchUserRepos(session.accessToken, page);
    return NextResponse.json({
      repos,
      hasMore: repos.length === PER_PAGE,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}

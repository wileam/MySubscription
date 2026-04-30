"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { GitHubRepo } from "@/lib/github";
import { AIAnalysis } from "@/lib/ai";
import ItemCard from "./ItemCard";
import FilterBar from "./FilterBar";

type AnalysisState = { status: "loading" } | { status: "done"; data: AIAnalysis } | { status: "error" };

async function analyzeRepos(repos: GitHubRepo[]): Promise<Record<number, AnalysisState>> {
  try {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repos: repos.map((r) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          topics: r.topics,
        })),
      }),
    });
    const { results } = await res.json();
    return Object.fromEntries(
      repos.map((repo, i) => [
        repo.id,
        results[i] ? { status: "done" as const, data: results[i] } : { status: "error" as const },
      ])
    );
  } catch {
    return Object.fromEntries(repos.map((r) => [r.id, { status: "error" as const }]));
  }
}

export default function DashboardClient({
  initialRepos,
  initialHasMore,
}: {
  initialRepos: GitHubRepo[];
  initialHasMore: boolean;
}) {
  const [repos, setRepos] = useState(initialRepos);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [analysisMap, setAnalysisMap] = useState<Record<number, AnalysisState>>(
    Object.fromEntries(initialRepos.map((r) => [r.id, { status: "loading" as const }]))
  );

  useEffect(() => {
    analyzeRepos(initialRepos).then((map) =>
      setAnalysisMap((prev) => ({ ...prev, ...map }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/github/items?page=${page + 1}`);
      const { repos: newRepos, hasMore: more } = await res.json();

      setRepos((prev) => [...prev, ...newRepos]);
      setHasMore(more);
      setPage((p) => p + 1);

      // mark new repos as loading then analyze
      setAnalysisMap((prev) => ({
        ...prev,
        ...Object.fromEntries(newRepos.map((r: GitHubRepo) => [r.id, { status: "loading" as const }])),
      }));
      const newMap = await analyzeRepos(newRepos);
      setAnalysisMap((prev) => ({ ...prev, ...newMap }));
    } catch {
      // silently fail — existing repos unaffected
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page]);

  const languages = useMemo(
    () => [...new Set(repos.map((r) => r.language).filter(Boolean) as string[])].sort(),
    [repos]
  );

  const filtered = useMemo(
    () =>
      repos.filter((r) => {
        const matchQuery =
          !query ||
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.description?.toLowerCase().includes(query.toLowerCase());
        const matchLang = !language || r.language === language;
        return matchQuery && matchLang;
      }),
    [repos, query, language]
  );

  return (
    <div className="space-y-6">
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        language={language}
        onLanguageChange={setLanguage}
        languages={languages}
      />

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No repositories match your filter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((repo) => (
            <ItemCard key={repo.id} repo={repo} analysisState={analysisMap[repo.id] ?? { status: "loading" }} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              <>
                <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

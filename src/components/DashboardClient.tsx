"use client";

import { useState, useMemo, useEffect } from "react";
import { GitHubRepo } from "@/lib/github";
import { AIAnalysis } from "@/lib/ai";
import ItemCard from "./ItemCard";
import FilterBar from "./FilterBar";

type AnalysisState = { status: "loading" } | { status: "done"; data: AIAnalysis } | { status: "error" };

export default function DashboardClient({ repos }: { repos: GitHubRepo[] }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [analysisMap, setAnalysisMap] = useState<Record<number, AnalysisState>>({});

  useEffect(() => {
    setAnalysisMap(Object.fromEntries(repos.map((r) => [r.id, { status: "loading" }])));

    fetch("/api/ai/analyze", {
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
    })
      .then((r) => r.json())
      .then(({ results }) => {
        const map: Record<number, AnalysisState> = {};
        repos.forEach((repo, i) => {
          map[repo.id] = results[i]
            ? { status: "done", data: results[i] }
            : { status: "error" };
        });
        setAnalysisMap(map);
      })
      .catch(() => {
        setAnalysisMap(
          Object.fromEntries(repos.map((r) => [r.id, { status: "error" }]))
        );
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    </div>
  );
}

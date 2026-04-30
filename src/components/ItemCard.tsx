"use client";

import { AIAnalysis } from "@/lib/ai";
import { GitHubRepo } from "@/lib/github";
import AIBadge from "./AIBadge";

type AnalysisState = { status: "loading" } | { status: "done"; data: AIAnalysis } | { status: "error" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ItemCard({
  repo,
  analysisState,
}: {
  repo: GitHubRepo;
  analysisState: AnalysisState;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-gray-900 transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
          >
            {repo.name}
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{repo.owner.login}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {repo.language && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              {repo.language}
            </span>
          )}
          <span title="Stars">⭐ {repo.stargazers_count}</span>
        </div>
      </div>

      {repo.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{repo.description}</p>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">Updated {formatDate(repo.updated_at)}</p>

      {analysisState.status === "loading" && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <div className="w-3 h-3 border border-gray-300 dark:border-gray-600 border-t-gray-500 dark:border-t-gray-400 rounded-full animate-spin" />
          Analyzing with AI…
        </div>
      )}
      {analysisState.status === "error" && (
        <p className="pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
          AI analysis unavailable
        </p>
      )}
      {analysisState.status === "done" && <AIBadge analysis={analysisState.data} />}
    </div>
  );
}

import { AIAnalysis } from "@/lib/ai";

const sentimentConfig = {
  positive: { label: "Positive", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900" },
  neutral: { label: "Neutral", className: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" },
  negative: { label: "Negative", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900" },
};

export default function AIBadge({ analysis }: { analysis: AIAnalysis }) {
  const sentiment = sentimentConfig[analysis.sentiment];

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{analysis.summary}</p>

      <div className="flex flex-wrap gap-2 items-center">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sentiment.className}`}
        >
          {sentiment.label}
        </span>
        {analysis.keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

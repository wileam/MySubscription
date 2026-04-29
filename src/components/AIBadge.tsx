import { AIAnalysis } from "@/lib/ai";

const sentimentConfig = {
  positive: { label: "Positive", className: "bg-green-50 text-green-700 border-green-200" },
  neutral: { label: "Neutral", className: "bg-gray-50 text-gray-600 border-gray-200" },
  negative: { label: "Negative", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function AIBadge({ analysis }: { analysis: AIAnalysis }) {
  const sentiment = sentimentConfig[analysis.sentiment];

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <p className="text-sm text-gray-600 leading-relaxed">{analysis.summary}</p>

      <div className="flex flex-wrap gap-2 items-center">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sentiment.className}`}
        >
          {sentiment.label}
        </span>
        {analysis.keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

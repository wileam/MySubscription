import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AIAnalysis {
  summary: string;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
}

export interface RepoInput {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
}

function parseAnalysis(raw: Record<string, unknown>): AIAnalysis {
  return {
    summary: typeof raw.summary === "string" ? raw.summary : "No summary available.",
    keywords: Array.isArray(raw.keywords) ? (raw.keywords as string[]).slice(0, 5) : [],
    sentiment: ["positive", "neutral", "negative"].includes(raw.sentiment as string)
      ? (raw.sentiment as AIAnalysis["sentiment"])
      : "neutral",
  };
}

export async function analyzeReposBatch(repos: RepoInput[]): Promise<AIAnalysis[]> {
  const list = repos
    .map(
      (r, i) =>
        `${i + 1}. name: ${r.name} | description: ${r.description || "none"} | language: ${r.language || "none"} | topics: ${r.topics?.join(", ") || "none"}`
    )
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `Analyze these GitHub repositories and return a JSON object with a "results" array, one entry per repo in order.

${list}

Return ONLY:
{ "results": [{ "summary": "1-2 sentence summary", "keywords": ["up to 5 keywords"], "sentiment": "positive|neutral|negative" }, ...] }`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
  const arr: unknown[] = Array.isArray(raw.results) ? raw.results : [];

  return repos.map((_, i) => parseAnalysis((arr[i] as Record<string, unknown>) ?? {}));
}

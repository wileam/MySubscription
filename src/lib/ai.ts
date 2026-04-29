import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AIAnalysis {
  summary: string;
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
}

export async function analyzeRepo(
  name: string,
  description: string | null,
  language: string | null,
  topics: string[]
): Promise<AIAnalysis> {
  const content = [
    `Repository: ${name}`,
    description ? `Description: ${description}` : null,
    language ? `Primary language: ${language}` : null,
    topics.length ? `Topics: ${topics.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `Analyze this GitHub repository and return JSON.

${content}

Return ONLY valid JSON:
{
  "summary": "1-2 sentence summary of what this repo is about and its purpose",
  "keywords": ["up to 5 relevant keywords"],
  "sentiment": "positive or neutral or negative based on the project nature and description"
}`,
      },
    ],
  });

  const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
  return {
    summary: raw.summary ?? "No summary available.",
    keywords: Array.isArray(raw.keywords) ? raw.keywords.slice(0, 5) : [],
    sentiment: ["positive", "neutral", "negative"].includes(raw.sentiment)
      ? raw.sentiment
      : "neutral",
  };
}

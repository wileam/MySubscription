import Groq from "groq-sdk";
import { readFileSync } from "fs";

// Load env vars from .env.local
const env = readFileSync(".env.local", "utf8");
env.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) process.env[key.trim()] = val.join("=").trim();
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MOCK_REPOS = [
  { name: "react", description: "A JavaScript library for building user interfaces", language: "JavaScript", topics: ["ui", "frontend", "library"] },
  { name: "next.js", description: "The React framework for production", language: "TypeScript", topics: ["framework", "react", "ssr"] },
  { name: "tailwindcss", description: "A utility-first CSS framework", language: "CSS", topics: ["css", "design", "utility"] },
  { name: "prisma", description: "Next-generation ORM for Node.js and TypeScript", language: "TypeScript", topics: ["database", "orm", "sql"] },
  { name: "trpc", description: "End-to-end typesafe APIs made easy", language: "TypeScript", topics: ["api", "typescript", "rpc"] },
  { name: "zustand", description: "A small fast state management solution", language: "TypeScript", topics: ["state", "react", "store"] },
  { name: "zod", description: "TypeScript-first schema validation with static type inference", language: "TypeScript", topics: ["validation", "schema", "typescript"] },
  { name: "vite", description: "Next generation frontend tooling", language: "JavaScript", topics: ["build", "bundler", "dev"] },
  { name: "vitest", description: "A blazing fast unit test framework powered by Vite", language: "TypeScript", topics: ["testing", "unit", "vite"] },
  { name: "playwright", description: "Fast and reliable end-to-end testing for modern web apps", language: "TypeScript", topics: ["testing", "e2e", "automation"] },
  { name: "drizzle-orm", description: "TypeScript ORM that is production ready", language: "TypeScript", topics: ["orm", "database", "typescript"] },
  { name: "shadcn-ui", description: "Re-usable components built with Radix UI and Tailwind CSS", language: "TypeScript", topics: ["ui", "components", "radix"] },
  { name: "lucia", description: "Authentication library for TypeScript", language: "TypeScript", topics: ["auth", "session", "typescript"] },
  { name: "uploadthing", description: "File uploads for modern web devs", language: "TypeScript", topics: ["upload", "files", "storage"] },
  { name: "resend", description: "Email API for developers", language: "TypeScript", topics: ["email", "api", "transactional"] },
  { name: "inngest", description: "Event-driven background jobs and workflows", language: "TypeScript", topics: ["jobs", "events", "background"] },
  { name: "clerk", description: "Complete user management and authentication platform", language: "TypeScript", topics: ["auth", "users", "saas"] },
  { name: "vercel-ai", description: "AI SDK for building AI-powered applications", language: "TypeScript", topics: ["ai", "llm", "streaming"] },
  { name: "langchain", description: "Building applications with LLMs through composability", language: "Python", topics: ["ai", "llm", "chains"] },
  { name: "fastapi", description: "Modern web framework for building APIs with Python", language: "Python", topics: ["api", "python", "async"] },
];

function buildBatchPrompt(repos) {
  const list = repos
    .map((r, i) =>
      `${i + 1}. name: ${r.name} | description: ${r.description || "none"} | language: ${r.language || "none"} | topics: ${r.topics?.join(", ") || "none"}`
    )
    .join("\n");

  return `Analyze these GitHub repositories and return a JSON array with one object per repo, in order.

${list}

Return ONLY a JSON array:
[
  { "summary": "1-2 sentence summary", "keywords": ["up to 5 keywords"], "sentiment": "positive|neutral|negative" },
  ...
]`;
}

async function runTest(count) {
  const repos = MOCK_REPOS.slice(0, count);
  const prompt = buildBatchPrompt(repos);
  const inputTokenEstimate = Math.round(prompt.length / 4);

  const start = Date.now();
  let parsed = null;
  let error = null;
  let usage = null;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content ?? "{}";
    usage = completion.usage;

    // model may return { results: [...] } or just [...]
    const obj = JSON.parse(raw);
    const arr = Array.isArray(obj) ? obj : (obj.results ?? obj.analyses ?? Object.values(obj)[0]);
    parsed = Array.isArray(arr) ? arr : null;
  } catch (e) {
    error = e.message;
  }

  const elapsed = Date.now() - start;

  console.log(`\n── ${count} repos ──`);
  console.log(`  Time:         ${elapsed}ms`);
  console.log(`  Input tokens: ~${inputTokenEstimate} (est) | actual: ${usage?.prompt_tokens ?? "?"}`);
  console.log(`  Output tokens: ${usage?.completion_tokens ?? "?"}`);
  console.log(`  Total tokens: ${usage?.total_tokens ?? "?"}`);
  console.log(`  Parsed OK:    ${parsed ? `yes (${parsed.length} items)` : "NO"}`);
  if (error) console.log(`  Error:        ${error}`);

  // wait 12s between tests to stay under 6k TPM
  return elapsed;
}

console.log("Batch AI load test — llama-3.3-70b-versatile on Groq free tier");
console.log("Waiting 12s between tests to avoid TPM limit...\n");

for (const count of [5, 10, 15, 20]) {
  await runTest(count);
  if (count < 20) await new Promise((r) => setTimeout(r, 12000));
}

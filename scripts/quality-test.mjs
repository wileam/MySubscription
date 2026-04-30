import Groq from "groq-sdk";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
env.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) process.env[key.trim()] = val.join("=").trim();
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TEST_REPOS = [
  { name: "react", description: "A JavaScript library for building user interfaces", language: "JavaScript", topics: ["ui", "frontend", "library"] },
  { name: "prisma", description: "Next-generation ORM for Node.js and TypeScript", language: "TypeScript", topics: ["database", "orm", "sql"] },
  { name: "tailwindcss", description: "A utility-first CSS framework for rapid UI development", language: "CSS", topics: ["css", "design", "utility"] },
  { name: "next.js", description: "The React framework for production — hybrid static & server rendering", language: "TypeScript", topics: ["framework", "react", "ssr"] },
  { name: "zod", description: "TypeScript-first schema validation with static type inference", language: "TypeScript", topics: ["validation", "schema", "typescript"] },
  { name: "vitest", description: "A blazing fast unit test framework powered by Vite", language: "TypeScript", topics: ["testing", "unit", "vite"] },
  { name: "lucia", description: "Authentication library for TypeScript that abstracts away session handling", language: "TypeScript", topics: ["auth", "session", "typescript"] },
  { name: "drizzle-orm", description: "TypeScript ORM that feels like writing SQL", language: "TypeScript", topics: ["orm", "database", "typescript"] },
  { name: "shadcn-ui", description: "Re-usable components built with Radix UI and Tailwind CSS", language: "TypeScript", topics: ["ui", "components", "radix"] },
  { name: "trpc", description: "End-to-end typesafe APIs made easy — no code generation", language: "TypeScript", topics: ["api", "typescript", "rpc"] },
];

function buildBatchPrompt(repos) {
  const list = repos
    .map((r, i) =>
      `${i + 1}. name: ${r.name} | description: ${r.description || "none"} | language: ${r.language || "none"} | topics: ${r.topics?.join(", ") || "none"}`
    )
    .join("\n");

  return `Analyze these GitHub repositories and return a JSON object with a "results" array, one entry per repo in order.

${list}

Return ONLY:
{ "results": [{ "summary": "1-2 sentence summary", "keywords": ["up to 5 keywords"], "sentiment": "positive|neutral|negative" }, ...] }`;
}

async function singleBatch(repos) {
  const start = Date.now();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: buildBatchPrompt(repos) }],
  });
  const elapsed = Date.now() - start;
  const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
  return { results: raw.results ?? [], elapsed, tokens: completion.usage?.total_tokens };
}

async function miniBatch(repos, batchSize = 5) {
  const chunks = [];
  for (let i = 0; i < repos.length; i += batchSize) {
    chunks.push(repos.slice(i, i + batchSize));
  }

  const start = Date.now();
  const chunkResults = await Promise.all(
    chunks.map(async (chunk) => {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: buildBatchPrompt(chunk) }],
      });
      const raw = JSON.parse(completion.choices[0].message.content ?? "{}");
      return { results: raw.results ?? [], tokens: completion.usage?.total_tokens ?? 0 };
    })
  );
  const elapsed = Date.now() - start;
  return {
    results: chunkResults.flatMap((c) => c.results),
    elapsed,
    tokens: chunkResults.reduce((sum, c) => sum + c.tokens, 0),
  };
}

function printResults(label, repos, results, elapsed, tokens) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${label}  |  ${elapsed}ms  |  ${tokens} tokens`);
  console.log("─".repeat(60));
  repos.forEach((repo, i) => {
    const r = results[i];
    if (!r) { console.log(`  ${repo.name}: MISSING`); return; }
    console.log(`\n  [${repo.name}]`);
    console.log(`  Summary:   ${r.summary}`);
    console.log(`  Keywords:  ${r.keywords?.join(", ")}`);
    console.log(`  Sentiment: ${r.sentiment}`);
  });
}

console.log("Quality comparison: single batch vs mini-batches of 5");
console.log("Same 10 repos, same model, same temperature\n");

// Run sequentially to avoid TPM issues
const single = await singleBatch(TEST_REPOS);
console.log("Single batch done, waiting 15s before mini-batch test...");
await new Promise((r) => setTimeout(r, 15000));
const mini = await miniBatch(TEST_REPOS, 5);

printResults("SINGLE BATCH (10 repos in 1 call)", TEST_REPOS, single.results, single.elapsed, single.tokens);
printResults("MINI-BATCH   (2 calls of 5 repos)", TEST_REPOS, mini.results, mini.elapsed, mini.tokens);

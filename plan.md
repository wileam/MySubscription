# MySubscriptions — Planning Doc

## Stack Decisions

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components handle GitHub API calls server-side so the access token never reaches the browser. API routes give backend separation without a separate server. Zero-config Vercel deploy. |
| Styling | Tailwind CSS v4 | Fast to build, dark mode via `prefers-color-scheme` with no JS |
| Auth | NextAuth.js v4 | Handles CSRF protection, state param validation, token storage — rolling your own OAuth has too many footguns |
| AI | Groq — Llama 3.3 70B | Free tier, ~1-2s response, supports `response_format: json_object`. Claude/GPT-4o would give better quality but cost money for a demo |
| Deployment | Vercel | Free, zero-config with Next.js |

---

## Service Choice

**GitHub chosen over Spotify/Google Calendar because:**
- Developer audience — interviewers will relate to the data
- Rich metadata per repo (description, language, topics, stars) gives AI enough signal
- Easy to demo live with your own repos
- Spotify tracks are short — less interesting to summarize

**Spotify not implemented** — deprioritized within time budget, documented as +5 day enhancement

---

## AI Strategy — How We Got to the Final Approach

### Step 1: Ruled out one-call-per-repo

Groq free tier = **6,000 tokens/minute**. 15 repos × ~500 tokens each = ~7,500 tokens fired simultaneously → hits rate limit reliably. Needed batching.

### Step 2: Load tested batch sizes

| Batch size | Time | Tokens |
|---|---|---|
| 5 repos | 796ms | 542 |
| 10 repos | 1,225ms | 985 |
| 15 repos | 1,829ms | 1,486 |
| 20 repos | 2,194ms | 1,861 |

10 repos = ~985 tokens per call → safe. Decided 10 per page, 1 call per page load.

### Step 3: Quality tested single batch vs mini-batches of 5

| | Single batch of 10 | Mini-batches of 5 |
|---|---|---|
| Time | 1,117ms | 1,007ms |
| Tokens | 977 | 1,214 (+24%) |
| Quality | Generic 1-line summaries | Richer 2-sentence summaries |

Mini-batches won on quality. +24% tokens still safe. Parallel via `Promise.all` so no added latency.

**Final decision:** 10 repos per page, sent in mini-batches of 5, run in parallel.

### Why not JSON repair?

`response_format: { type: "json_object" }` makes syntax errors impossible at the model level. Structural issues (wrong array length, missing fields) are handled by typed fallbacks in `parseAnalysis()` — bad responses degrade per card, not the whole dashboard.

---

## Pagination Decision

**Load More button chosen over infinite scroll because:**
- AI cost is bounded — one batch per click, not continuous
- User explicitly controls when more data loads
- Simpler to implement and reason about

**Infinite scroll trade-off:** better UX but needs a request queue to prevent rate limit spikes if user scrolls fast. Worth adding in production.

**Page size = 10:** matches the AI batch size (one call per page), stays well under 6k TPM, fast enough load time (~1.2s per page).

---

## Key Trade-offs

| Decision | What we gained | What we gave up |
|---|---|---|
| No database | Zero infra, always fresh data | Slow repeat visits, no cross-device cache |
| Client-side AI cache by repo ID | Filter/search is instant, no re-analysis | Cache lost on page refresh |
| Server-side GitHub fetch | Token never in browser | One extra server hop per load |
| Groq free tier | Zero cost | 6k TPM — would need paid tier or request queue for multi-user |
| JWE session cookie | GitHub token encrypted at rest | Slightly larger cookie than plain JWT |
| Load More over infinite scroll | Predictable AI usage | Less smooth UX |

---

## Security Notes

- GitHub access token stored in **JWE cookie** (AES-256-GCM, 5-segment format) — only the server can decrypt it
- `__Secure-` cookie prefix in production — HTTPS only
- Token never serialized into page HTML
- **Known gap:** `/api/ai/analyze` has no session check — anyone can POST. Fix in production: add `getServerSession()` guard to the route handler

---

## Future Enhancements

### +1 day
- Stream AI responses via Groq streaming API + `ReadableStream` route handler — cards populate token by token
- Add session guard to `/api/ai/analyze`
- Keyword frequency chart (bar chart of most common terms across all repos)

### +5 days
- Spotify OAuth — recently played tracks with mood/genre AI analysis
- Vercel KV (Upstash Redis) AI cache — key by `userId:repoId`, TTL 5 min, cross-device
- User preferences (which AI fields to show, repos per page) saved to Vercel KV
- Expand GitHub data to open issues + recent PRs for richer AI context
- Infinite scroll with request queue replacing Load More

### +20 days
- Google Calendar, Notion, Reddit OAuth integrations
- Cross-service unified feed with AI daily digest
- Webhook subscriptions for real-time updates
- Shareable dashboard snapshots
- Team/org mode

---

## Interview Talking Points

**On security:** "OAuth tokens live in a JWE cookie — AES-256-GCM encrypted with NEXTAUTH_SECRET. The client never sees the token. Server components proxy all GitHub calls. One known gap: the AI route has no auth check, which I'd fix before production."

**On AI approach:** "I ruled out one-call-per-repo because 15 parallel calls would hit Groq's 6k TPM. I load tested batch sizes, then quality tested mini-batches vs single batches. Mini-batches of 5 gave richer summaries at +24% token cost, still within limits."

**On pagination:** "Load More over infinite scroll because AI cost is bounded per click. Infinite scroll needs a request queue — worth adding but adds complexity."

**On no database:** "Fresh fetch each visit — simpler, always current. Trade-off is latency on repeat visits. LocalStorage with a timestamp TTL is the zero-infra fix. Vercel KV for cross-device."

**On filtering:** "Filter state lives in the client. AI results cached by repo ID on mount — filter never re-triggers analysis. Filtering is instant."

---

## Pre-submission Checklist

- [x] `.env.example` documented
- [x] README: setup, architecture, AI implementation, limitations, future enhancements
- [x] Deployed Vercel link
- [x] Error states — AI failure degrades per card, not whole page
- [x] Dark mode
- [x] Mobile responsive
- [x] Meaningful git commit history
- [x] Load More pagination

# MySubscriptions

A connected services dashboard that fetches your GitHub repositories and enriches each one with AI-powered summaries, keyword extraction, and sentiment analysis.

**Live demo:** https://my-subscription-gamma.vercel.app

**Demo**: https://www.loom.com/share/a838f7ef1c8b4dff929e0a7f85dd4ae4

---

## Setup

### Prerequisites
- Node.js 18+
- A [GitHub OAuth App](https://github.com/settings/developers)
- A [Groq API key](https://console.groq.com)

### Local development

```bash
git clone https://github.com/YOUR_USERNAME/mysubscriptions.git
cd mysubscriptions
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your Vercel URL in production |
| `GITHUB_CLIENT_ID` | From your GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | From your GitHub OAuth app |
| `GROQ_API_KEY` | From console.groq.com |

**GitHub OAuth callback URLs** (add both in your OAuth app settings):
```
http://localhost:3000/api/auth/callback/github
https://your-app.vercel.app/api/auth/callback/github
```

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Landing page — GitHub sign-in (client component)
│   ├── providers.tsx               # SessionProvider wrapper for NextAuth
│   ├── dashboard/
│   │   └── page.tsx                # Dashboard — server component, fetches repos server-side
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth OAuth handler (GET + POST)
│       ├── github/items/           # Paginated repo fetcher — GET ?page=N
│       └── ai/analyze/             # Batch AI endpoint — POST { repos[] } → { results[] }
├── components/
│   ├── DashboardClient.tsx         # Client shell — filter state, AI cache, load more
│   ├── ItemCard.tsx                # Repo card — metadata + AI output
│   ├── AIBadge.tsx                 # Summary / keywords / sentiment badges
│   ├── FilterBar.tsx               # Search input + language select
│   └── SignOutButton.tsx
└── lib/
    ├── auth.ts                     # NextAuth config — shared between route handler and server component
    ├── github.ts                   # GitHub REST API client — fetchUserRepos(token, page)
    └── ai.ts                       # Groq client — analyzeReposBatch() with mini-batch logic
```

### Data flow

```
Landing page
  └── useSession() → active? → redirect /dashboard
                   → no session → signIn("github") → NextAuth OAuth flow
                                                    → JWE cookie written

Dashboard (server component)
  └── getServerSession() → reads access token from JWE cookie
  └── fetchUserRepos(token, page=1) → GitHub API → 10 repos
  └── renders DashboardClient with initialRepos

DashboardClient (client component, mount)
  └── POST /api/ai/analyze { repos: [10] }
        └── server splits into 2 chunks of 5
        └── Promise.all → 2 parallel Groq calls
        └── results merged → returned
  └── analysisMap[repoId] = { status: "done", data }
  └── filter/search operates on cached map — no re-analysis

Load More button
  └── GET /api/github/items?page=2 → next 10 repos
  └── POST /api/ai/analyze for new repos only
  └── merged into existing analysisMap
```

### Key architectural decisions

- **Server-side GitHub fetch** — access token stays in the JWE cookie, never serialized into HTML or sent to the browser. Server component acts as a secure proxy.
- **Client-side AI cache by repo ID** — analysis runs once on mount and on each Load More. Filter/search never re-triggers AI calls.
- **API route separation** — `/api/github/items` and `/api/ai/analyze` are independently callable, making the data layer testable without the UI.

---

## AI / NLP Implementation

**Model:** Groq — `llama-3.3-70b-versatile`  
**Output:** structured JSON enforced via `response_format: { type: "json_object" }`

Each repo is analyzed for:

| Field | Description |
|---|---|
| `summary` | 1–2 sentence plain-English description |
| `keywords` | Up to 5 tags from name, description, language, topics |
| `sentiment` | `positive` / `neutral` / `negative` |

**Batching strategy:** repos are split into chunks of 5 and analyzed in parallel. 10 repos per page = 2 parallel Groq calls = ~1,214 tokens total, well within Groq's 6,000 TPM free tier limit.

Load test results that informed this decision:

| Batch size | Response time | Total tokens |
|---|---|---|
| 5 repos | 796ms | 542 |
| 10 repos | 1,225ms | 985 |
| 15 repos | 1,829ms | 1,486 |
| 20 repos | 2,194ms | 1,861 |

Quality test (single batch of 10 vs two mini-batches of 5):

| | Single batch | Mini-batch of 5 |
|---|---|---|
| Time | 1,117ms | 1,007ms |
| Tokens | 977 | 1,214 (+24%) |
| Summary depth | 1 sentence, generic | 1–2 sentences, specific |
| Keywords | 4 items | 5 items, more precise |

Mini-batches of 5 chosen: better quality, faster, +24% token cost still within limits.

**Error handling:** `parseAnalysis()` applies typed fallbacks per field. A bad response from Groq degrades that card to an "unavailable" state without affecting others.

---

## Pagination

Repos load 10 at a time. A **Load More** button fetches the next page via `/api/github/items?page=N` and triggers a fresh AI batch only for the new repos — existing results are unchanged.

`hasMore` is derived from whether GitHub returned a full page of results (< 10 = no more pages).

---

## Security

- GitHub access token stored in a **JWE (JSON Web Encryption)** cookie — AES-256-GCM encrypted with `NEXTAUTH_SECRET`. 5-segment format vs standard JWT's 3.
- `__Secure-` cookie prefix enforced in production (HTTPS only).
- Token never reaches the browser.
- **Known gap:** `/api/ai/analyze` has no session check. In production: add `getServerSession()` guard to prevent unauthorized Groq API usage.

---

## Limitations

- **No persistence** — data fetched fresh each visit; no cache between sessions
- **Repository-only** — repos only, not issues, PRs, or commits
- **Single service** — GitHub only; Spotify deprioritized within time budget
- **Groq free tier** — 6,000 TPM limit; concurrent users could hit it without a request queue

---

## Future Enhancements

### +1 day
- Stream AI responses via Groq streaming API — cards populate token by token
- Keyword frequency chart across all repos
- Session guard on `/api/ai/analyze`

### +5 days
- Spotify OAuth — recently played tracks with mood/genre analysis
- Vercel KV (Upstash Redis) AI result cache — key by `userId:repoId`, TTL 5 min
- User preferences (which AI fields to show, repos per page) saved to profile
- Expand GitHub data to open issues + recent PRs

### +20 days
- Google Calendar, Notion, Reddit integrations
- Cross-service unified feed with AI daily digest
- Webhook subscriptions for real-time updates
- Shareable dashboard snapshots
- Team/org mode

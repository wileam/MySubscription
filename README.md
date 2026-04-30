# MySubscriptions

A connected services dashboard that fetches your GitHub repositories and enriches each one with AI-powered summaries, keyword extraction, and sentiment analysis.

**Live demo:** https://my-subscription-gamma.vercel.app

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
│   ├── page.tsx                    # Landing page — GitHub sign-in
│   ├── dashboard/page.tsx          # Dashboard — server component, fetches repos
│   ├── providers.tsx               # SessionProvider wrapper
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth OAuth handler
│       └── ai/analyze/             # AI analysis endpoint (POST)
├── components/
│   ├── DashboardClient.tsx         # Client shell — manages filter state + AI cache
│   ├── ItemCard.tsx                # Repo card with metadata and AI output
│   ├── AIBadge.tsx                 # Summary, keywords, sentiment display
│   ├── FilterBar.tsx               # Search + language filter
│   └── SignOutButton.tsx
└── lib/
    ├── auth.ts                     # NextAuth config (shared between route + server)
    ├── github.ts                   # GitHub REST API client
    └── ai.ts                       # Groq API client
```

**Data flow:**

1. User signs in via GitHub OAuth — NextAuth stores the access token server-side in a JWT session cookie
2. The dashboard page (server component) reads the session token and calls the GitHub API directly, fetching up to 15 of the user's most recently updated repositories
3. The client component sends all repos in a single batched AI request on mount, then maps results back to each repo by index
4. Filter changes show/hide cards using the cached results — no re-analysis on filter

**Key architectural decisions:**

- **Server-side data fetch** — GitHub access token never reaches the browser; the server component acts as a secure proxy
- **Client-side AI cache** — analysis runs once per page load, not per render, so filtering is instant
- **Separation of concerns** — `lib/github.ts` and `lib/ai.ts` are pure API clients with no framework coupling, making them independently testable

---

## AI / NLP Implementation

Each repository is analyzed by **Groq** running **Llama 3.3 70B**, returning structured JSON with three fields:

| Field | Description |
|---|---|
| `summary` | 1–2 sentence plain-English description of what the repo does |
| `keywords` | Up to 5 relevant tags extracted from the name, description, language, and topics |
| `sentiment` | `positive`, `neutral`, or `negative` based on the project's nature and description |

The prompt passes the repo name, description, primary language, and GitHub topics as context. `response_format: { type: "json_object" }` enforces valid JSON output, eliminating the need for regex parsing or retry logic.

**Batched analysis:** all repositories are analyzed in a single Groq API call rather than one request per repo. This was validated with a load test across batch sizes:

| Batch size | Response time | Total tokens |
|---|---|---|
| 5 repos | 796ms | 542 |
| 10 repos | 1,225ms | 985 |
| 15 repos | 1,829ms | 1,486 |
| 20 repos | 2,194ms | 1,861 |

Groq's free tier allows 6,000 tokens/minute. Batching 15 repos uses ~1,486 tokens in one call, well within the limit. The alternative — one call per repo fired in parallel — would consume ~7,500 tokens simultaneously and reliably hit rate limits. Batching also cuts network overhead from N round trips to one.

---

## Limitations

- **No persistence** — data is fetched fresh on every page load; there is no cache between sessions
- **Repository-only** — currently only reads repos, not issues, PRs, or commits
- **Single service** — only GitHub is connected; Spotify and Google Calendar were considered but deprioritized within the time budget
- **Rate limits** — GitHub's API allows 5,000 requests/hour for authenticated users; Groq's free tier has per-minute limits that could cause failures if many users hit the app simultaneously

---

## Future Enhancements

### +1 day
- Stream AI responses per card using the Groq streaming API and React Suspense, so cards populate as results arrive rather than all at once
- Add a keyword frequency chart across all repos (bar chart of most common terms)
- Let users choose which AI processing to apply per card (summary, keywords, or sentiment)

### +5 days
- Add Spotify integration — recently played tracks with mood/genre analysis
- Persist AI results in a lightweight store (Redis or Vercel KV) with a short TTL, so repeat visits are instant
- Expand GitHub data to include open issues and recent PRs for richer analysis context
- Add user-configurable processing preferences saved to a profile

### +20 days
- Support additional OAuth services: Google Calendar (event summarization), Notion (page digests), Reddit (subscription highlights)
- Cross-service unified feed with AI-generated daily digest
- Webhook subscriptions for real-time updates without polling
- Shareable dashboard snapshots with public links
- Team/organization mode for shared visibility across connected accounts

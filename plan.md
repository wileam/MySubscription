# MySubscriptions — Implementation Plan

## Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | TypeScript-first, API routes = built-in backend separation, perfect Vercel deploy |
| Styling | Tailwind CSS | Fast clean UI, responsive by default |
| Auth | NextAuth.js | Handles OAuth token storage/refresh, server-side only — tokens never hit the client |
| AI | Claude API (Anthropic) | Structured JSON output via tool use, great at summarization |
| Deployment | Vercel | Free, zero-config with Next.js |

---

## Services

**Primary: GitHub** — repos + issues
- Rich text (issue body, PR description) for meaningful AI summarization
- Easy to demo live with your own repos

**Optional bonus: Spotify** — recently played / saved tracks
- Adds multi-service credibility (optional enhancement checkbox)
- Sentiment on music is a natural AI use case

---

## Architecture

```
/
├── app/
│   ├── page.tsx                    # Landing — "Connect" buttons
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard (server component)
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth OAuth handler
│       ├── github/items/           # Fetch GitHub repos/issues
│       ├── spotify/items/          # Fetch Spotify tracks (optional)
│       └── ai/analyze/             # Claude API — summarize/keywords/sentiment
├── components/
│   ├── ServiceCard.tsx             # Service name + logo + connect status
│   ├── ItemCard.tsx                # Item metadata + AI output
│   ├── AIBadge.tsx                 # Summary / keywords / sentiment display
│   └── FilterBar.tsx               # Search/filter bar
└── lib/
    ├── github.ts                   # GitHub API client
    ├── spotify.ts                  # Spotify API client (optional)
    └── ai.ts                       # Claude API calls
```

**Data flow:**
1. User hits landing → clicks "Connect GitHub" → NextAuth OAuth flow
2. Dashboard load (server component): fetch 15 GitHub items using session token
3. Per item: call `/api/ai/analyze` → Claude returns `{ summary, keywords, sentiment }` as structured JSON
4. Render `ItemCard` with metadata + AI output inline

---

## Implementation Order

| Hour | Task |
|---|---|
| 1 | `npx create-next-app`, NextAuth setup, GitHub OAuth config |
| 2 | GitHub API fetch (repos + issues), basic ItemCard display |
| 3 | Claude API integration — structured prompt, `/api/ai/analyze` route |
| 4 | Dashboard UI — Tailwind layout, ServiceCard, AIBadge, loading states |
| 5 | Filter/search, polish, `.env.example`, deploy to Vercel |
| 6 (bonus) | Spotify OAuth + recently played + sentiment analysis |

---

## AI Implementation

One Claude call per item with a structured prompt:

```
Given this GitHub issue:
Title: {title}
Body: {body}

Return JSON: { summary: string (1-2 sentences), keywords: string[], sentiment: "positive"|"neutral"|"negative" }
```

Use Claude's tool use / JSON mode so responses are always parseable. Handle failures per-item so one bad response doesn't break the whole dashboard.

---

## Environment Variables

```bash
# .env.local
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

SPOTIFY_CLIENT_ID=         # optional
SPOTIFY_CLIENT_SECRET=     # optional

ANTHROPIC_API_KEY=
```

---

## Interview Talking Points

**Security:** OAuth tokens live only in the server-side NextAuth session — the client never sees them. API routes proxy all service calls so credentials are never exposed.

**Backend separation:** Each `/api/` route is independently scoped — the optional requirement is satisfied even within the monorepo.

**AI trade-offs:** AI calls are batched server-side on dashboard load. An improvement would be streaming results per-item with React Suspense so users see cards populate progressively.

**No database:** Data fetched fresh each visit — simpler setup, always current, but slower. With more time: Redis cache with a 5-min TTL.

**Future enhancements:**
- 1 day: Streaming AI responses, keyword frequency chart
- 5 days: Persistent history, user-selectable processing type (summary vs keywords vs sentiment), more services
- 20 days: Webhooks for real-time updates, cross-service feed aggregation, shareable dashboards

---

## Pre-submission Checklist

- [ ] `.env.example` with all vars documented
- [ ] README: setup, architecture, AI implementation, limitations, future enhancements
- [ ] Deployed Vercel link works without local setup
- [ ] Error states handled (service disconnected, AI failure, empty data)
- [ ] Mobile responsive

# Frontend Summary Guide

## Overview
React + TypeScript + Vite SPA. Communicates with the backend via a shared Axios instance. Auth token is stored in `localStorage` under the key `domainToken` and sent as a `Bearer` token on every protected request.

---

## Configuration

| File | Purpose |
|---|---|
| `src/config/api.ts` | Exports `BASE_URL` from `VITE_BASE_URL` env var |
| `src/config/axiosInstance.ts` | Pre-configured Axios instance with `baseURL` and `Content-Type: application/json` |
| `.env` | Must define `VITE_BASE_URL=http://localhost:<PORT>` |

---

## Routing (`src/routes/AppRouter.tsx`)

| Path | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Hero + feature overview, entry point |
| `/createDomain` | `CreateDomain` | Form to register a new domain |
| `/EnqueueUrl` | `EnqueueUrl` | Submit a URL into the crawl pipeline |
| `/getYourPages` | `GetYourPages` | List all crawled pages for a domain |
| `/pageDetail/:pageId` | `PageDetail` | Full SEO data for a single page |
| `/AiSummary/:id` | `AiSummary` | View AI-generated SEO summary for a page |
| `/createNode` | `CreateNode` | Create or update a domain node |
| `/nodeDetails/:nodeId` | `NodeDetails` | Aggregated analytics for a node |
| `/nodeInsights/:nodeId` | `NodeInsights` | Diff comparison between nodes |

---

## Pages

### LandingPage
Static marketing page. Two CTA buttons navigate to `/createDomain`.

### CreateDomain
Calls `POST /domain/createDomain` with `{ name }`. On success, stores the returned auth token in `localStorage` as `domainToken`.

### EnqueueUrl
Calls `POST /domainPage/enqueueUrl` with a URL. Triggers the full crawl pipeline on the backend.

### GetYourPages
Calls `POST /domainPage/getDomainPages`. Lists all `DomainPage` records. Each row links to `/pageDetail/:pageId`.

### PageDetail
- Fetches page data via `POST /domainPage/findOne` (auto-CRUD endpoint) using `pageId` from URL params.
- Displays: overall score, SEO score, page depth, per-check SEO scores, technical SEO (category scores, Core Web Vitals, field data, crawlability, security, diagnostics), keywords table (paginated at 20), internal/external links tables, and per-queue processing status.
- "Generate AI Summary" button calls `POST /domainPage/aiSummary` then navigates to `/AiSummary/:pageId`.

### AiSummary
Calls `POST /domainPage/getAiSummary` to retrieve the stored Gemini-generated SEO report for a page.

### CreateNode
Calls `POST /domainNode/createOrUpdateDomainNode` with `{ nodePath, type }`. Nodes group pages (e.g. `/blog`, `/products`) for aggregated analysis.

### NodeDetails
Calls `POST /domainNode/getAllNodes` or fetches a single node. Displays aggregated analytics: average SEO score, technical SEO analytics, keywords, and AI summary.

### NodeInsights
Calls `POST /domainNodeInsights/nodeInsights` with `{ domainNodes }`. Shows diff comparison between a custom node and the base node — best/worst pages, per-check SEO score differences, and technical SEO differences.

---

## Data Flow

```
User action
  → axiosInstance (Bearer token from localStorage)
    → Backend REST API
      → BullMQ queue job
        → Worker processes job
          → MongoDB updated
            → Frontend polls / re-fetches to show results
```

---

## Auth Pattern
All protected pages read `domainToken` from `localStorage` and attach it as:
```
Authorization: Bearer <token>
```
If the token is missing or the server returns `401`, the page shows an error prompting re-authentication.

---

## Running

```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:5173
```

Ensure `VITE_BASE_URL` in `frontend/.env` points to the running backend.

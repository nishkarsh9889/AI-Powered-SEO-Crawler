# Backend Summary Guide

## Overview
Node.js + Express + TypeScript backend powering the SEO crawler engine. Uses MongoDB for storage, Redis + BullMQ for distributed job queues, Google PageSpeed Insights for technical SEO data, and Google Gemini for AI summaries.

---

## Entry Point
`src/index.ts` — starts Express, connects to MongoDB, registers routes, mounts Bull Board at `/admin/queues`.

---

## Architecture

### Queue Pipeline (BullMQ + Redis)
Jobs flow through these queues in order:

| Queue | Worker | Responsibility |
|---|---|---|
| `pageQueue` | `pageQueue.worker.ts` | Crawls URL or sitemap, creates `DomainPage` record |
| `infoQueue` | `infoQueue.worker.ts` | Extracts page metadata, keywords, links |
| `technicalSeoQueue` | `technicalSeoQueue.worker.ts` | Runs PageSpeed Insights API |
| `pageSeoQueue` | `pageSeoQueue.worker.ts` | Scores individual SEO checks |
| `siteSeoQueue` | `siteSeoQueue.worker.ts` | Scores sitemap-level SEO |
| `insightsQueue` | `insightsQueue.worker.ts` | Compares nodes, writes `DomainNodeInsights` |
| `aiSummaryQueue` | `aiSummaryQueue.worker.ts` | Calls Gemini to generate AI SEO report |

All workers are started together via `src/controller/engine/workers/index.ts`.

### Auto CRUD Builder
`crudBuilder.controller.ts/` — dynamically generates REST endpoints (`save`, `update`, `find`, `findOne`, `delete`) for every model exported from `model/exportModel.model.ts`.

---

## Data Models

| Model | Purpose |
|---|---|
| `Domain` | Root domain + sitemap URLs with XML hashes |
| `DomainPage` | Per-page data: keywords, links, SEO scores, technical SEO, AI summary, processing status |
| `DomainNode` | Logical grouping of pages (baseNode / customNode) with aggregated analytics |
| `DomainNodeInsights` | Diff comparison between a node and a base node |
| `SeoChecks` | Individual SEO check definitions |
| `ErrorLog` | Structured error records |

`DomainPage` uses a **versioning plugin** to track historical changes to `seoScore`, `overallScore`, and `domainPageHtmlHash`.

---

## API Routes

### `/domain`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/createDomain` | No | Create a new domain |
| POST | `/addSitemap` | Yes | Add sitemap URLs to a domain |

### `/domainPage`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/enqueueUrl` | Yes | Submit a URL into the crawl pipeline |
| POST | `/getDomainPageStatus` | Yes | Get processing status for a URL |
| POST | `/getDomainPages` | Yes | List all pages for a domain |
| POST | `/aiSummary` | Yes | Trigger AI summary job for a page |
| POST | `/getAiSummary` | Yes | Retrieve stored AI summary |

### `/domainNode`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/createOrUpdateDomainNode` | Yes | Create or update a node (requires `nodePath`, `type`) |
| POST | `/getAllNodes` | Yes | List all nodes |
| POST | `/domainNodeAiReport` | Yes | Generate AI report for a node |

### `/domainNodeInsights`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/nodeInsights` | Yes | Compute insights comparing nodes to a base node |

---

## Key Utilities

| File | Purpose |
|---|---|
| `geminiIntegration.ts` | Calls `gemini-3-flash-preview` via `@google/genai` |
| `pageSpeedApiIntegration.ts` | Calls Google PageSpeed Insights v5 (desktop, all 4 categories) |
| `googleAdsApiIntegration.ts` | Google Ads API integration |
| `auth.ts` | Auth middleware used on protected routes |
| `requiredFields.ts` | Middleware to validate required body fields |
| `dbUtils.ts` | Thin wrappers: `dbUpdate`, `dbFindOne`, etc. |
| `logger.ts` / `loggers.ts` | Structured loggers per context (APP, DB, WORKER, API) |
| `apiResponseHandler.ts` | Standardised API response format |

---

## Configuration
`src/config/env.ts` — validates and exports env vars.

Required `.env` keys:
```
PORT
MONGO_URI
REDIS_HOST / REDIS_PORT
PAGE_SPEED_API
GEMINI_API_KEY
```

---

## Running

```bash
# Server
npm run dev

# All workers (single process)
npx ts-node src/controller/engine/workers/index.ts

# Queue monitor UI
http://localhost:<PORT>/admin/queues
```

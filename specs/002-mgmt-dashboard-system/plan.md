# Implementation Plan: MGH Resort WhatsApp Management System

**Branch**: `002-mgmt-dashboard-system` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-mgmt-dashboard-system/spec.md`

## Summary

A full-stack WhatsApp management system: React + Vite + TypeScript dashboard (8 pages) consuming a Node.js Express REST API backed by SQLite. The backend also manages WhatsApp automation (phone ↔ VM WebSocket bridge with anti-detection engines), customer CRM with lead scoring, campaign management with segment builder, team performance tracking, and system health monitoring. Single-server deployment on Oracle Cloud VM free tier.

## Technical Context

**Language/Version**: TypeScript 5.7 (frontend), Node.js 24 with ES modules (backend)

**Primary Dependencies**:
- Frontend: React 19, Vite 6, Tailwind CSS 4, Chart.js 4 + react-chartjs-2, React Router 7, Lucide React, Zustand
- Backend: Express 4, better-sqlite3 11, ws 8, dotenv, cors, csv-stringify

**Storage**: SQLite via better-sqlite3 (synchronous, in-process, zero-config). Single file `data/mgh.db`. Tables: events, conversations, customers, employees, campaigns, bookings. JSON backup to `data/backups/` daily.

**Testing**: Vitest (frontend unit + component), Node.js built-in test runner (backend API), manual WhatsApp integration testing with real phone

**Target Platform**: Oracle Cloud VM (Ubuntu 22.04, 4 OCPU, 24GB RAM). Single server runs both frontend (Vite dev or built static files served by Express) and backend.

**Project Type**: Web application — React SPA frontend + Node.js REST API backend + WebSocket server

**Performance Goals**: Dashboard first paint <2s, API <200ms p95, WebSocket latency <100ms, 50 concurrent conversations, 5 concurrent dashboard users, CSV export 10k records <30s

**Constraints**: All customer PII encrypted at rest, phone numbers hashed in logs, free-tier deployment (₹0/month), SQLite only (no external DB), single-server architecture

**Scale/Scope**: Single resort, 1 WhatsApp number, 3-5 employees, 1-5 dashboard users, 10-500 conversations/day, 10,000 customer records max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| I. Simplicity First | ✅ PASS | SQLite over PostgreSQL, Express over NestJS, Chart.js over D3, single server over microservices. Every tech choice favors simplicity. |
| II. API-First Integration | ✅ PASS | Dedicated client modules. WhatsApp tokens in .env. All external calls have timeout + error handling. |
| III. Config-Driven Behavior | ✅ PASS | Message templates, anti-detection timing params, lead scoring weights — all in config modules, not hardcoded. |
| IV. Observable & Auditable | ✅ PASS | Every event logged to SQLite events table. Phone numbers hashed. Dashboard surfaces all metrics. Error logs on system health page. |
| V. Free-Tier-First Design | ✅ PASS | All WhatsApp messages are reactive replies within 24h service window. No Cloud API costs. Phone-based WhatsApp = free. |

**Gate Result**: ALL PASS. Proceed to Phase 0.

### Post-Design Re-Check

| Principle | Status | Evidence |
|---|---|---|
| I. Simplicity First | ✅ PASS | Final design: 12 backend modules, 10 frontend components. SQLite schema is 6 tables. No ORM, no message queue, no Redis. |
| II. API-First Integration | ✅ PASS | WhatsApp client + WebSocket handler are isolated modules with clear contracts. |
| III. Config-Driven Behavior | ✅ PASS | engines/config/ holds all tunable parameters. templates/ holds all message variants. |
| IV. Observable & Auditable | ✅ PASS | events table tracks everything. Dashboard API queries aggregate in real-time. |
| V. Free-Tier-First Design | ✅ PASS | Architecture confirmed: phone-based WhatsApp, reactive-only, zero API cost. |

## Project Structure

### Documentation (this feature)

```text
specs/002-mgmt-dashboard-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contract.md  # REST API specification
└── tasks.md             # Phase 2 output (speckit-tasks)
```

### Source Code

```text
frontend/                           # React + Vite + TypeScript dashboard
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Router + layout
│   ├── index.css                   # Tailwind imports + dark theme
│   ├── types.ts                    # Shared TypeScript types
│   ├── mockData.ts                 # Development mock data
│   ├── store.ts                    # Zustand store (API state)
│   ├── api/
│   │   └── client.ts               # Axios API client
│   └── components/
│       ├── Sidebar.tsx             # Navigation sidebar
│       ├── ExecutiveDashboard.tsx  # Page 1: KPI cards, funnel, charts
│       ├── BotPerformance.tsx      # Page 2: Bot analytics
│       ├── CustomerCRM.tsx         # Page 3: Customer table + filters
│       ├── CustomerDataView.tsx    # Page 4: Split view chat + record
│       ├── Promotions.tsx          # Page 5: Segments + templates
│       ├── TeamDashboard.tsx       # Page 6: Leaderboard + details
│       ├── SystemHealth.tsx        # Page 7: Status + error logs
│       └── AdminPanel.tsx          # Page 8: Settings + config

backend/                            # Node.js Express + SQLite
├── package.json
├── .env.example
├── server.js                       # Entry point: Express + WebSocket
├── src/
│   ├── db/
│   │   ├── database.js             # SQLite connection + migrations
│   │   └── migrations/
│   │       └── 001_initial.sql     # Schema creation
│   ├── api/
│   │   ├── dashboard.js            # /api/dashboard/* routes
│   │   ├── customers.js            # /api/customers/* routes
│   │   ├── team.js                 # /api/dashboard/team/* routes
│   │   ├── system.js               # /api/system/* routes
│   │   ├── campaigns.js            # /api/campaigns/* routes
│   │   └── export.js               # /api/export/* routes
│   ├── services/
│   │   ├── eventLogger.js          # Write events to SQLite
│   │   ├── leadScorer.js           # Calculate lead scores
│   │   └── notificationService.js  # WhatsApp/Telegram alerts
│   ├── whatsapp/
│   │   ├── orchestrator.js         # WebSocket server + message processor
│   │   ├── phoneBridge.js          # Phone WebSocket client handler
│   │   └── engines/
│   │       ├── delay.js            # Anti-detection delay engine
│   │       ├── typing.js           # Fake typing burst engine
│   │       ├── idleBehavior.js     # Random idle behavior engine
│   │       ├── templatePicker.js   # Message variant selector
│   │       └── lifecycle.js        # App foreground/background scheduler
│   ├── config/
│   │   ├── timing.js               # Delay ranges, typing speeds
│   │   ├── behavior.js             # Idle behavior probabilities
│   │   ├── scoring.js              # Lead scoring weights
│   │   └── templates/             # Message templates
│   │       ├── menu.js
│   │       ├── brochure.js
│   │       ├── videos.js
│   │       ├── both.js
│   │       └── invalid.js
│   └── utils/
│       ├── hash.js                 # SHA-256 phone hashing
│       └── logger.js               # Structured logging
├── data/                           # SQLite DB + backups (gitignored)
├── tests/
│   ├── api.test.js
│   ├── eventLogger.test.js
│   ├── leadScorer.test.js
│   ├── orchestrator.test.js
│   └── engines.test.js
└── media/                          # Resort media files

phone/                              # Android Termux client
├── package.json
├── phone-client.js                 # WebSocket client + ADB executor
└── .env.example
```

**Structure Decision**: Web application with separate `frontend/` and `backend/` directories. Single `package.json` root for convenience scripts. The phone client is a separate lightweight project that runs in Termux on the Android device.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

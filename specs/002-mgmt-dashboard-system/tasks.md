# Tasks: MGH WhatsApp Management System

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 0: Project Foundation (All tasks can run in parallel)

- [ ] **T001** [P] Scaffold backend project — Create `backend/` directory, `package.json` with dependencies (express, better-sqlite3, ws, dotenv, cors, csv-stringify), `.env.example`, `server.js` skeleton with Express app + WebSocket server
- [ ] **T002** [P] Scaffold frontend project — Create `frontend/` directory with Vite + React + TypeScript template, install dependencies (react, react-dom, react-router-dom, chart.js, react-chartjs-2, zustand, lucide-react, tailwindcss), configure `vite.config.ts` with API proxy
- [ ] **T003** [P] Database setup — Create `backend/src/db/database.js` with better-sqlite3 connection, `backend/src/db/migrations/001_initial.sql` with full schema (customers, employees, conversations, events, bookings, campaigns, kpi_snapshots tables + all indexes), `npm run db:init` script to create DB + seed data
- [ ] **T004** [P] Phone client scaffold — Create `phone/` directory with `package.json`, `phone-client.js` skeleton (WebSocket client + ADB executor + notification listener), `.env.example`

---

## Phase 1: Backend Core — REST API (User Story 7)

- [ ] **T005** Environment config — Create `backend/src/config/` with `index.js` (loads dotenv, exports config object), `scoring.js` (lead score weights), `timing.js` (bot delay ranges), `behavior.js` (idle behavior probabilities)
- [ ] **T006** API middleware — Create Express middleware for CORS, auth token validation (`Authorization: Bearer`), JSON parsing, error handling wrapper
- [ ] **T007** Database service layer — Create `backend/src/db/services.js` with CRUD functions: `createCustomer`, `getCustomer`, `listCustomers` (with search/filter/sort/paginate), `updateCustomer`, `createEvent`, `listEvents`, `getConversation`, `createBooking`, `listCampaigns`, `createCampaign`
- [ ] **T008** [P] Event logger — Create `backend/src/services/eventLogger.js` with `log(eventType, data)` that writes to events table, auto-creates customer records on first contact
- [ ] **T009** [P] Lead scorer — Create `backend/src/services/leadScorer.js` with `calculateScore(customerId)` that reads all events for a customer and computes weighted score, updates customer record
- [ ] **T010** [P] Dashboard overview API — Create `backend/src/api/dashboard.js` with `GET /api/dashboard/overview` returning today/thisWeek/thisMonth KPIs, funnel data, 7-day trend, revenue by week, recent activity
- [ ] **T011** [P] Dashboard bot API — Add `GET /api/dashboard/bot` returning reply rate, menu engagement breakdown, variant performance, hourly heatmap data, top questions, recent errors
- [ ] **T012** [P] Customers API — Create `backend/src/api/customers.js` with `GET /api/customers` (search/filter/sort/paginate), `GET /api/customers/:id` (full record + conversations + bookings), `POST /api/customers`, `PUT /api/customers/:id`
- [ ] **T013** [P] Team API — Create `backend/src/api/team.js` with `GET /api/dashboard/team` (aggregate stats + leaderboard), `GET /api/dashboard/team/:employeeId` (detail + monthly trends + pipeline + recent activity)
- [ ] **T014** [P] System API — Create `backend/src/api/system.js` with `GET /api/system/health` (uptime, VM stats, phone status, Tailscale status, WhatsApp status, error log), `GET /api/health` (simple liveness)
- [ ] **T015** [P] Campaigns API — Create `backend/src/api/campaigns.js` with `GET /api/campaigns`, `POST /api/campaigns`, `POST /api/campaigns/:id/send`, `GET /api/campaigns/segment-preview`
- [ ] **T016** [P] Export API — Create `backend/src/api/export.js` with `GET /api/export/csv` streaming CSV response with csv-stringify, query params for date range and type filter
- [ ] **T017** [P] Admin API — Create `GET /api/admin/settings` and `PUT /api/admin/settings` endpoints
- [ ] **T018** Notification service — Create `backend/src/services/notificationService.js` with `notifyNewLead`, `notifyHotLead`, `notifyUnresponded` sending WhatsApp messages (via orchestrator) and/or Telegram messages (via bot API)

---

## Phase 2: WhatsApp Automation Layer (User Story 8)

- [ ] **T019** Anti-detection engines — Create `backend/src/whatsapp/engines/delay.js` (Gaussian distribution delay), `typing.js` (burst-based char input), `idleBehavior.js` (weighted random behavior selector), `lifecycle.js` (active hours schedule)
- [ ] **T020** Template picker — Create `backend/src/whatsapp/engines/templatePicker.js` with variant selection, create `backend/src/config/templates/` with `menu.js` (5 variants), `brochure.js` (4), `videos.js` (4), `both.js` (3), `invalid.js` (3) — all config-driven
- [ ] **T021** WebSocket server — Create `backend/src/whatsapp/orchestrator.js` with ws WebSocket server on port 9090, authentication middleware (PHONE_AUTH_TOKEN), phone connection tracking, command sending with ACK timeout
- [ ] **T022** Message processor — Add message processing logic to orchestrator: receive WhatsApp notification → log event → idle behavior dice roll → delay calculation → template selection → build command sequence → send to phone → wait for ACKs → update conversation state
- [ ] **T023** Phone bridge handler — Create `backend/src/whatsapp/phoneBridge.js` handling phone connect/disconnect, command ACK tracking, retry on failure
- [ ] **T024** Phone client — Complete `phone/phone-client.js`: WebSocket auto-reconnect, notification listener (termux-notification-list polling every 2s), ADB command executor (tap, swipe, type with cadence, keyevent, send_media), Shizuku shell wrapper

---

## Phase 3: Frontend Foundation

- [ ] **T025** [P] Tailwind dark theme — Configure Tailwind with dark theme, resort color palette (teal #0d9488, gold #f59e0b, coral #f97316), base styles in `index.css`
- [ ] **T026** [P] TypeScript types — Create `frontend/src/types.ts` with interfaces for all entities: Customer, Employee, Conversation, Event, Booking, Campaign, DashboardOverview, BotMetrics, TeamStats, SystemHealth, ApiResponse<T>
- [ ] **T027** [P] Zustand store — Create `frontend/src/store.ts` with state slices: dashboard, customers, team, system, campaigns, ui (active page, filters)
- [ ] **T028** [P] API client — Create `frontend/src/api/client.ts` with axios instance (base URL from Vite proxy, auth token from URL param), typed API functions: `fetchOverview()`, `fetchCustomers(params)`, `fetchTeam()`, etc.
- [ ] **T029** [P] Mock data — Create `frontend/src/mockData.ts` with seed-based generator producing realistic customers, events, bookings, conversations for development without backend
- [ ] **T030** Sidebar component — Create `frontend/src/components/Sidebar.tsx` with Lucide icons, collapsible, 8 navigation items, active page highlight, resort name/logo area
- [ ] **T031** App shell — Create `frontend/src/App.tsx` with React Router routes, Sidebar, main content area, auth token check (reads `?token=` from URL)

---

## Phase 4: Dashboard Pages (All pages can run in parallel once foundation is done)

- [ ] **T032** [P] Executive Dashboard (US1) — `ExecutiveDashboard.tsx`: 6 KPI cards (animated counters), funnel chart (horizontal bar), 7-day trend line chart, revenue bar chart, recent activity feed (last 10 events). Loading skeleton, empty state, error state.
- [ ] **T033** [P] Bot Performance (US2) — `BotPerformance.tsx`: reply rate gauge (semi-circle), menu engagement pie chart, variant comparison table (sortable), 24x7 hourly heatmap grid, top questions list, recent errors log. Loading/empty/error states.
- [ ] **T034** [P] Customer CRM (US3) — `CustomerCRM.tsx`: searchable filterable data table (name, phone, lead score with color badge, status with colored pill, tags, assigned, last contact, actions). Search bar with debounce, status dropdown filter, pagination. Click row → slide-out detail panel. Loading/empty/error states.
- [ ] **T035** [P] Customer Data View (US3) — `CustomerDataView.tsx`: split layout — left panel shows simulated WhatsApp chat (message bubbles, timestamps), right panel shows auto-populated customer record (name, phone, lead score gauge, tags, status, assigned, dates, guest count, notes, action buttons: [Send Offer] [Schedule Follow-up] [Mark as Booked])
- [ ] **T036** [P] Promotions (US4) — `Promotions.tsx`: segment builder form (tag multi-select, status checkboxes, date range, lead score slider) with live matched count, template composer (textarea with {{variable}} highlighting, variable field list, WhatsApp preview panel showing rendered message), campaign history table (name, sent, opens, clicks, bookings, revenue). Loading/empty/error states.
- [ ] **T037** [P] Team Dashboard (US5) — `TeamDashboard.tsx`: employee leaderboard cards (ranked by conversion rate, showing stats per card), click → expand to detail view with monthly booking trend line chart, response time trend, lead pipeline funnel, recent activity. Unassigned leads section. Loading/empty/error states.
- [ ] **T038** [P] System Health (US6) — `SystemHealth.tsx`: status cards (uptime, VM, phone, Tailscale, WhatsApp) with green/yellow/red indicators, error log table with timestamps, daily messages bar chart, admin action buttons ([Restart Bot] [Restart Phone] [Download Logs]). Loading/empty/error states.
- [ ] **T039** [P] Admin Panel — `AdminPanel.tsx`: settings form (resort name, WhatsApp number, notification channel toggle, Telegram bot token, admin WhatsApp, API token). Employee management (add/remove/edit employee table). Loading/empty/error states.

---

## Phase 5: Integration & Polish

- [ ] **T040** Frontend-backend integration — Connect all page components to real API endpoints instead of mock data. Remove mock data fallback. Test all 8 pages against live backend.
- [ ] **T041** Loading/empty/error states — Audit all components for: loading skeleton/spinner on initial fetch, empty state message with helpful graphic for zero data, error state with retry button for API failures, toast notifications for mutations (create/update/delete success)
- [ ] **T042** Responsive design — Ensure all pages work at 1280px+ (desktop primary). Basic tablet support (1024px). Sidebar collapses to icons on smaller screens.
- [ ] **T043** Production build — Configure Express to serve `frontend/dist/` as static files. Add `npm run build` at root that builds frontend. Add PM2 ecosystem config. Test full production build serves dashboard correctly.
- [ ] **T044** Seed data enhancement — Expand seed script to generate realistic data: 50 customers across all statuses, 200 events over 30 days, 5 employees, 5 campaigns (3 sent, 2 drafts), 30 bookings. Daily KPI snapshots for last 30 days.

---

## Phase 6: Testing

- [ ] **T045** [P] Backend API tests — `backend/tests/api.test.js`: test all endpoints with supertest. Verify response schemas, pagination, filtering, error handling, auth rejection.
- [ ] **T046** [P] Backend service tests — `backend/tests/services.test.js`: test eventLogger (creates events, auto-creates customers), leadScorer (correct score calculation for all engagement types), notificationService (mock WhatsApp/Telegram)
- [ ] **T047** [P] WhatsApp engine tests — `backend/tests/engines.test.js`: test delay engine (outputs within configured ranges), typing engine (generates correct burst structure), template picker (selects variants without repeating more than 2x in a row), idle behavior (respects configured probabilities)
- [ ] **T048** [P] Frontend component tests — `frontend/tests/`: render each dashboard page with mock data, verify KPI cards display correct values, verify charts render without errors, verify table sorting/filtering works, verify navigation between pages
- [ ] **T049** End-to-end test — Manual: Start backend + frontend + phone client. Send WhatsApp message from test phone. Verify: event logged → customer created → lead score updated → dashboard shows new lead → bot performance metrics update. Verify full admin flow: search customer → update status → assign employee → check team dashboard.

---

## Dependency Graph

```
Phase 0 (Foundation): T001, T002, T003, T004 [ALL PARALLEL]
  ↓
Phase 1 (Backend): T005 → T006 → T007
                              ↓
                    T008, T009 [P]
                              ↓
         T010, T011, T012, T013, T014, T015, T016, T017, T018 [ALL PARALLEL]
  ↓
Phase 2 (WhatsApp): T019, T020 [P] → T021 → T022 → T023
                                              ↓
                                            T024
  ↓
Phase 3 (Frontend): T025, T026, T027, T028, T029 [ALL PARALLEL]
                      ↓
                    T030 → T031
  ↓
Phase 4 (Pages): T032, T033, T034, T035, T036, T037, T038, T039 [ALL PARALLEL]
  ↓
Phase 5 (Integration): T040 → T041 → T042 → T043 → T044
  ↓
Phase 6 (Testing): T045, T046, T047, T048 [PARALLEL] → T049
```

**Total Tasks**: 49
**Checkpoint Groups**: After each Phase — verify checkpoint before proceeding to next Phase.

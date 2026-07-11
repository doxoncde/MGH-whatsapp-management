# Tasks: Cloudflare Edge Brain

**Input**: Design documents from `specs/004-cloudflare-edge/`

**Prerequisites**: spec.md ✅, plan.md ✅, architecture.md ✅, checklists/architecture.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Cloudflare Workers project initialization, NeonDB schema, wrangler config

- [ ] T001 Create `cloudflare/` directory with wrangler.toml, package.json, tsconfig.json, .dev.vars
- [ ] T002 [P] Initialize Cloudflare Workers project with `wrangler init` — TypeScript, Durable Objects enabled
- [ ] T003 [P] Install dependencies: `@neondatabase/serverless`, `itty-router`, `hono` (or chosen router), `ws` type definitions
- [ ] T004 [P] Create NeonDB PostgreSQL schema migration in `cloudflare/src/db/migrations/001_initial.sql` — port from `backend/src/db/migrations/001_initial.sql` (SQLite → PostgreSQL syntax)
- [ ] T005 Create `cloudflare/src/db/neon-client.ts` — NeonDB connection via `@neondatabase/serverless`, query wrapper, connection pool config
- [ ] T006 Export existing sql.js SQLite data and import into NeonDB — verification script to confirm row counts match

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create `cloudflare/src/orchestrator-do.ts` — Durable Object class with `fetch()` and WebSocket lifecycle hooks (`webSocketMessage`, `webSocketClose`, `webSocketError`)
- [ ] T008 Implement DO WebSocket auth — validate `phoneAuthToken` on first message, track authenticated state per connection
- [ ] T009 [P] Create `cloudflare/src/worker.ts` — Worker entry point with `itty-router`/Hono routing, mount orchestrator DO via `DurableObjectNamespace`
- [ ] T010 [P] Create `cloudflare/src/middleware/auth.ts` — Bearer token validation middleware for Worker API routes
- [ ] T011 [P] Create `cloudflare/src/middleware/cors.ts` — CORS headers middleware for Worker
- [ ] T012 Port `backend/src/utils/phoneParser.js` → `cloudflare/src/utils/phoneParser.ts` — identical normalization logic, TypeScript types
- [ ] T013 Set up wrangler.toml with DO binding (`orchestrator`), env vars (API_TOKEN, PHONE_AUTH_TOKEN, DATABASE_URL), routes

**Checkpoint**: DO + Worker deployable. Phone can connect and authenticate. Worker returns 200 on `/api/health`.

---

## Phase 3: User Story 1 — Bot Auto-Replies (Priority: P1) 🎯 MVP

**Goal**: Phone sends WhatsApp notification to DO, DO picks template, scores lead, logs event, sends reply command. Phone executes reply with timing.

**Independent Test**: Phone → DO WebSocket → send test "Hi" → verify reply received with correct template + delay

### Implementation for US1

- [ ] T014 [P] [US1] Port template picker: `backend/src/whatsapp/engines/templatePicker.js` → `cloudflare/src/engines/templatePicker.ts` — identical variant selection algorithm, all 5 menu + 4 brochure + 4 video + 3 both + 3 invalid variants
- [ ] T015 [P] [US1] Port lead scorer: `backend/src/services/leadScorer.js` → `cloudflare/src/engines/leadScorer.ts` — identical scoring weights, score thresholds (cold/warm/hot/qualified)
- [ ] T016 [US1] Implement `handleWhatsAppMessage()` in DO — parse message, check admin command, route to template picker, call scorer, write to DO SQLite state
- [ ] T017 [US1] Implement DO → NeonDB event logging: `cloudflare/src/db/neon-client.ts` insert event function with all event types (menu_sent, brochure_requested, etc.)
- [ ] T018 [US1] Implement DO → NeonDB customer management: ensureCustomer(), updateCustomer(), hashPhone()
- [ ] T019 [US1] Implement DO → Phone command dispatch: format command JSON `{ type: 'command', action: 'send_message', payload: { recipient, text } }` and send over WebSocket
- [ ] T020 [US1] Complete phone-client timing engine: Gaussian delay (calculateDelay), typing simulation (buildTypeCommand), idle behavior execution (local setTimeout chains)
- [ ] T021 [US1] Wire phone-client WebSocket to Cloudflare DO URL (replace `VM_URL` with DO `wss://` endpoint)
- [ ] T022 [US1] Implement phone ack back to DO: after executing command, send `{ type: 'ack', commandId, status }`

**Checkpoint**: Full message loop working — WhatsApp notification → DO processing → phone reply → ack. Template rotation persists across hibernation.

---

## Phase 4: User Story 2 — Dashboard API (Priority: P1)

**Goal**: Worker serves all 12 existing API endpoints, identical response contracts, data from NeonDB

**Independent Test**: Deploy Worker. Point Vercel frontend. Verify all dashboard panels load real data.

### Implementation for US2

- [ ] T023 [P] [US2] Port dashboard overview endpoint → `worker.ts` route: `GET /api/dashboard/overview` — KPI cards, funnel, 7-day trend, recent activity, revenue
- [ ] T024 [P] [US2] Port bot performance endpoint → `worker.ts` route: `GET /api/dashboard/bot` — engagement rates, variant A/B performance, hourly heatmap
- [ ] T025 [P] [US2] Port customers CRUD → `worker.ts` routes: `GET /api/customers` (list/search/filter/paginate), `GET /api/customers/:id`, `PUT /api/customers/:id`
- [ ] T026 [P] [US2] Port team endpoint → `worker.ts` route: `GET /api/dashboard/team` — employee list, leaderboard, per-employee stats
- [ ] T027 [P] [US2] Port campaigns endpoint → `worker.ts` routes: `GET /api/campaigns`, `POST /api/campaigns`, `POST /api/campaigns/segment-preview`, `POST /api/campaigns/:id/send`
- [ ] T028 [P] [US2] Port export endpoint → `worker.ts` route: `GET /api/export/csv` — CSV generation with date-range filter
- [ ] T029 [P] [US2] Port system health endpoint → `worker.ts` route: `GET /api/system/health` — uptime, DO status, phone connection status
- [ ] T030 [US2] Implement health endpoint → `worker.ts` route: `GET /api/health` — returns `{ status: 'ok', uptime }`
- [ ] T031 [US2] Update `frontend/.env` — change `VITE_API_URL` from Oracle VM URL to Cloudflare Worker URL
- [ ] T032 [US2] Test all endpoints with curl/postman — verify identical response shapes to old Express API

**Checkpoint**: Dashboard fully functional. All 12 API endpoints return correct data from NeonDB.

---

## Phase 5: User Story 3 — Admin SD Command (Priority: P1)

**Goal**: Admin sends "SD <phone>" → DO parses → normalizes → commands phone to send menu → confirms to admin

**Independent Test**: Send "SD 9876543210" from admin WhatsApp → verify lead receives menu, admin gets confirmation

### Implementation for US3

- [ ] T033 [US3] Implement admin command detection in DO message handler — call `isAdminCommand()` before normal template routing
- [ ] T034 [US3] Implement `handleAdminCommand()` in DO — parse SD command, normalize phone, pick menu template, dispatch to phone
- [ ] T035 [US3] Implement admin confirmation reply — after successful SD, send confirmation WhatsApp to admin number
- [ ] T036 [US3] Handle edge cases: invalid phone number (< 7 digits), non-numeric characters, empty message after SD prefix
- [ ] T037 [US3] Implement STATUS command — return bot uptime, connected phone count, port info to admin

**Checkpoint**: SD command works end-to-end. International numbers handled. Invalid numbers return error to admin.

---

## Phase 6: User Story 4 — Phone Call IVR (Priority: P2)

**Goal**: Phone detects incoming call → DO triggers IVR sequence → phone answers, plays greeting via tinymix, hangs up → DO sends WhatsApp menu to caller

**Independent Test**: Call MGH number → verify auto-answer, greeting audio, hangup, WhatsApp menu received

### Implementation for US4

- [ ] T038 [US4] Implement `handleIncomingCall()` in DO — receive `incoming_call` from phone, notify admin, dispatch IVR sequence command
- [ ] T039 [US4] Complete phone-client IVR actuator: verify answer_call, hangup, play_audio_uplink, enable_speakerphone commands work end-to-end
- [ ] T040 [US4] Prepare Hindi greeting WAV — record or TTS-generate, convert to mono 16kHz PCM, push to `/data/local/tmp/mgh-greeting.wav`
- [ ] T041 [US4] Calibrate speakerphone tap coordinates — enable Pointer Location, note X,Y during active call, update phone-client constants
- [ ] T042 [US4] Verify tinymix `Incall_Music Audio Mixer` control exists on Realme X2 Pro — `su -c 'tinymix | grep -i incall'`
- [ ] T043 [US4] Implement post-IVR WhatsApp send — after IVR sequence (~15s), DO picks menu and dispatches to caller number
- [ ] T044 [US4] Handle edge case: tinymix control missing → log error, notify admin, fallback to missed-call WhatsApp send

**Checkpoint**: Full IVR loop works — call → auto-answer → greeting → hangup → WhatsApp menu. Admin notified at each step.

---

## Phase 7: User Story 5 — Auto-Recovery (Priority: P2)

**Goal**: Phone crash/reboot → dashboard stays online → phone reconnects automatically → bot resumes

**Independent Test**: Kill phone process → verify dashboard still works → restart phone → verify bot resumes

### Implementation for US5

- [ ] T045 [US5] Configure PM2 auto-start on boot: `pm2 startup`, `pm2 save` — verify phone-client.js starts after reboot
- [ ] T046 [US5] Implement WebSocket reconnect with exponential backoff: min 1s, max 30s, jitter, unlimited retries
- [ ] T047 [US5] Implement stale command cleanup: phone ignores commands older than 60s on reconnect
- [ ] T048 [US5] Implement DO reconnect handling: when phone reconnects with same phoneId, close old WebSocket, accept new one
- [ ] T049 [US5] Add phone connection status to Worker health endpoint: GET /api/system/health returns `phoneStatus: 'connected' | 'disconnected'`
- [ ] T050 [US5] Test full crash-recovery cycle: kill Termux process → verify dashboard online → wait for phone auto-restart → verify bot resumes processing messages

**Checkpoint**: System auto-recovers from phone failure. Dashboard never goes down.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements across all user stories

- [ ] T051 [P] Verify all DO state variables use `this.ctx.storage` — audit for any in-memory-only state that could be lost to hibernation
- [ ] T052 [P] Add logging to DO and Worker — structured JSON logs, error tracing
- [ ] T053 Implement idle behavior decision engine in DO — selectBehavior(), getBehaviorCommands(), dispatch to phone for execution
- [ ] T054 [P] Add rate limiting to Worker API endpoints — Cloudflare built-in or custom middleware
- [ ] T055 [P] Create deployment script — `wrangler deploy` for Worker + DO, `vercel --prod` for frontend
- [ ] T056 Document migration steps in `docs/CLOUDFLARE-MIGRATION.md` — how to deploy, rollback, verify
- [ ] T057 Validate all 65 checklist items from `checklists/architecture.md` — mark resolved items
- [ ] T058 Test end-to-end: WhatsApp message → DO → template → phone reply → NeonDB logged → dashboard shows data
- [ ] T059 Test end-to-end: phone call → IVR sequence → WhatsApp menu → admin notification
- [ ] T060 Test end-to-end: admin SD command → phone pushes menu → admin confirmation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — bot auto-reply MVP
- **US2 (Phase 4)**: Depends on Phase 2 — dashboard API (can parallel with US1 if separate developer)
- **US3 (Phase 5)**: Depends on Phase 2 — SD command (can parallel with US1/US2)
- **US4 (Phase 6)**: Depends on US1 (reuses phone-client send + DO template picker)
- **US5 (Phase 7)**: Depends on US1 (reconnect requires working WebSocket + message loop)
- **Polish (Phase 8)**: Depends on all desired user stories complete

### Within Each User Story

- DO logic before phone-client wiring
- Template/engines porting before message handler
- Command dispatch before phone actuator implementation
- Happy path before edge cases

### Parallel Opportunities

- T002, T003, T004: All setup tasks in Phase 1
- T009, T010, T011: Worker, auth middleware, CORS middleware
- T014, T015: Template picker and lead scorer porting
- T023-T029: All Worker API endpoints
- US1, US2, US3 can be worked on in parallel after Phase 2 is done

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 (bot auto-reply)
4. Complete Phase 4: US2 (dashboard API)
5. **STOP and VALIDATE**: WhatsApp bot + dashboard work on Cloudflare
6. Deploy! This is the minimum viable replacement for Oracle VM.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → Bot + Dashboard live on Cloudflare (MVP!)
3. US3 → SD command for sales team
4. US4 → Phone call IVR
5. US5 → Auto-recovery from phone crashes
6. Polish → Logging, rate limiting, deployment docs

### Parallel Team Strategy (if multiple devs)

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (bot auto-reply)
   - Developer B: User Story 2 (dashboard API)
   - Developer C: User Story 3 (SD command)
3. US4 and US5 follow after US1 completion

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All DO state MUST use `this.ctx.storage` — audit before declaring US1 complete
- Phone-client owns all setTimeout timing — DO never controls WHEN, only WHAT

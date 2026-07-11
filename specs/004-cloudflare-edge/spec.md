# Feature Specification: Cloudflare Edge Brain Architecture

**Feature Branch**: `004-cloudflare-edge`

**Created**: 2026-07-11

**Status**: Draft

**Input**: Migrate the WhatsApp bot backend from Oracle VM (Node.js + Express + WebSocket) to Cloudflare Workers + Durable Objects edge infrastructure, while keeping the phone as a pure I/O actuator.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Phone Connects and Bot Auto-Replies (Priority: P1)

A customer sends "Hi" to the MGH WhatsApp number. The phone detects the notification, sends it to Cloudflare DO via WebSocket. The DO picks a menu template, logs the event, scores the lead, and sends the reply command back to the phone. The phone executes the WhatsApp send with Gaussian delay and typing simulation. The customer receives a human-like reply.

**Why this priority**: Core revenue function. Without this, the bot does nothing.

**Independent Test**: Connect phone to DO WebSocket. Send "Hi" from test WhatsApp. Verify reply arrives with correct menu template, delay 2-8s, typing simulation.

**Acceptance Scenarios**:

1. **Given** phone connected to DO WebSocket and authenticated, **When** customer sends "1" or "brochure", **Then** DO picks brochure template, phone sends it with Gaussian delay, event logged to NeonDB
2. **Given** phone connected, **When** customer sends "2" or "video", **Then** DO picks video template, phone sends it
3. **Given** phone connected, **When** customer sends price/rate query, **Then** DO triggers hot lead alert + sends menu reply
4. **Given** DO has just woken from hibernation, **When** customer message arrives, **Then** DO restores template index from `this.ctx.storage` and picks next non-repeating variant

---

### User Story 2 — Dashboard API Works via Worker (Priority: P1)

The Vercel React dashboard calls Cloudflare Worker endpoints instead of the old Express server. All KPIs, customer lists, campaign data, and CSV exports work identically.

**Why this priority**: Dashboard is how the business operates. Can't go down during migration.

**Independent Test**: Deploy Worker. Point frontend `.env` to Worker URL. Verify all dashboard panels load data from NeonDB.

**Acceptance Scenarios**:

1. **Given** Worker deployed with NeonDB connected, **When** dashboard loads, **Then** KPI cards show real data from events/bookings tables
2. **Given** Worker deployed, **When** admin searches customers by name/tag/status, **Then** paginated filtered results return
3. **Given** Worker deployed, **When** admin creates a campaign, **Then** campaign saved to NeonDB and visible in campaign list
4. **Given** Worker deployed, **When** admin requests CSV export, **Then** CSV downloads with correct date-range filtered data

---

### User Story 3 — Admin SD Command Pushes Leads (Priority: P1)

Admin sends "SD 9876543210" from their WhatsApp to the MGH number. The DO parses the command, normalizes the number, picks a menu template, and commands the phone to send it to the lead. Admin gets a confirmation reply.

**Why this priority**: Sales team's primary outbound tool. Must work day one.

**Independent Test**: Send "SD 9876543210" from admin WhatsApp. Verify lead receives menu within 5-10s, admin gets confirmation.

**Acceptance Scenarios**:

1. **Given** phone connected, **When** admin sends "SD 9876543210", **Then** DO normalizes to +919876543210, phone sends menu to that number, admin receives "✅ Menu sent to +919876543210"
2. **Given** phone connected, **When** admin sends "SD +44 7700 900123", **Then** UK number preserved, menu sent correctly
3. **Given** phone connected, **When** admin sends "SD 0 98765 43210", **Then** spaces and leading zero stripped, normalized correctly
4. **Given** phone connected, **When** admin sends random non-command message, **Then** DO does NOT trigger SD — message routes through normal template picker

---

### User Story 4 — Phone Call IVR Works (Priority: P2)

A prospect calls the MGH number. The phone detects RINGING state, sends event to DO. DO triggers IVR sequence: phone auto-answers, plays greeting via tinymix, hangs up. DO then commands phone to send WhatsApp menu to caller.

**Why this priority**: Voice channel captures leads who don't use WhatsApp. Valuable but secondary to text channel.

**Independent Test**: Call MGH number from another phone. Verify auto-answer, greeting audio, hangup, WhatsApp menu received.

**Acceptance Scenarios**:

1. **Given** phone connected and greeting WAV on device, **When** incoming call detected (mCallState 0→1), **Then** phone sends `incoming_call` to DO, DO notifies admin
2. **Given** `incoming_call` received by DO, **When** DO sends `ivr_sequence` command, **Then** phone executes answer → speakerphone → tinymix play → hangup sequence locally within 15s
3. **Given** IVR sequence complete, **When** DO sends WhatsApp menu to caller, **Then** caller receives menu message
4. **Given** tinymix `Incall_Music Audio Mixer` control missing on device, **When** IVR sequence triggers, **Then** error logged, admin notified, fallback to missed-call WhatsApp send

---

### User Story 5 — System Auto-Recovers from Phone Failure (Priority: P2)

The phone crashes or reboots at 2 AM. When it boots back up, PM2 starts phone-client.js, which reconnects to the DO WebSocket. The DO re-authenticates the phone. The bot resumes normal operation with zero human intervention. The dashboard and API were never down because they run on Cloudflare, not the phone.

**Why this priority**: The core architectural advantage. Without this, the migration doesn't deliver its main value.

**Independent Test**: Kill the phone process. Verify dashboard still works during outage. Restart phone. Verify bot resumes automatically.

**Acceptance Scenarios**:

1. **Given** phone process killed (simulating crash), **When** dashboard is accessed, **Then** dashboard still loads from Worker API — no dependency on phone
2. **Given** phone reboots and PM2 auto-starts phone-client, **When** phone-client reconnects WebSocket, **Then** DO authenticates and resumes sending commands
3. **Given** phone was mid-IVR-sequence at crash, **When** phone reconnects, **Then** DO does NOT replay old IVR — stale commands are abandoned
4. **Given** phone disconnected for > 5 minutes, **When** admin checks system health, **Then** dashboard shows phone as "Disconnected" but API is "Healthy"

---

### Edge Cases

- What happens when DO hibernates between receiving a `whatsapp_message` and sending the reply command? (Hibernation API: DO wakes on incoming message, processes synchronously)
- What happens when two phones connect with same `phoneAuthToken`? (Last-connect-wins, previous WebSocket closed)
- What happens when NeonDB cold start (~500ms) delays a dashboard query? (Worker waits, user sees slight spinner — acceptable)
- What happens when Cloudflare Free plan limits are hit mid-month? (DO stops accepting — admin must be alerted before this happens)
- What happens when the phone has no internet but WhatsApp notifications arrive locally? (Notifications queued in Android, sent to DO when internet returns — but ordering may be lost)
- How does the system handle WhatsApp message deduplication if the same notification is polled twice? (DO uses messageID hash + 5s dedup window)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace `orchestrator.js` (Node.js WebSocket server) with a Cloudflare Durable Object that handles WebSocket connections from the phone
- **FR-002**: System MUST replace `server.js` (Express HTTP API) with a Cloudflare Worker that serves REST endpoints to the Vercel dashboard
- **FR-003**: DO MUST persist all state that survives beyond a single message to `this.ctx.storage` (SQLite) to survive hibernation
- **FR-004**: DO MUST connect to NeonDB via `@neondatabase/serverless` HTTP driver for customer data, events, bookings, and campaigns
- **FR-005**: Phone-client MUST own all `setTimeout`-based timing (Gaussian delays, typing simulation, IVR sequences) — DO only sends WHAT to do, not WHEN
- **FR-006**: Phone-client MUST initiate WebSocket connection to DO as an outbound client (phone has no public IP due to CGNAT)
- **FR-007**: Phone-client MUST authenticate with `phoneAuthToken` on every WebSocket connect
- **FR-008**: Worker API MUST authenticate dashboard requests with Bearer token matching existing `API_TOKEN`
- **FR-009**: System MUST maintain identical templatePicker algorithm (non-repeating randomized variant selection) in the DO
- **FR-010**: System MUST maintain identical lead scoring weights and event types in the DO
- **FR-011**: System MUST auto-recover from phone reboot within 60 seconds without human intervention
- **FR-012**: Worker API MUST serve all existing endpoints with identical request/response contracts (/api/dashboard, /api/customers, /api/campaigns, /api/export, /api/system)
- **FR-013**: DO MUST handle admin SD commands with identical phone number normalization logic (default +91, support international, strip spaces/dashes)
- **FR-014**: DO MUST notify admin via phone WhatsApp for new leads, hot leads, and incoming calls

### Key Entities

- **Cloudflare Durable Object**: Stateful WebSocket server. Single-threaded per object. Has SQLite storage via `this.ctx.storage`. Hibernates when idle. Replaces Express WebSocket server.
- **Cloudflare Worker**: Stateless HTTP request handler. Runs at edge (Chennai PoP). Replaces Express REST API.
- **NeonDB Connection**: PostgreSQL access via HTTP tunnel (`@neondatabase/serverless`). No raw TCP sockets available in Workers runtime.
- **Phone Client**: Stripped-down actuator. No business logic. Only sensors (polling) + actuators (ADB/tinymix/wa.me) + timing (setTimeout). Connects outbound WebSocket to DO.
- **DO SQLite Storage**: Per-DO key-value store. Persists template indices, anti-detection timestamps, conversation FSM state. Must survive hibernation cycles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Phone reconnects to DO and resumes bot operation within 60 seconds of reboot
- **SC-002**: Dashboard API latency is < 100ms from Chennai edge to Kerala client (vs 400ms through US-based GCP)
- **SC-003**: WhatsApp reply latency is indistinguishable from current Oracle VM behavior (DO processes message in < 500ms)
- **SC-004**: Zero human intervention required for system recovery after phone crash
- **SC-005**: All 12 existing API endpoints return identical responses post-migration
- **SC-006**: Template picker produces non-repeating variant sequences identical to current algorithm
- **SC-007**: Lead scoring produces identical scores for identical event sequences
- **SC-008**: Zero data loss during migration — all existing customer/event/booking data migrated to NeonDB

## Assumptions

- Cloudflare Chennai PoP latency to Kerala is 10-20ms (to be validated with real ping test)
- `@neondatabase/serverless` driver is compatible with Wrangler/Cloudflare Workers runtime
- Phone's `termux-notification-list` works reliably on PixelOS 13 with Termux:API installed
- Magisk `su -c` works for `tinymix` and `input` commands on PixelOS custom ROM
- PM2 auto-starts `phone-client.js` on boot (configured with `pm2 startup` and verified)
- WhatsApp works on rooted custom ROM (validated on PixelOS + Magisk)
- Existing sql.js/SQLite data can be exported and imported into NeonDB PostgreSQL
- Vercel frontend can reach Cloudflare Worker URL without CORS issues
- Cloudflare Free plan limits (1M DO requests/month, 100K Worker requests/day) are sufficient for current traffic

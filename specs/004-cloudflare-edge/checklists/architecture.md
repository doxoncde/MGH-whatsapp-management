# Architecture Migration Requirements Checklist: Cloudflare Edge Brain

**Purpose**: Validate that requirements for migrating from Oracle VM to Cloudflare DO + Workers are complete, unambiguous, and implementation-ready
**Created**: 2026-07-11
**Feature**: `specs/004-cloudflare-edge/plan.md`, `architecture.md`
**Focus**: Full coverage (architecture, API, WebSocket, DB, security) — pre-implementation sanity check
**Risk emphasis**: DO Hibernation state loss, WebSocket reconnect, NeonDB cold start

---

## Requirement Completeness — DO Hibernation State Safety

- [ ] CHK001 Are ALL state variables that persist beyond a single message explicitly enumerated in the hibernation contract? [Completeness, Architecture §Hibernation Contract]
- [ ] CHK002 Is the template rotation index persistence strategy defined for each category (menu, brochure, video, both, invalid)? [Completeness, Architecture §State Management]
- [ ] CHK003 Are anti-detection timestamps (last scroll, last viewContact, last fakeType) individually accounted for in DO storage? [Completeness, Architecture §State Management]
- [ ] CHK004 Is the conversation FSM state model documented — including all valid states, transitions, and default state after hibernation wake? [Gap, Architecture §Data Flow]
- [ ] CHK005 Is there a requirement that the DO verifies all `this.ctx.storage.get()` results return valid data before proceeding with message processing? [Clarity, Architecture §Hibernation Contract]
- [ ] CHK006 Are zero-state requirements defined for the first-ever message after DO deployment (no prior storage entries)? [Coverage, Gap]
- [ ] CHK007 Is the lead score cache persistence strategy specified — recompute on every message, cache for N minutes, or always persist? [Clarity, Architecture §State Management]
- [ ] CHK008 Are requirements defined for what happens when a conversation spans multiple hibernation cycles (customer messages, DO wakes, hibernates, customer messages again)? [Coverage, Edge Case]

## Requirement Completeness — WebSocket Reconnect Reliability

- [ ] CHK009 Is the phone → DO WebSocket reconnect flow fully specified, including auth re-negotiation after disconnect? [Completeness, Architecture §Data Flow]
- [ ] CHK010 Are exponential backoff requirements defined for WebSocket reconnect attempts (min delay, max delay, jitter, max retries)? [Gap, Tracker §Risks & Blockers]
- [ ] CHK011 Are duplicate message handling requirements specified when the phone reconnects and re-sends WhatsApp notifications that were in-flight during disconnect? [Coverage, Edge Case]
- [ ] CHK012 Is the scenario defined where the phone connects but the DO has hibernated — does the phone wait for DO wake, or does the DO wake on WebSocket connect? [Clarity, Architecture §Hibernation Contract]
- [ ] CHK013 Are requirements specified for what happens when the DO sends a command but the phone disconnects before the ack arrives? [Coverage, Exception Flow]
- [ ] CHK014 Is a heartbeat/ping mechanism specified to detect silent WebSocket disconnections? [Gap]
- [ ] CHK015 Are requirements defined for the phone detecting and handling WebSocket message ordering guarantees (or lack thereof)? [Clarity]

## Requirement Completeness — NeonDB Migration

- [ ] CHK016 Is the SQLite → PostgreSQL schema migration strategy documented (one-time migration script, dual-write, cutover plan)? [Completeness, Plan §Migration Effort]
- [ ] CHK017 Are the SQL dialect differences between sql.js/WASM and PostgreSQL explicitly catalogued (datetime functions, JSON handling, parameter binding)? [Gap, Clarity]
- [ ] CHK018 Is the `@neondatabase/serverless` driver connection pool configuration specified (max connections, idle timeout, retry on cold start)? [Completeness, Architecture §Edge Constraints]
- [ ] CHK019 Are requirements defined for NeonDB cold start latency — is 500ms first-query delay acceptable, and is there a timeout/retry strategy for queries that hit the cold start window? [Clarity, Architecture §Edge Constraints]
- [ ] CHK020 Is the seed data migration specified — should seed.js be rewritten for PostgreSQL syntax and re-executed on NeonDB? [Gap]
- [ ] CHK021 Are database error handling requirements defined for the Worker context — what HTTP status code and error body format when NeonDB is unreachable? [Completeness, Gap]

## Requirement Completeness — Worker API Parity

- [ ] CHK022 Is the full API endpoint inventory documented with exact parity mapping between existing Express routes and planned Worker routes? [Completeness, Architecture §API Surface]
- [ ] CHK023 Are the Express middleware requirements (CORS, JSON parsing, Bearer auth) explicitly ported to Worker request handling? [Completeness, Architecture §API Surface]
- [ ] CHK024 Is the Vite proxy configuration update specified — frontend currently proxies `/api` to `localhost:3001`, what does it proxy to after migration? [Gap, Plan §What Gets Replaced]
- [ ] CHK025 Are CSRF/CORS requirements defined for the Vercel frontend calling the Worker API (cross-origin between vercel.app and workers.dev)? [Coverage, Security]
- [ ] CHK026 Is the rate limiting strategy specified for Worker API endpoints (Cloudflare's built-in rate limiting or custom)? [Gap]
- [ ] CHK027 Are requirements defined for the Worker health endpoint — does it check NeonDB connectivity, DO liveness, or just Worker alive? [Clarity, Architecture §API Surface]

## Requirement Completeness — Phone-Client Actuator Contract

- [ ] CHK028 Is the complete command vocabulary that the DO can send to the phone fully enumerated (send_message, answer_call, hangup, play_audio_uplink, enable_speakerphone, ivr_sequence, + any future)? [Completeness, Architecture §DO (WebSocket)]
- [ ] CHK029 Is the phone-client expected response format specified for each command type (ack with what fields, error format)? [Clarity, Architecture §DO (WebSocket)]
- [ ] CHK030 Are requirements defined for what the phone should do when it receives a command it doesn't recognize (new command added to DO but phone not yet updated)? [Coverage, Edge Case]
- [ ] CHK031 Is the device calibration data (send button coordinates, speakerphone coordinates, greeting WAV path) explicitly identified as phone-local configuration, not sent from DO? [Clarity, Architecture §Timing Engine]
- [ ] CHK032 Is the timing engine contract specified — does the phone report timing decisions (actual delay used) back to DO, or only ack the final result? [Assumption]
- [ ] CHK033 Are requirements defined for the phone's local state — what happens if the phone reboots mid-IVR sequence? [Coverage, Exception Flow]

## Requirement Completeness — Security & Auth

- [ ] CHK034 Is the phoneAuthToken transmission specified — is it sent over WebSocket in plaintext, and is WSS (TLS) required? [Clarity, Architecture §DO (WebSocket)]
- [ ] CHK035 Are Worker API authentication requirements explicitly defined — same Bearer token as Express, or new token generation? [Clarity, Architecture §API Surface]
- [ ] CHK036 Is the IVR webhook HMAC secret validation specified (for future MSG91 integration)? [Gap, Architecture §API Surface]
- [ ] CHK037 Are requirements defined for API token rotation — how to update the token on both Worker and phone-client without downtime? [Coverage, Edge Case]
- [ ] CHK038 Is the customer phone hash algorithm explicitly documented to be consistent between sql.js and PostgreSQL (SHA-256, same truncation)? [Clarity, Architecture §State Management]

## Requirement Clarity — Ambiguities & Conflicts

- [ ] CHK039 Is the "DO waits ~15s (IVR duration)" in the call flow defined precisely — is it a hard 15s timer, or should the DO wait for the phone ack instead? [Ambiguity, Architecture §Data Flow - IVR]
- [ ] CHK040 Is the idleBehavior engine split clearly defined — what decisions does DO make vs what does the phone execute? [Ambiguity, Plan §What Gets Replaced]
- [ ] CHK041 Are the admin command parsing requirements consistent between the current `phoneParser.js` implementation and the planned DO port? [Consistency, Architecture §Data Flow - SD Command]
- [ ] CHK042 Is "10-50K DO requests/month" validated against the actual WhatsApp message volume estimate? [Assumption, Plan §Free Plan Limits]
- [ ] CHK043 Is it specified whether the phone-client sends raw notification text to DO, or pre-parsed sender/message fields? [Clarity, Architecture §Data Flow - WhatsApp]
- [ ] CHK044 Are the welcome/greeting template requirements unchanged in the migration — or does the DO-hosted templatePicker introduce new template variation behavior? [Consistency]

## Scenario Coverage — Failure Modes

- [ ] CHK045 Are requirements specified for what happens when NeonDB is unreachable for > 1 minute — does the bot queue messages, drop them, or error? [Coverage, Exception Flow]
- [ ] CHK046 Are requirements defined for GPS/location failure scenarios — what happens when the phone has no internet but WhatsApp notifications are local? [Coverage, Edge Case]
- [ ] CHK047 Is the scenario specified where the DO receives a `whatsapp_message` but the phone disconnects before receiving the reply command? [Coverage, Exception Flow]
- [ ] CHK048 Are requirements defined for when Cloudflare Workers free tier limits are exceeded — does the system degrade gracefully or hard-fail? [Coverage, Edge Case]
- [ ] CHK049 Is the scenario defined where two phones connect simultaneously with the same phoneAuthToken — which one gets commands? [Coverage, Edge Case]
- [ ] CHK050 Is the `tinymix` control failure handling specified — what if the `Incall_Music Audio Mixer` control is missing or returns an error on this specific phone? [Coverage, Exception Flow, Architecture §Timing Engine]

## Non-Functional Requirements

- [ ] CHK051 Are latency requirements specified for the DO → NeonDB query path — what is the maximum acceptable query latency for dashboard responsiveness? [Gap, Performance]
- [ ] CHK052 Are throughput requirements specified — maximum WhatsApp messages per minute the system must handle without degradation? [Gap, Performance]
- [ ] CHK053 Is the DO CPU budget specified — what is the maximum expected CPU time per message (template picking + scoring + NeonDB write)? [Gap, Architecture §Edge Constraints]
- [ ] CHK054 Are monitoring/alerting requirements defined — when should the admin be notified of system degradation (DO errors, phone disconnect > N minutes)? [Gap, Observability]
- [ ] CHK055 Are logging requirements specified for the DO context — what log levels, what information, and where do Cloudflare Worker logs go? [Gap, Observability]

## Dependencies & Assumptions

- [ ] CHK056 Is the assumption that "Cloudflare Chennai PoP is ~10-20ms from Kerala" validated with a real latency test? [Assumption, Plan §Why This Architecture Wins]
- [ ] CHK057 Is the dependency on `@neondatabase/serverless` package version and compatibility explicitly stated? [Dependency, Architecture §Edge Constraints]
- [ ] CHK058 Is the assumption that "PM2 auto-starts phone-client.js on phone boot" validated — has this been tested on the Realme X2 Pro with PixelOS? [Assumption, Architecture §Mitigations]
- [ ] CHK059 Is the assumption that "WhatsApp works on rooted PixelOS with Magisk" validated on the specific device and ROM build? [Assumption]
- [ ] CHK060 Is the Vercel → Cloudflare Worker HTTPS connectivity validated — are there any CORS or domain allowlist requirements? [Dependency, Architecture §Architecture Diagram]

## Acceptance Criteria Quality

- [ ] CHK061 Are measurable success criteria defined for the migration — e.g., "System auto-recovers within 60s of phone reboot without human intervention"? [Measurability, Tracker §Risks & Blockers]
- [ ] CHK062 Can "phone receives commands and sends acks within expected latency" be objectively verified with the specified metrics? [Measurability]
- [ ] CHK063 Are rollback requirements defined — if the Cloudflare migration fails, can the system revert to Oracle VM with the existing code? [Coverage, Recovery Flow]
- [ ] CHK064 Is the migration cutover strategy specified — blue/green, canary, or hard cutover with downtime window? [Gap]
- [ ] CHK065 Is there a validation checklist defined for confirming that the WhatsApp bot's reply behavior is identical pre- and post-migration (template content, delays, anti-detection)? [Coverage, Migration Validation]

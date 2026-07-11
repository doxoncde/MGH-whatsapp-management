# Implementation Plan: WhatsApp Auto-Reply Bot for MGH Resort

**Branch**: `001-whatsapp-auto-reply` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-whatsapp-auto-reply/spec.md`

## Summary

A Node.js Express webhook server that integrates with Meta's WhatsApp Cloud API v21. When a customer messages the resort's WhatsApp number, the system replies with a numbered menu. Based on the customer's choice (1/2/3), it sends the resort brochure PDF and/or pre-configured videos. All messages stay within the free 24-hour service window. The server is stateless beyond an in-memory conversation tracker with 24-hour TTL.

## Technical Context

**Language/Version**: Node.js v24 (ECMAScript modules — ESM)

**Primary Dependencies**: Express.js 4.x (HTTP server + webhook routing), axios 1.x (Meta API HTTP client), dotenv (environment config), form-data 4.x (media upload), fs-extra (async file I/O)

**Storage**: In-memory `Map<string, ConversationState>` with periodic JSON backup to `data/conversations.json`. No database required. States expire after 24 hours.

**Testing**: Manual WhatsApp sandbox testing via ngrok tunnel + console logs. Automated: Jest with `msw` (Mock Service Worker) for Meta API mocking.

**Target Platform**: Linux/Windows server (any VPS or Railway/Render free tier) with Node.js runtime and a public HTTPS URL.

**Project Type**: Web service — Express HTTP server exposing a webhook endpoint consumed by Meta's servers.

**Performance Goals**: Respond to webhook within 3 seconds (Meta timeout: 20s). Handle 50 concurrent conversations. Media pre-uploaded at boot (no cold-start latency).

**Constraints**: All messages must be service-category (free). No marketing or authentication templates. 24-hour state TTL. In-memory state only (no persistent customer data). Indian market — costs ₹0 for service messages.

**Scale/Scope**: Single resort, single WhatsApp phone number. Expected volume: 10-500 conversations/day. Monolithic single-server deployment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| I. Simplicity First | ✅ PASS | Express.js (minimal framework), no ORM, no frontend, no database. 6 source files max. |
| II. API-First Integration | ✅ PASS | Dedicated `src/whatsapp/client.js` module. `.env` for secrets. Timeout + retry handling on all API calls. |
| III. Config-Driven Behavior | ✅ PASS | Message templates in `src/whatsapp/templates.js`. Media paths in config. Changing a message requires no code change. |
| IV. Observable & Auditable | ✅ PASS | JSON log file via `fs.appendFileSync` on every message. Phone numbers SHA-256 hashed (first 8 chars). |
| V. Free-Tier-First Design | ✅ PASS | No outbound-initiated messages. All replies within 24-hour service window. Service message category only. |

**Gate Result**: ALL PASS. Proceed to Phase 0.

### Post-Design Re-Check (Phase 1)

| Principle | Status | Evidence |
|---|---|---|
| I. Simplicity First | ✅ PASS | Final design: 8 source files, no new dependencies beyond plan |
| II. API-First Integration | ✅ PASS | client.js + webhook.js enforce clean boundaries |
| III. Config-Driven Behavior | ✅ PASS | templates.js isolates all text content |
| IV. Observable & Auditable | ✅ PASS | Logging confirmed in every handler path |
| V. Free-Tier-First Design | ✅ PASS | All API calls are replies within service window |

## Project Structure

### Documentation (this feature)

```text
specs/001-whatsapp-auto-reply/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── webhook-api.md   # Webhook contract
└── tasks.md             # Phase 2 output (speckit-tasks)
```

### Source Code (repository root)

```text
MGH automated reply/
├── .env                          # API tokens, phone number ID
├── .env.example                  # Template (safe to commit)
├── .gitignore
├── package.json
├── server.js                     # Express entry point
├── src/
│   ├── whatsapp/
│   │   ├── client.js             # Meta Cloud API client (send + media upload)
│   │   ├── webhook.js            # Webhook verification + message parsing
│   │   └── templates.js          # Menu messages, brochure/video payloads
│   ├── handler/
│   │   └── messageHandler.js     # Incoming message router + menu state
│   ├── state/
│   │   └── conversationStore.js  # In-memory state per phone number
│   └── media/
│       └── mediaSender.js        # Pre-upload media at boot, send by ID
├── media/                        # Resort files
│   ├── brochure.pdf
│   ├── video1.mp4
│   └── video2.mp4
├── data/                         # State backup (gitignored)
│   └── conversations.json
└── tests/
    ├── client.test.js
    ├── messageHandler.test.js
    └── conversationStore.test.js
```

**Structure Decision**: Single web service project (Option 1). No frontend, no mobile app. The "user interface" is WhatsApp itself. The server only processes webhooks and calls the Meta API.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

# Architecture: Cloudflare Edge Brain

**Feature**: `004-cloudflare-edge` | **Date**: 2026-07-11

---

## Architecture Diagram

```
                        ┌─────────────────────────────────┐
                        │   VERCEL (Free)                  │
                        │   React + Vite Dashboard         │
                        │   mgh-dashboard.vercel.app       │
                        └──────────────┬──────────────────┘
                                       │ HTTPS
                                       ▼
┌──────────────────────────────────────────────────────────────┐
│  CLOUDFLARE EDGE (Chennai PoP, ~10ms to Kerala)              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Cloudflare Worker (API)                           │     │
│  │  GET /api/dashboard/*                              │     │
│  │  GET/POST /api/customers/*                         │     │
│  │  POST /api/campaigns/*                             │     │
│  │  GET /api/export/csv                               │     │
│  │  GET /api/system/health                            │     │
│  │  Auth: Bearer token middleware                     │     │
│  └──────────┬─────────────────────────────────────────┘     │
│             │                                                │
│  ┌──────────▼─────────────────────────────────────────┐     │
│  │  Durable Object (Orchestrator)                      │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  WebSocket Server (wss://)                    │  │     │
│  │  │  Phone connects via outbound WS               │  │     │
│  │  │  Auth: phoneAuthToken on connect              │  │     │
│  │  └────────────────┬─────────────────────────────┘  │     │
│  │                   │                                 │     │
│  │  ┌────────────────▼─────────────────────────────┐  │     │
│  │  │  Message Router                               │  │     │
│  │  │  ├─ type: whatsapp_message → handleMessage()  │  │     │
│  │  │  ├─ type: incoming_call → handleCall()       │  │     │
│  │  │  └─ type: ack → markComplete()              │  │     │
│  │  └────────────────┬─────────────────────────────┘  │     │
│  │                   │                                 │     │
│  │  ┌────────────────▼─────────────────────────────┐  │     │
│  │  │  Decision Engines                             │  │     │
│  │  │  ├─ TemplatePicker (menu/brochure/video)     │  │     │
│  │  │  ├─ LeadScorer (weighted event scoring)      │  │     │
│  │  │  ├─ PhoneParser (SD command + normalize)     │  │     │
│  │  │  ├─ IdleBehavior (anti-detection decisions)  │  │     │
│  │  │  └─ EventLogger (write events to NeonDB)     │  │     │
│  │  └────────────────┬─────────────────────────────┘  │     │
│  │                   │                                 │     │
│  │  ┌────────────────▼─────────────────────────────┐  │     │
│  │  │  DO SQLite Storage (this.ctx.storage)         │  │     │
│  │  │  ├─ lastTemplateIndex per category           │  │     │
│  │  │  ├─ antiDetectionTimestamps                  │  │     │
│  │  │  ├─ conversationState per customer           │  │     │
│  │  │  └─ leadScoreCaches                          │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  └──────────────────┬──────────────────────────────────┘     │
└─────────────────────┼───────────────────────────────────────┘
                      │ HTTP (@neondatabase/serverless)
         ┌────────────▼────────────────────┐
         │  NeonDB (Free Tier)              │
         │  PostgreSQL, 0.5 GB              │
         │  Tables: customers, events,       │
         │  bookings, campaigns, kpi...     │
         └─────────────────────────────────┘

                      ▲
                      │ WebSocket (wss://)
                      │ Phone initiates. Always outbound.
┌─────────────────────┴───────────────────────────────────────┐
│  ANDROID PHONE (Realme X2 Pro, SD855+, Rooted, PixelOS)     │
│                                                              │
│  phone-client.js (PM2-managed, Termux)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Sensors (Poll)                                       │   │
│  │  ├─ NotificationListener (termux-notification-list)  │   │
│  │  │  Polls every 2s, filters com.whatsapp             │   │
│  │  └─ CallListener (dumpsys telephony.registry)        │   │
│  │     Polls every 3s, detects mCallState transitions   │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Actuators (Execute)                                  │   │
│  │  ├─ sendWhatsAppMessage() — wa.me intent + tap       │   │
│  │  ├─ answerCall() — input keyevent 79                 │   │
│  │  ├─ hangupCall() — input keyevent 6                  │   │
│  │  ├─ playAudioUplink() — tinymix + tinyplay           │   │
│  │  ├─ enableSpeakerphone() — tap coordinates           │   │
│  │  └─ checkWhatsApp() — logcat + wa.me open            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Timing Engine (Local setTimeout)                     │   │
│  │  ├─ Gaussian delay (2-8s, mean 4s)                  │   │
│  │  ├─ Typing simulation (bursts + backspaces)          │   │
│  │  └─ IVR sequence (15s total: answer→SP→play→hangup)  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Mitigations:                                                │
│  • termux-wake-lock (prevent doze)                          │
│  • oom_score_adj -1000 (prevent OOM kill)                   │
│  • PM2 auto-restart + save                                  │
│  • ACC Magisk module (battery 40-60%)                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Incoming WhatsApp Message

```
Phone detects WhatsApp notification
  └→ Phone sends: { type: 'whatsapp_message', payload: { sender, message, senderName } }
    └→ DO routes to handleMessage()
      └→ DO checks isAdminCommand(message)
        ├─ YES → handleAdminCommand() → sendToPhone() → Phone sends WhatsApp
        └─ NO  → ensureCustomer() → templatePicker.pick() → calculateScore()
              → save state to this.ctx.storage → logEvent() to NeonDB
              → notifyAdmin() if hot lead
              → DO sends: { type: 'command', payload: { action: 'send_message', recipient, text } }
                └→ Phone receives → executeCommand() → wa.me intent → tap send
                  └→ Phone applies local Gaussian delay + typing simulation
                    └→ Phone sends WhatsApp message
                      └→ Phone sends ack back to DO
```

### Incoming Phone Call (IVR)

```
Phone detects mCallState 0→1 (RINGING)
  └→ Phone sends: { type: 'incoming_call', payload: { number, timestamp } }
    └→ DO routes to handleCall()
      └→ DO notifies admin: "📞 Incoming call from {number}"
      └→ DO sends: { type: 'command', action: 'ivr_sequence', payload: { greetingFile } }
        └→ Phone executes locally:
          ├─ answer_call → keyevent 79
          ├─ wait 1.5s
          ├─ enable_speakerphone → tap coordinates
          ├─ wait 0.8s
          ├─ play_audio_uplink → tinymix 'Incall_Music' 1 → tinyplay → tinymix 0
          ├─ wait 1s
          └─ hangup → keyevent 6
            └→ Phone sends ack to DO
  └→ DO waits ~15s (IVR duration)
    └→ DO: sendToPhone(callerNumber, pickMenu())
      └→ Phone sends WhatsApp menu to caller
        └→ DO notifies admin: "✅ IVR completed, menu sent"
```

### Admin SD Command

```
Admin sends "SD 9876543210" to MGH WhatsApp
  └→ Phone detects → sends to DO as whatsapp_message
    └→ DO: isAdminCommand("SD 9876543210") → true
      └→ DO: normalizePhone("9876543210") → { normalized: "+919876543210" }
        └→ DO: sendToPhone("+919876543210", pickMenu())
          └→ Phone sends WhatsApp menu to the lead
        └→ DO: sendToPhone(adminNumber, "✅ Menu sent to +919876543210")
          └→ Admin gets confirmation
```

---

## State Management

### What Lives Where

| Data | Location | Reason |
|------|----------|--------|
| Customer records | NeonDB | Persistent, queryable for dashboard |
| Events log | NeonDB | Analytics, lead scoring, audit |
| Bookings | NeonDB | Business data |
| Campaigns | NeonDB | Marketing analytics |
| KPI snapshots | NeonDB | Dashboard aggregation |
| Template rotation index | DO SQLite (`this.ctx.storage`) | Must survive hibernation, per-category |
| Anti-detection timestamps | DO SQLite | Track last scroll/viewContact timing |
| Conversation state | DO SQLite | Per-customer FSM state |
| Call deduplication | Phone memory (local) | 10s window, ephemeral |
| IVR timing sequence | Phone memory (setTimeout) | Latency-sensitive hardware ops |
| WhatsApp notification polling | Phone memory (setInterval) | Must run on device |

### Hibernation Contract

```
DO Active → processes message → writes to NeonDB + DO SQLite → idle for 30s → Hibernate
└→ All JS variables destroyed
  └→ Next message arrives → DO wakes → reads state from this.ctx.storage → processes
```

**RULE**: Any variable that survives more than one message MUST be in `this.ctx.storage`.

---

## API Surface

### Worker (HTTP API) → Called by Vercel Dashboard

| Method | Path | Auth | Purpose |
|--------|------|:---:|---------|
| GET | `/api/health` | No | Uptime check |
| GET | `/api/dashboard/overview` | Bearer | KPI cards, funnel, trends |
| GET | `/api/dashboard/bot` | Bearer | Engagement rates, heatmap |
| GET | `/api/customers` | Bearer | List, search, filter, paginate |
| GET | `/api/customers/:id` | Bearer | Single customer + history |
| PUT | `/api/customers/:id` | Bearer | Update customer fields |
| GET | `/api/dashboard/team` | Bearer | Employee list, leaderboard |
| GET | `/api/system/health` | Bearer | VM/phone/Tailscale status |
| GET | `/api/export/csv` | Bearer | CSV download |
| GET | `/api/campaigns` | Bearer | Campaign list |
| POST | `/api/campaigns` | Bearer | Create campaign |
| POST | `/api/campaigns/:id/send` | Bearer | Execute campaign send |
| POST | `/api/ivr/webhook` | HMAC Secret | MSG91 IVR webhook (future) |

### DO (WebSocket) → Called by Phone

| Message Type | Direction | Payload |
|-------------|:---:|---------|
| `auth` | Phone → DO | `{ token, phoneId }` |
| `auth_ok` | DO → Phone | `{}` |
| `whatsapp_message` | Phone → DO | `{ sender, senderName, message }` |
| `incoming_call` | Phone → DO | `{ number, timestamp }` |
| `command` | DO → Phone | `{ id, action, payload: { ... } }` |
| `ack` | Phone → DO | `{ commandId, status }` |

---

## Edge Constraints

| Constraint | Limit | Impact |
|-----------|:---:|--------|
| DO CPU timeout | 30s per invocation | Message processing <1s — fine |
| DO request rate | 1000 req/s per object | WhatsApp bot <1 req/s — trivial |
| Free DO storage | 1 GB SQLite | Orchestration state ~50 MB |
| Free DO requests | 1M/month | Bot traffic ~10-50K/month |
| Free Worker requests | 100K/day | Dashboard ~1K/day |
| NeonDB storage | 0.5 GB | Customer data — tight for scale |
| NeonDB idle timeout | Auto-suspend | First query ~500ms after idle |
| Phone `su` timeout | 10s per command | Avoid blocking WebSocket |
| WhatsApp 24h window | 24 hours per contact | Never initiate first message |

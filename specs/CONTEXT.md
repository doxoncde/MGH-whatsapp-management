# Misty Green Hills — WhatsApp Bot & IVR System (Full Context)

---

## What We're Building

A **fully automated WhatsApp management system** for Misty Green Hills resort that runs at **₹0/month**. When someone messages the resort's WhatsApp number, the bot auto-replies with menus, brochures, videos, handles queries, and routes hot leads to human agents. When someone **calls** the resort number, the phone auto-answers, plays a Hindi greeting via the call audio, then sends the caller a WhatsApp menu.

The entire system runs on:
- **1 Android phone** (Realme X2 Pro, rooted, PixelOS, Magisk) — handles WhatsApp UI automation + phone call IVR
- **1 cloud VM** (Oracle Cloud Always Free: 2 ARM cores, 12 GB RAM, Ubuntu 24.04) — runs the Node.js orchestrator and API
- **NeonDB** (free PostgreSQL tier) — cloud-hosted database
- **Vercel** (free) — hosts the React dashboard
- **Tailscale** (free VPN) — securely connects phone ↔ VM

---

## Architecture

```
┌──────────────────────────────────────────┐
│  ANDROID PHONE (Realme X2 Pro)           │
│  SD855+, PixelOS 13, Magisk root         │
│                                          │
│  phone-client.js (Node.js in Termux)     │
│  ├─ Polls WhatsApp notifications (2s)    │
│  ├─ Polls phone calls via dumpsys (3s)   │
│  ├─ Executes ADB/input commands via su   │
│  ├─ IVR: answer call → tinymix inject    │
│  │   audio → play greeting → hangup      │
│  └─ WebSocket → VM:9090                  │
└──────────────┬───────────────────────────┘
               │ WebSocket (ws://VM_IP:9090)
               │ via Tailscale VPN
┌──────────────▼───────────────────────────┐
│  ORACLE CLOUD VM (Always Free)           │
│  Ubuntu 24.04, 2 OCPU, 12 GB RAM        │
│                                          │
│  orchestrator.js (WebSocket server :9090)│
│  ├─ Receives WhatsApp messages           │
│  ├─ Template picker → selects reply      │
│  ├─ Admin SD command parser              │
│  ├─ Incoming call handler → IVR trigger  │
│  ├─ Anti-detection engines               │
│  │   (delay.js, typing.js, idleBehavior) │
│  ├─ Lead scoring + event logging         │
│  └─ Notification service (Telegram+SMS)  │
│                                          │
│  server.js (Express API :3001)           │
│  ├─ /api/dashboard, /api/customers       │
│  ├─ /api/campaigns, /api/system          │
│  └─ /api/export (CSV)                    │
└──────────────┬───────────────────────────┘
               │ PostgreSQL connection
┌──────────────▼───────────────────────────┐
│  NeonDB (Free Tier)                      │
│  0.5 GB storage, auto-suspends           │
│  Tables: customers, employees, events,   │
│  conversations, bookings, campaigns, KPIs│
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Vercel (Free) — Frontend Dashboard      │
│  React + Vite + TailwindCSS              │
│  8 panels: Executive, Bot, CRM, Simulator│
│  Promotions, System, Team, Admin         │
└──────────────────────────────────────────┘
```

---

## Current Codebase State

### Backend (`backend/`)
- **server.js** — Express API on port 3001, Bearer token auth, health endpoint
- **6 API routes**: dashboard, customers, team, system, campaigns, export
- **3 services**: eventLogger, leadScorer, notificationService
- **4 WhatsApp engines**: delay (Gaussian-distributed reply timing), typing (simulated bursts + backspaces), idleBehavior (anti-detection pre-actions), templatePicker (5 menu + 4 brochure + 4 video + 3 both variants)
- **orchestrator.js** — WebSocket server on port 9090, routes messages to template picker, handles admin SD commands, triggers IVR on incoming calls
- **phoneParser.js** — Normalizes Indian/international phone numbers, detects admin commands
- **database.js** — SQLite via sql.js (WASM), schema in migrations/001_initial.sql
- **seed.js** — 10 employees, 10 customers, 200 events, 20 bookings, 4 campaigns
- **config/index.js** — all env-var-driven config

### Frontend (`frontend/`)
- React 19 + Vite + TypeScript + TailwindCSS
- 10 components: Sidebar, ExecutiveDashboard, BotPerformance, CustomerCRM, CustomerSimulator, Promotions, SystemHealth, TeamDashboard, AdminPanel, TariffGuide
- Vite proxy `/api` → `localhost:3001`
- 2 type files: types.ts, mockData.ts
- No state management library — uses local state + mock data
- **No API client wired** — dashboard currently shows mock/sample data

### Phone Client (`phone/phone-client.js`)
- WebSocket client connecting to orchestrator VM
- **Root shell** (`su -c`) for privileged ADB/input/tinymix commands
- **send_message**: Opens WhatsApp via `wa.me` intent, waits 3s, taps send button
- **Call listener**: Polls `dumpsys telephony.registry` every 3s, detects IDLE→RINGING→OFFHOOK→IDLE transitions, deduplicates calls within 10s window
- **IVR commands**: `answer_call` (keyevent 79), `hangup` (keyevent 6), `enable_speakerphone`, `play_audio_uplink` (tinymix inject), `ivr_sequence` (full automated flow)
- **WhatsApp notification listener**: Polls `termux-notification-list` every 2s
- Sender phone number extraction is still a **placeholder** (`+919876543210`) — not yet extracted from real notification metadata

---

## Phase 3 Features (Just Implemented)

### 3a: Lead Push (SD Command)
Admin sends `SD <phone>` via WhatsApp to the MGH number → orchestrator parses it → normalizes the phone number (defaults to +91 India, handles international codes, strips spaces/dashes) → sends the MGH menu to that lead via WhatsApp.

```
Admin: "SD 9876543210"
Bot: sends menu to +919876543210
Admin gets: "✅ Menu sent to +919876543210 (India)"
```

### 3b: Phone Call IVR (Rooted Snapdragon)
When someone calls the MGH number:

1. Phone-client detects `mCallState=1` (RINGING) via `dumpsys telephony.registry`
2. Extracts `mCallIncomingNumber`
3. Sends `{ type: 'incoming_call', payload: { number, timestamp } }` to orchestrator
4. Orchestrator notifies admin: "📞 Incoming call from {number}"
5. Orchestrator triggers IVR sequence on phone:
   - `answer_call` (keyevent 79 / HEADSETHOOK)
   - 1.5s delay
   - `enable_speakerphone` (tap speakerphone coordinates)
   - 0.8s delay
   - `play_audio_uplink` → tinymix routing → caller hears greeting
   - 1s delay
   - `hangup` (keyevent 6 / ENDCALL)
6. After IVR (~15s total), orchestrator sends WhatsApp menu to caller
7. Admin gets: "✅ IVR completed for {number}. Menu sent via WhatsApp."

### The Magic: `Incall_Music Audio Mixer`

This is a kernel-level ALSA control present on **all Snapdragon SoCs**. It routes audio from the `MultiMedia1` stream directly into the phone call's **uplink** (what the caller hears).

```bash
tinymix 'Incall_Music Audio Mixer MultiMedia1' 1
tinyplay /data/local/tmp/mgh-greeting.wav    # caller hears this
tinymix 'Incall_Music Audio Mixer MultiMedia1' 0
```

Works only on Snapdragon. Mediatek, Exynos, Google Tensor do NOT have this control. **Only rooted phones can access it** (SELinux blocks unprivileged tinymix access).

---

## Template System

All templates live in `backend/src/whatsapp/engines/templatePicker.js`:

| Category | Variants | Trigger |
|----------|:---:|---------|
| Menu | 5 (Tropical 🌴, Ocean 🌊, Namaste 🪷, etc.) | Default, unrecognized query |
| Brochure | 4 | User sends "1" or "brochure" |
| Videos | 4 | User sends "2" or "video" |
| Both | 3 | User sends "3" or "both" |
| Invalid | 3 | Garbled input |

Selection uses `(index + 1 + random*(len-1)) % len` — prevents consecutive repeats.

---

## Anti-Detection System

WhatsApp bans bots. To evade detection:

- **delay.js**: Gaussian-distributed reply delays (2-8s, mean 4s)
- **typing.js**: Simulates human typing with 5-15 char bursts, 150-350ms/char, random backspaces
- **idleBehavior.js**: Pre-reply behaviors (scroll 30%, view contact 15%, fake typing 5%)
- No Cloud API usage — all UI automation mimics real human interaction
- **Only replies to incoming messages** — never initiates first. Stays within WhatsApp's free 24-hour service window.

---

## Database Schema (7 tables, SQLite → migrating to NeonDB PostgreSQL)

| Table | Purpose |
|-------|---------|
| customers | Phone hash, name, lead score, status (new_lead/engaged/negotiating/booked), tags, assigned employee |
| employees | Name, WhatsApp, Telegram, role (sales/admin) |
| conversations | Links customer ↔ employee, status, booking reference |
| events | Every interaction: menu_sent, brochure_requested, price_inquiry, etc. |
| bookings | Check-in/out dates, guest count, booking value |
| campaigns | Segments, templates, sent/open/click/booking count, revenue |
| kpi_snapshots | Daily aggregated metrics |

---

## Deployment Strategy (₹0/month)

| Component | Service | Specs | Cost |
|-----------|---------|-------|:---:|
| Backend API + Orchestrator | Oracle Cloud Ampere A1 | 2 ARM OCPU, 12 GB RAM, 50 GB | ₹0 |
| Database | NeonDB | 0.5 GB PostgreSQL, auto-suspends | ₹0 |
| Frontend | Vercel | React SPA, CDN | ₹0 |
| VPN | Tailscale | Phone ↔ VM secure mesh | ₹0 |
| Phone | Realme X2 Pro (existing) | SD855+, PixelOS 13, Magisk | ₹0 |
| Total | | | **₹0** |

**Oracle "Out of Capacity" fix**: Use `oci-arm-host-capacity` script from GitHub — auto-retries every 60s until a slot opens. Usually succeeds within hours. Alternatively, upgrade to PAYG account (still free within limits, gets priority capacity).

**Idle reclamation prevention**: Oracle deletes VMs idle for 7 days (CPU < 20%, RAM < 20%, network < 20%). PM2 running orchestrator + API with WhatsApp traffic keeps utilization above thresholds. If needed, a `stress-ng` cron job burns CPU/ram for 60s every 30 min.

---

## Phone Requirements for Rooted IVR

| Requirement | Why |
|-------------|-----|
| **Snapdragon SoC** (SD4xx+) | `Incall_Music Audio Mixer` is Qualcomm-only. Mediatek/Exynos/Tensor **will not work**. |
| 4+ GB RAM | Termux + Node.js + WhatsApp running 24/7 |
| 32+ GB storage | OS + WhatsApp media cache |
| Android 9+ (10+ preferred) | Proper dumpsys telephony support |
| **Magisk root** | tinymix needs su to access ALSA controls |
| Unlockable bootloader | Required for Magisk |
| ACC Magisk module | Battery bypass — keeps charge at 40-60% to prevent swelling when plugged in 24/7 |

**Our phone: Realme X2 Pro (RMX1931)** — SD855+, 8 GB RAM, PixelOS (Android 13), Magisk pre-installed. Excellent device for this — the SD855+ is confirmed compatible with `Incall_Music Audio Mixer`.

---

## What's Done vs What's Pending

### ✅ Implemented & Working
- Backend API server (Express, all 6 routes)
- SQLite database with schema + seed data
- Template picker with 5 menu, 4 brochure, 4 video, 3 both variants
- Anti-detection engines (delay, typing, idle behavior)
- Lead scoring engine
- Notification service (WhatsApp + Telegram)
- WebSocket orchestrator (receives messages, routes replies)
- Phone-client WebSocket connection + auth
- Phone-client WhatsApp notification listener
- Phone-client send_message (wa.me intent + send button tap)
- Phone-client call listener (dumpsys telephony.registry polling)
- Phone-client IVR sequence (answer → speakerphone → tinymix → hangup)
- Admin SD command parser + phone number normalizer
- Frontend React dashboard (all 10 components, mock data)
- Deployment guide (Oracle VM, NeonDB, Vercel, Tailscale)
- Phone buying guide (Snapdragon-only, budget recommendations)

### ⚠️ Pending / Needs Work
- **Phone sender number extraction** — phone-client uses hardcoded `+919876543210`. Must extract real sender from WhatsApp notification metadata
- **NeonDB migration** — schema is SQLite, needs PostgreSQL conversion for production
- **Frontend API client wiring** — dashboard currently uses mock data, not live API calls
- **greeting.wav** — Hindi greeting audio file not yet created/uploaded to phone
- **Send button coordinates** — calibrated for a generic device, must be set for Realme X2 Pro
- **Speakerphone coordinates** — same, needs calibration
- **Campaign send** — finds matching customers but doesn't dispatch WhatsApp messages (stub)
- **WhatsApp account check** — logcat-based detection written but untested
- **DTMF detection** — not implemented (MVP uses "send us Hi on WhatsApp" instead)
- **Notifications for missed calls** — admin notification wired but untested
- **All tests** — zero test files exist across entire project
- **Oracle VM deployment** — not yet deployed (out of capacity)
- **Phone ↔ VM connection** — not yet connected end-to-end

---

## Current Runtime State

Servers are running locally on Windows development machine:
- Backend API: `http://localhost:3001` ✅
- Orchestrator WebSocket: `ws://localhost:9090` ✅
- Frontend dashboard: `http://localhost:3000` ✅

---

## Key File Paths (for reference)

```
backend/
├── server.js                          # Express API entry
├── src/
│   ├── config/index.js                # Env config
│   ├── db/database.js                 # SQLite via sql.js
│   ├── db/migrations/001_initial.sql  # Schema
│   ├── db/seed.js                     # Sample data
│   ├── api/dashboard.js               # GET /api/dashboard/overview
│   ├── api/customers.js               # CRUD /api/customers
│   ├── api/campaigns.js               # CRUD + send /api/campaigns
│   ├── api/team.js                    # GET /api/dashboard/team
│   ├── api/system.js                  # GET /api/system/health
│   ├── api/export.js                  # GET /api/export/csv
│   ├── services/eventLogger.js        # Event logging + customer management
│   ├── services/leadScorer.js         # Lead score calculation
│   ├── services/notificationService.js# WhatsApp + Telegram notifications
│   ├── whatsapp/orchestrator.js       # WebSocket server, message routing, IVR trigger
│   ├── whatsapp/engines/delay.js      # Gaussian-distributed reply delays
│   ├── whatsapp/engines/typing.js     # Human-like typing simulation
│   ├── whatsapp/engines/idleBehavior.js # Pre-reply anti-detection actions
│   ├── whatsapp/engines/templatePicker.js # All response templates
│   └── utils/phoneParser.js           # Phone normalization + admin command detection

phone/
└── phone-client.js                    # Termux bot client (WebSocket, IVR, WhatsApp automation)

frontend/
├── src/
│   ├── App.tsx                        # Main app with routing
│   ├── components/                    # 10 dashboard components
│   ├── types.ts                       # TypeScript types
│   └── mockData.ts                    # Sample dashboard data
└── vite.config.ts                     # Vite + proxy config

specs/
├── 003-lead-push-ivr/plan.md          # Phase 3 feature plan
├── 003-lead-push-ivr/phone-guide.md   # Phone hardware buying guide
└── 002-mgmt-dashboard-system/         # Phase 2 dashboard system docs

docs/
└── GUIDE.md                           # Full deployment + phone wiring guide
```

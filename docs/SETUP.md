# MGH Resort Bot — Complete Setup Guide

---

## Architecture (Current)

```
┌──────────────────────────────────────┐
│  REALME X2 PRO (SD855+, Rooted)      │
│  phone-client.js                     │
│  • Polls WhatsApp notifications      │
│  • Polls call state (dumpsys)        │
│  • Executes wa.me / adb / tinymix    │
│  • OWNS all timing (IVR, delays)     │
└──────────────┬───────────────────────┘
               │ Outbound WebSocket (wss://)
               │ Phone initiates. Always.
               ▼
┌──────────────────────────────────────┐
│  CLOUDFLARE EDGE (Chennai PoP)       │
│  Durable Object (Brain)              │
│  • Template picker, lead scorer      │
│  • Anti-detection decisions          │
│  • Admin SD command handler          │
│  • DO SQLite for state               │
│  Worker (API)                        │
│  • 14 REST endpoints                 │
│  • Bearer token auth + CORS          │
└──────────────┬───────────────────────┘
               │ HTTP (@neondatabase/serverless)
┌──────────────▼───────────────────────┐
│  NeonDB (Free PostgreSQL, 0.5 GB)    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  Vercel (Free) — React Dashboard     │
│  Calls Worker API                    │
└──────────────────────────────────────┘
```

**Total Cost: ₹0/month**

---

## Phase 1: Cloudflare Workers + Durable Objects

### 1.1 Sign Up for Cloudflare

1. Go to https://dash.cloudflare.com/sign-up
2. Create account (email + password, no credit card needed for Workers free plan)
3. Note your Cloudflare account ID from the dashboard Overview page

### 1.2 Install Wrangler CLI on Your PC

```bash
npm install -g wrangler
wrangler login
# Browser opens → Authorize → CLI authenticated
```

### 1.3 Install Project Dependencies

```bash
cd cloudflare
npm install
```

This installs: Hono (lightweight router), @neondatabase/serverless (PostgreSQL over HTTP), wrangler, TypeScript types.

### 1.4 Configure Environment Variables

```bash
cd cloudflare
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your values:
```ini
API_TOKEN=mgh-dashboard-secret-token-change-me           # Dashboard API auth token
PHONE_AUTH_TOKEN=phone-secret-token-change-me             # Phone ↔ DO auth token
ADMIN_WHATSAPP=+919876543210                              # Your WhatsApp number
DEFAULT_COUNTRY_CODE=91                                   # Default for SD command
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require  # From NeonDB
TELEGRAM_BOT_TOKEN=                                       # Optional
TELEGRAM_CHAT_ID=                                         # Optional
```

**⚠️ Set `DATABASE_URL` after completing Phase 2 (NeonDB).**

### 1.5 Test Locally

```bash
cd cloudflare
npx wrangler dev
```

Visit `http://localhost:8787/api/health` → should return `{"status":"ok","uptime":...}`

### 1.6 Deploy to Production

```bash
cd cloudflare
npx wrangler deploy
```

Output: `Deployed 'mgh-bot' (https://mgh-bot.<your-subdomain>.workers.dev)`

### 1.7 Set Production Secrets

Do NOT commit `.dev.vars` to git. For production, use wrangler secrets:

```bash
wrangler secret put API_TOKEN
# Paste: mgh-dashboard-secret-token-change-me

wrangler secret put PHONE_AUTH_TOKEN
# Paste: phone-secret-token-change-me

wrangler secret put ADMIN_WHATSAPP
# Paste: +919876543210

wrangler secret put DATABASE_URL
# Paste: postgresql://user:pass@ep-xxx.neon.tech/mgh_db?sslmode=require

wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

### 1.8 Verify Deployment

```bash
# Health check (no auth)
curl https://mgh-bot.<your-subdomain>.workers.dev/api/health

# Dashboard (with auth)
curl -H "Authorization: Bearer mgh-dashboard-secret-token-change-me" \
  https://mgh-bot.<your-subdomain>.workers.dev/api/dashboard/overview

# DO health
curl https://mgh-bot.<your-subdomain>.workers.dev/ws/health
```

---

## Phase 2: NeonDB (PostgreSQL Database)

### 2.1 Sign Up

1. Go to https://neon.tech → **Sign Up** (GitHub recommended)
2. Click **Create Project**
3. Name: `mgh-db`
4. Region: **ap-south-1 (Mumbai)** — lowest latency from India
5. Click **Create**

### 2.2 Get Connection String

1. In the NeonDB dashboard, click **Connect**
2. Copy the connection string (starts with `postgresql://`)
3. Format: `postgresql://mgh_db_owner:password@ep-xxxx.ap-south-1.aws.neon.tech/mgh_db?sslmode=require`

### 2.3 Create Database Schema

Open **SQL Editor** in NeonDB dashboard (sidebar → SQL Editor).

Copy-paste the entire contents of `cloudflare/src/db/migrations/001_initial.sql` and click **Run**.

This creates 7 tables: customers, employees, conversations, events, bookings, campaigns, kpi_snapshots — with all indexes.

**Verify**: Run `SELECT table_name FROM information_schema.tables WHERE table_schema='public';` — should show 7 tables.

### 2.4 (Optional) Enable Pooled Connection

For serverless environments, NeonDB recommends pooled connections:

```
# Replace in your DATABASE_URL:
# From: /mgh_db?sslmode=require
# To:   /mgh_db?sslmode=require&pgbouncer=true
```

This is optional — the `@neondatabase/serverless` driver already uses HTTP pooling.

### 2.5 Update Cloudflare Secrets

```bash
wrangler secret put DATABASE_URL
# Paste: postgresql://user:pass@ep-xxxx.neon.tech/mgh_db?sslmode=require
```

Re-deploy to pick up the secret:
```bash
npx wrangler deploy
```

---

## Phase 3: Phone Setup (Realme X2 Pro — PixelOS, Magisk)

### 3.1 Install Required Apps

| App | Purpose | Install From |
|-----|---------|--------------|
| **Termux** | Linux terminal — runs Node.js + phone-client | F-Droid (NOT Play Store — Play Store version is outdated) |
| **Termux:API** | Access Android sensors (notifications, battery, etc.) | F-Droid |
| **PM2** | Process manager — auto-starts phone-client on boot, auto-restarts on crash | `npm install -g pm2` in Termux |

**Shizuku is NOT needed** — the phone is rooted, so commands run via `su -c` directly.

### 3.2 Termux Initial Setup

```bash
# Update packages
pkg update && pkg upgrade -y

# Install core tools
pkg install nodejs git termux-api termux-auth tinyalsa -y

# Verify Node.js
node --version  # Should be v20.x or higher

# Grant storage access
termux-setup-storage
```

### 3.3 Grant Root Access in Magisk

1. Open **Magisk** app
2. Tap **Superuser** tab
3. Find **Termux** → tap → **Grant** (set to always allow)
4. Verify root works:
   ```bash
   su -c 'echo ROOT_OK'
   # Should print: ROOT_OK
   ```

### 3.4 Grant Notification Access

```
Settings → Apps → Special Access → Notification Access → Termux:API → ON
```

Without this, `termux-notification-list` returns empty — the bot can't read WhatsApp messages.

### 3.5 Clone & Setup Phone Client

```bash
cd ~
git clone https://github.com/<your-username>/<your-repo>.git mgh-phone
cd mgh-phone/phone

# Install dependencies
npm install

# Install PM2 for process management
npm install -g pm2
```

### 3.6 Calibrate WhatsApp Send Button Coordinates

1. Enable **Developer Options** on the phone
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **Pointer Location** in Developer Options
3. Open WhatsApp → open any chat → note the X, Y coordinates of the send button
4. Update `phone/phone-client.js`:

```javascript
const SEND_BUTTON_X = 1000;  // Replace with your X coordinate
const SEND_BUTTON_Y = 2200;  // Replace with your Y coordinate
```

### 3.7 Calibrate Speakerphone Coordinates

1. Make a call to any number (can be your own)
2. During the call, enable Pointer Location
3. Note the X, Y of the speakerphone button
4. Update `phone/phone-client.js`:

```javascript
const SPEAKERPHONE_X = 540;  // Replace with your X
const SPEAKERPHONE_Y = 2100; // Replace with your Y
```

### 3.8 Verify tinymix (IVR Audio Injection)

```bash
# Check that Incall_Music control exists
su -c 'tinymix | grep -i incall'

# Should show something like:
# Incall_Music Audio Mixer MultiMedia1  0
```

If NOTHING shows up, the IVR audio injection won't work on this kernel. The bot can still handle WhatsApp messages — just the phone-call-answer feature falls back to missed-call mode.

### 3.9 Prepare Greeting Audio (for IVR)

On your PC:
```bash
# Create a Hindi greeting using any TTS tool or record it
# Convert to mono 16kHz PCM WAV:
ffmpeg -i greeting.mp3 -ac 1 -ar 16000 -f wav greeting.wav

# Push to phone via ADB:
adb push greeting.wav /data/local/tmp/mgh-greeting.wav
```

### 3.10 Configure Phone Environment

```bash
# Edit ~/.bashrc
nano ~/.bashrc

# Add these lines:
export VM_URL="wss://mgh-bot.<your-subdomain>.workers.dev/ws"
export PHONE_AUTH_TOKEN="phone-secret-token-change-me"

# Reload
source ~/.bashrc
```

### 3.11 Start Phone Client with PM2

```bash
cd ~/mgh-phone/phone

# Start with PM2 (auto-restarts on crash)
pm2 start phone-client.js --name phone-client

# Save PM2 config (auto-start on phone reboot)
pm2 save

# Configure auto-start on boot
pm2 startup
# Follow the command PM2 prints — usually:
# su -c 'pm2 startup android && pm2 save'

# Check status
pm2 status
```

Expected output:
```
┌──────────────┬────┬─────────┬──────┬───────┬────────┐
│ Name         │ id │ status  │ cpu  │ memory │ uptime │
├──────────────┼────┼─────────┼──────┼───────┼────────┤
│ phone-client │ 0  │ online  │ 0%   │ 45.2mb │ 0s     │
└──────────────┴────┴─────────┴──────┴───────┴────────┘
```

### 3.12 Verify Phone ↔ DO Connection

Check DO health from any device with internet:
```bash
curl https://mgh-bot.<your-subdomain>.workers.dev/ws/health
```

Expected response when phone is connected:
```json
{"status":"ok","phoneConnected":true,"phoneId":"phone-1"}
```

On the phone (Termux):
```bash
pm2 logs phone-client --lines 20
```

Should show:
```
[Phone] Starting MGH Phone Client (Rooted)
[Phone] VM URL: wss://mgh-bot.<your-subdomain>.workers.dev/ws
[Phone] Connected to VM
[Phone] Authenticated
[Phone] Call listener active (polling every 3s)
```

### 3.13 Battery Protection (24/7 Operation)

The phone will be plugged in 24/7. Without protection, the battery swells in 6-12 months.

**Install ACC Magisk Module:**

1. Open **Magisk** → **Modules** → **Install from storage**
2. Download ACC (Advanced Charging Controller) from: https://github.com/VR-25/acc/releases
3. Flash the zip
4. Reboot

After reboot, configure in Termux:
```bash
su -c 'acc -s pc=60'    # Pause charging at 60%
su -c 'acc -s rc=40'    # Resume charging at 40%
```

Battery stays between 40-60% forever — no swelling. Phone runs off USB power.

### 3.14 Prevent System from Killing Termux

```bash
# Wake lock — prevents Android from dozing
termux-wake-lock

# Lower OOM score — prevents system from killing Termux when memory is low
su -c 'echo -1000 > /proc/$(pidof com.termux)/oom_score_adj'
```

Add these to a startup script or PM2 ecosystem file for persistence.

---

## Phase 4: Frontend (Vercel)

### 4.1 Update API URL

Edit `frontend/.env`:
```env
VITE_API_URL=https://mgh-bot.<your-subdomain>.workers.dev
```

### 4.2 Deploy to Vercel

```bash
cd frontend

# Install Vercel CLI (first time only)
npm install -g vercel

# Deploy
vercel --prod
# Follow prompts: login, link to project, confirm deploy

# Output: https://mgh-dashboard.vercel.app
```

### 4.3 Verify Dashboard

Open `https://mgh-dashboard.vercel.app` in browser.

All panels should load data from NeonDB via the Cloudflare Worker API.

---

## Phase 5: End-to-End Testing

### 5.1 WhatsApp Auto-Reply

1. Send "Hi" from another phone to the MGH WhatsApp number
2. Within 5-10 seconds, the bot should reply with a menu template
3. Reply "1" → bot sends brochure
4. Reply "price" → bot sends menu + admin gets hot lead notification

### 5.2 Admin SD Command

1. From admin WhatsApp, send: `SD 9876543210`
2. Bot sends menu to `+919876543210`
3. Admin gets confirmation: `✅ Menu sent to +919876543210 (India)`

### 5.3 Incoming Phone Call IVR

1. Call the MGH number from another phone
2. Bot auto-answers
3. Caller hears greeting: "Namaste, Misty Green Hills mein aapka swagat hai..."
4. Call hangs up
5. WhatsApp menu arrives on caller's phone
6. Admin gets notification: `📞 Incoming call from...` then `✅ IVR completed...`

### 5.4 Auto-Recovery Test

1. On the phone, run: `pm2 stop phone-client`
2. Verify dashboard still loads (it runs on Cloudflare, not the phone)
3. Run: `pm2 start phone-client`
4. Verify bot resumes processing messages within 5 seconds

### 5.5 Phone Reboot Test

1. Reboot the phone
2. PM2 auto-starts `phone-client.js` on boot
3. Phone reconnects to DO WebSocket within 60 seconds
4. Bot resumes normal operation

---

## Phase 6: Monitoring & Maintenance

### 6.1 Live Logs

```bash
# On PC — watch Cloudflare DO + Worker logs in real-time
cd cloudflare
npx wrangler tail

# On phone — watch phone-client logs
pm2 logs phone-client --lines 50
```

### 6.2 Watch for Issues

| Log Message | Meaning | Action |
|-------------|---------|--------|
| `[DO] Phone disconnected` | Phone lost network or crashed | Check phone WiFi/4G. PM2 should auto-restart. |
| `[DO] Message error` | Incoming message parsing failed | May be malformed WhatsApp notification. Usually self-corrects. |
| `[DO] NeonDB connection error` | Database unreachable | NeonDB may be suspended. First request after idle takes ~500ms. |
| `[Phone] shizuku unavailable` | Normal on rooted device | We use `su -c`, not shizuku. Ignore. |
| `[Phone] Command failed: tinymix` | IVR audio injection not available | IVR falls back to missed-call WhatsApp send. |

### 6.3 Updating the Code

```bash
# On PC — pull latest code
git pull

# Deploy Cloudflare changes
cd cloudflare && npx wrangler deploy

# Deploy frontend changes
cd frontend && vercel --prod

# Update phone-client
cd ~/mgh-phone/phone && git pull && npm install
pm2 restart phone-client
```

### 6.4 NeonDB Alert

NeonDB free tier has 100 compute hours/month. After that it auto-suspends. For a WhatsApp bot with moderate traffic, this is plenty (100 hours = ~4 hours/day of active compute). If you hit the limit, NeonDB simply suspends — no charge, no data loss. It auto-resumes next hour.

---

## Quick Reference: All URLs & Tokens

| What | Value |
|------|-------|
| Worker URL | `https://mgh-bot.<your-subdomain>.workers.dev` |
| WebSocket URL | `wss://mgh-bot.<your-subdomain>.workers.dev/ws` |
| DO Health URL | `https://mgh-bot.<your-subdomain>.workers.dev/ws/health` |
| API Token | `mgh-dashboard-secret-token-change-me` |
| Phone Auth Token | `phone-secret-token-change-me` |
| Vercel Dashboard | `https://mgh-dashboard.vercel.app` |
| NeonDB URL | `https://console.neon.tech` |
| Cloudflare Dashboard | `https://dash.cloudflare.com` |

---

## Quick Reference: All Commands

```bash
# === ON PC ===

# Deploy Cloudflare
cd cloudflare && npx wrangler deploy

# Deploy Frontend
cd frontend && vercel --prod

# Watch logs
cd cloudflare && npx wrangler tail

# Set a secret
wrangler secret put KEY_NAME

# === ON PHONE (Termux) ===

# Check PM2 status
pm2 status

# View logs
pm2 logs phone-client

# Restart
pm2 restart phone-client

# Stop
pm2 stop phone-client

# Start on boot
pm2 startup && pm2 save

# Check if DO detects the phone
curl https://mgh-bot.<your-subdomain>.workers.dev/ws/health

# Verify root
su -c 'echo ROOT_OK'

# Verify tinymix
su -c 'tinymix | grep -i incall'

# Battery limit
su -c 'acc -s pc=60 && acc -s rc=40'
```

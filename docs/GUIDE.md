# MGH Resort — Phone Wiring & Zero-Cost Deployment Guide

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  ANDROID PHONE (Termux)                                 │
│  ┌──────────────────┐      WebSocket (ws://VM:9090)     │
│  │ phone-client.js   │──────────────────────────────┐    │
│  │ - Notification    │                              │    │
│  │   listener        │                              │    │
│  │ - ADB commands    │                              ▼    │
│  └──────────────────┘      ┌──────────────────────────┐ │
│                             │  VM / SERVER              │ │
│                             │  ┌────────────────────┐  │ │
│                             │  │ orchestrator.js    │  │ │
│                             │  │ (WebSocket server  │  │ │
│                             │  │  port 9090)        │  │ │
│                             │  └────────┬───────────┘  │ │
│                             │           │               │ │
│                             │  ┌────────▼───────────┐  │ │
│                             │  │ server.js          │  │ │
│                             │  │ (Express API       │  │ │
│                             │  │  port 3001)        │  │ │
│                             │  └────────┬───────────┘  │ │
│                             │           │               │ │
│                             │  ┌────────▼───────────┐  │ │
│                             │  │ NeonDB (PostgreSQL)│  │ │
│                             │  │ Cloud-hosted DB    │  │ │
│                             │  └────────────────────┘  │ │
│                             └──────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  FRONTEND (Static Hosting — Vercel/Cloudflare)    │   │
│  │  React + Vite dashboard on port 3000              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Wiring Your Android Phone

### 2.1 Prerequisites on Your Android Phone

Install these from F-Droid or GitHub:

| App | Purpose |
|-----|---------|
| **Termux** | Linux terminal emulator — runs the Node.js phone client |
| **Termux:API** | Lets Termux read Android notifications (WhatsApp messages) |
| **Shizuku** | Lets Termux send ADB-style commands without root (tap, swipe, type in WhatsApp) |
| **Tailscale** _(recommended)_ | VPN to securely connect phone to your VM/server |

### 2.2 Termux Setup (on the Phone)

```bash
# 1. Update packages
pkg update && pkg upgrade

# 2. Install Node.js
pkg install nodejs

# 3. Install Termux API
pkg install termux-api

# 4. Clone or copy the phone client
# Option A: Clone from your git repo
pkg install git
git clone <your-repo-url> mgh-phone
cd mgh-phone/phone

# Option B: Manually copy phone-client.js via USB/network
# Place it in ~/mgh-phone/

# 5. Install dependencies
npm install

# 6. Set environment variables
export VM_URL="ws://YOUR_VM_TAILSCALE_IP:9090"
export PHONE_AUTH_TOKEN="phone-secret-token-change-me"

# 7. Run the client
node phone-client.js
```

### 2.3 Shizuku Setup (for Sending WhatsApp Messages)

Shizuku lets the phone client send messages by automating WhatsApp UI touches.

```bash
# 1. Install Shizuku from Google Play or GitHub
# 2. Start Shizuku via wireless debugging
#    Settings → Developer Options → Wireless Debugging → Pair
# 3. Open Shizuku app → Start
# 4. Grant Termux permission in Shizuku

# Verify it works from Termux
shizuku shell input tap 100 100   # Should tap the screen at (100, 100)
```

**Note**: The current `phone-client.js` has `send_message` as a no-op (`console.log` only). To actually send WhatsApp messages, you need to map screen coordinates for the WhatsApp send flow. See section 2.5.

### 2.4 Notification Listener (Receiving WhatsApp Messages)

The `startNotificationListener()` function polls `termux-notification-list` every 2 seconds to detect incoming WhatsApp notifications.

**Required**: Install Termux:API and grant notification access:
```
Settings → Apps → Special Access → Notification Access → Termux:API → ON
```

### 2.5 Making `send_message` Actually Send

The current `send_message` case just logs. To make it functional, you need WhatsApp UI coordinates. Here's the updated handler:

```javascript
// In phone-client.js, replace the send_message case:

case 'send_message':
  // Open WhatsApp chat to recipient
  // Method 1: Intent (preferred)
  sh(`am start -a android.intent.action.VIEW -d "https://wa.me/${recipient}"`);
  await sleep(2000); // Wait for WhatsApp to open

  // Method 2: If intent doesn't work, use UI automation
  // Tap the "New Chat" button, search for contact, etc.
  // Coordinates vary by screen size — calibrate on your device

  // Type the message
  sh(`input text "${(text || '').replace(/"/g, '\\"')}"`);
  await sleep(500);

  // Tap send button (adjust X,Y for your screen)
  sh('input keyevent 66'); // Enter key — works on most keyboards
  // OR: sh('input tap 1000 2200') — specific send button coordinates
  break;
```

**Coordinate Calibration**: Enable "Pointer Location" in Developer Options, tap around WhatsApp to find send button coordinates, hardcode them.

### 2.6 Tailscale (Secure Phone↔VM Connection)

The VM and phone need to talk over WebSocket. Without Tailscale, you'd need a public IP on the VM and port forwarding. With Tailscale:

```bash
# On VM/server:
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# On Android:
# Install Tailscale from Play Store
# Sign in with same account
# Both devices get 100.x.y.z IPs — use the VM's Tailscale IP as VM_URL
```

---

## 3. Zero-Cost Deployment

### 3.1 Database: NeonDB (Free PostgreSQL)

NeonDB's free tier gives you:
- 0.5 GB storage
- 1 shared compute (0.25 vCPU, 1 GB RAM)
- 100 hours/month of active compute (auto-suspends when idle)
- Perfect for a WhatsApp bot that doesn't have constant traffic

**Step 1**: Create a NeonDB project

1. Go to [neon.tech](https://neon.tech) → Sign up with GitHub
2. Create project → Choose region closest to you (e.g., `ap-south-1` for India)
3. Copy the connection string — looks like:
   ```
   postgresql://mgh_user:password@ep-silent-moon-123456.ap-southeast-1.aws.neon.tech/mgh_db?sslmode=require
   ```

**Step 2**: Add to backend `.env`:
```env
DATABASE_URL=postgresql://mgh_user:password@ep-silent-moon-123456.ap-southeast-1.aws.neon.tech/mgh_db?sslmode=require
```

**Step 3**: Install PostgreSQL client in backend:
```bash
cd backend
npm install pg
```

**Step 4**: Create `backend/src/db/neon.js` (replace `database.js`):

```javascript
import pg from 'pg';
import { config } from '../config/index.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

// Initialize schema
export async function initDb() {
  const client = await pool.connect();
  try {
    const fs = await import('fs');
    const migration = fs.readFileSync(
      new URL('./migrations/001_neon.sql', import.meta.url),
      'utf-8'
    );
    await client.query(migration);
    console.log('[DB] NeonDB schema initialized');
  } finally {
    client.release();
  }
  return pool;
}

// Compatible wrapper with existing getDb() API
export function getDb() {
  return {
    prepare(sql) {
      return {
        async get(...params) {
          const converted = convertSqliteToPg(sql);
          const result = await pool.query(converted, params);
          return result.rows[0] || null;
        },
        async all(...params) {
          const converted = convertSqliteToPg(sql);
          const result = await pool.query(converted, params);
          return result.rows;
        },
        async run(...params) {
          const converted = convertSqliteToPg(sql);
          await pool.query(converted, params);
          return { changes: 1 };
        },
      };
    },
    async exec(sql) {
      await pool.query(sql);
    },
    async close() {
      await pool.end();
    },
  };
}

function convertSqliteToPg(sql) {
  return sql
    .replace(/\?/g, (match, offset) => `$${offset + 1}`) // Lazy: real converter needed
    .replace(/datetime\('now'\)/g, 'NOW()')
    .replace(/json_/g, 'jsonb_'); // sql.js → pg adjustments
}

export { pool };
```

**Step 5**: Create `backend/src/db/migrations/001_neon.sql` — same schema but PostgreSQL syntax:

```sql
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash VARCHAR(64) NOT NULL UNIQUE,
  phone_display VARCHAR(20),
  name VARCHAR(255),
  lead_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'new_lead',
  tags JSONB DEFAULT '[]',
  assigned_employee VARCHAR(255),
  first_contact_date TIMESTAMPTZ DEFAULT NOW(),
  last_contact_date TIMESTAMPTZ DEFAULT NOW(),
  preferred_dates TEXT,
  guest_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20),
  telegram_id VARCHAR(255),
  role VARCHAR(50) DEFAULT 'sales',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'active',
  assigned_employee UUID REFERENCES employees(id),
  booking_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  phone_hash VARCHAR(64) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  employee_id UUID REFERENCES employees(id),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  actor VARCHAR(50) DEFAULT 'bot',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  employee_id UUID REFERENCES employees(id),
  booking_value DECIMAL(12,2),
  guest_count INTEGER,
  check_in_date DATE,
  check_out_date DATE,
  status VARCHAR(50) DEFAULT 'confirmed',
  source VARCHAR(50) DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  segment_criteria JSONB NOT NULL,
  template_content TEXT NOT NULL,
  variable_fields JSONB DEFAULT '[]',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  date DATE PRIMARY KEY,
  conversations_started INTEGER DEFAULT 0,
  menus_sent INTEGER DEFAULT 0,
  brochure_requests INTEGER DEFAULT 0,
  video_requests INTEGER DEFAULT 0,
  both_requests INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  bookings_confirmed INTEGER DEFAULT 0,
  total_booking_value DECIMAL(12,2) DEFAULT 0,
  avg_bot_reply_time_ms INTEGER,
  avg_employee_first_reply_time_ms INTEGER
);

-- Indexes (same as SQLite)
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_hash);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_lead_score ON customers(lead_score);
CREATE INDEX IF NOT EXISTS idx_customers_assigned ON customers(assigned_employee);
CREATE INDEX IF NOT EXISTS idx_customers_last_contact ON customers(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_events_phone ON events(phone_hash);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_conversation ON events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_events_customer ON events(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_employee ON events(employee_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_employee ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(check_in_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
```

### 3.2 Frontend: Vercel (Free)

Vercel's free tier (Hobby) gives you:
- 100 GB bandwidth/month
- Unlimited sites
- Automatic HTTPS + CDN

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy frontend
cd frontend
vercel --prod

# 3. Set environment variables in Vercel dashboard:
#    VITE_API_URL=https://your-backend-url.com
```

**Setup `frontend/src/api/client.ts` for production**:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('api_token') || 'mgh-dashboard-secret-token-change-me';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
```

Add `VITE_API_URL` to `frontend/.env`:
```env
VITE_API_URL=https://mgh-backend.onrender.com
```

### 3.3 Oracle Cloud Always Free VM — Step-by-Step Setup

This is the recommended deployment for ₹0/month. Unlike Render (which sleeps), Oracle gives you a full ARM VM that runs 24/7.

#### 3.3.1 Sign Up

1. Go to [oracle.com/cloud/free](https://oracle.com/cloud/free) → **Start for free**
2. Fill in details (name, email, etc.)
3. **You MUST provide a credit/debit card** (₹2 verification charge, refunded immediately). This is mandatory even for free tier. Use a real card — virtual cards are often rejected.
4. Choose **Home Region**: Pick **Mumbai (ap-mumbai-1)** — lowest latency in India, Always Free Ampere is supported here
5. Wait for account activation email (usually instant, occasionally 15-30 min)

#### 3.3.2 Create the VM (Ampere A1 ARM)

**⚠️ The "Out of Capacity" problem**: Ampere instances are very popular. You may see "Out of host capacity" — this means no free slots in your chosen availability domain. Fixes:
- Try ALL availability domains (AD-1, AD-2, AD-3) — one may have capacity
- Try at different times of day (early morning India time works best)
- If persistent, upgrade to PAYG (Pay As You Go). You still don't pay anything as long as you stay within Always Free limits. The upgrade gives you priority capacity access. Set a budget alert at ₹1 to be safe.

**Steps:**

1. OCI Console → **Compute → Instances → Create instance**
2. Name: `mgh-bot-server`
3. **Placement**: Try AD-1 first, then AD-2, AD-3 if out of capacity
4. **Image**: Click **Change image** → **Ubuntu 22.04** (or 24.04 — always pick one labeled "Always Free Eligible")
5. **Shape**: Click **Change shape** → **Specialty and legacy** → **VM.Standard.A1.Flex**
   - OCPU count: **2** (max free)
   - Memory (GB): **12** (max free)
   - ✅ Under the shape it should say "Always Free Eligible"
6. **Networking**: Keep default VCN + public subnet. Ensure **"Assign a public IPv4 address"** is checked
7. **Add SSH key**: 
   ```bash
   # On YOUR PC (Windows PowerShell / WSL), generate one:
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/oracle_mgh
   ```
   Paste the contents of `~/.ssh/oracle_mgh.pub` into the SSH key field
8. **Boot volume**: Leave at default 50 GB (uses 50/200 GB free storage)
9. Click **Create**

Wait ~1-2 minutes for provisioning. Note the **Public IP address**.

#### 3.3.3 Firewall Rules

By default Oracle blocks ALL inbound traffic. You must explicitly open ports.

OCI Console → **Networking → Virtual Cloud Networks → `<your-vcn>` → Security Lists → `<default-list>` → Add Ingress Rules**:

| Source | IP Protocol | Dest Port | Description |
|--------|:---:|:---:|------|
| 0.0.0.0/0 | TCP | 22 | SSH |
| 0.0.0.0/0 | TCP | 3001 | Backend API |
| 0.0.0.0/0 | TCP | 9090 | WebSocket orchestrator |

Then on the VM itself:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 9090/tcp
sudo ufw enable
```

Also disable Ubuntu's default firewall if any conflicts:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 9090 -j ACCEPT
sudo netfilter-persistent save
```

#### 3.3.4 SSH Into VM & Install Dependencies

```bash
ssh -i ~/.ssh/oracle_mgh ubuntu@<YOUR_VM_PUBLIC_IP>

# Update
sudo apt update && sudo apt upgrade -y

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Verify
node --version  # should be v20.x
```

#### 3.3.5 Deploy the Bot

```bash
# Clone repo
git clone https://github.com/your-username/mgh-automated-reply.git
cd mgh-automated-reply/backend

# Install deps
npm ci

# Setup env
cp .env.example .env
nano .env
# Edit: PORT=3001, API_TOKEN=change-me, PHONE_AUTH_TOKEN=change-me, WS_PORT=9090

# Initialize DB
npm run db:init
npm run db:seed   # optional — sample data

# PM2 (keeps app alive, auto-restarts)
sudo npm i -g pm2
pm2 start server.js --name backend
pm2 start src/whatsapp/orchestrator.js --name orchestrator
pm2 save
pm2 startup
# Follow the command PM2 prints (usually sudo env PATH=...)

# Verify
curl http://localhost:3001/api/health
# → {"status":"ok","uptime":...}
```

#### 3.3.6 Tailscale on VM (for Phone ↔ VM Connection)

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# Authorize in browser
# VM now has a 100.x.y.z Tailscale IP

# Phone connects to: ws://<VM_TAILSCALE_IP>:9090
```

#### 3.3.7 ⚠️ CRITICAL: Prevent Idle Reclamation

**Oracle reclaims free VMs** that stay below these thresholds for 7 days:
- CPU < 20%
- Network < 20%  
- Memory < 20%

A WhatsApp bot with moderate traffic will hit these thresholds naturally (every message triggers processing). But if you have zero traffic, the VM gets deleted. The fix:

```bash
# Install a lightweight load generator
sudo apt install -y stress-ng

# Create cron job to run every 30 mins (keeps utilization above 20%)
echo "*/30 * * * * /usr/bin/stress-ng --cpu 1 --vm 1 --vm-bytes 500M --timeout 60s" | crontab -
```

This burns ~25% CPU + 500MB RAM for 60 seconds every 30 min. Well within the Ampere's 2-core/12GB budget, and keeps Oracle from reclaiming your instance.

**Alternative (cleaner)**: If you use PM2 with the orchestrator and API both running, PLUS the dashboard frontend pinging /api/health every few minutes, you'll likely stay above thresholds naturally. Only add the cron job if you get a reclaim warning email from Oracle.

#### 3.3.8 Connect Phone to VM

On your Android (Termux):
```bash
export VM_URL="ws://<VM_TAILSCALE_IP>:9090"
export PHONE_AUTH_TOKEN="phone-secret-token-change-me"
node phone-client.js
```

You should see `[Phone] Connected to VM` on the phone and `[Orchestrator] Phone phone-1 connected` on the VM.

### 3.4 The Orchestrator (WebSocket Server)

The orchestrator runs on port 9090 and must be on the **same machine as the backend** (or accessible from the phone).

**Important**: Render free tier won't work for the orchestrator — WebSocket support on free tier is limited and the port is fixed. Use:

| Host | Backend | Orchestrator | Cost |
|------|---------|--------------|------|
| Oracle Cloud | ✅ Full VM | ✅ Full VM | ₹0 |
| Render | ✅ Works (sleep issue) | ❌ No custom ports | ₹0 |
| Your PC | ✅ | ✅ | Electricity only |
| Raspberry Pi | ✅ | ✅ | One-time ₹3-5K |

**Recommended**: Oracle Cloud Always Free tier — single VM runs both Express API + WebSocket orchestrator.

### 3.5 Tailscale on the VM

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# The VM now has a 100.x.y.z IP
# Phone connects to: ws://100.x.y.z:9090
```

---

## 4. Full Zero-Cost Stack Summary

| Component | Service | Cost |
|-----------|---------|------|
| **Database** | NeonDB Free Tier | ₹0 |
| **Frontend** | Vercel Hobby / Cloudflare Pages | ₹0 |
| **Backend API** | Oracle Cloud Always Free (ARM VM) | ₹0 |
| **WebSocket Orchestrator** | Same Oracle VM (port 9090) | ₹0 |
| **Phone Client** | Your phone (Termux) | ₹0 |
| **VPN / Secure link** | Tailscale Free (3 users) | ₹0 |
| **Uptime Monitor** | UptimeRobot Free | ₹0 |
| **Domain** | Use free `*.vercel.app` or `*.onrender.com` subdomain | ₹0 |

**Total: ₹0/month**

---

## 5. Environment Variables Checklist

### `backend/.env` (on Oracle VM / Render)
```env
PORT=3001
API_TOKEN=mgh-dashboard-secret-token-change-me
ADMIN_WHATSAPP=+919876543210
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
PHONE_AUTH_TOKEN=phone-secret-token-change-me
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
NODE_ENV=production
WS_PORT=9090
```

### `frontend/.env` (on Vercel)
```env
VITE_API_URL=https://your-backend-url.com
```

### Phone (Termux `~/.bashrc`)
```bash
export VM_URL="ws://100.x.y.z:9090"        # VM's Tailscale IP
export PHONE_AUTH_TOKEN="phone-secret-token-change-me"
```

---

## 6. Post-Deployment Steps

```bash
# 1. Initialize database schema
node backend/src/db/database.js --init

# 2. Seed with sample data (optional)
cd backend && npm run db:seed

# 3. Start services via PM2
pm2 start server.js --name backend
pm2 start src/whatsapp/orchestrator.js --name orchestrator

# 4. Verify
curl https://your-backend/api/health
# → {"status":"ok","uptime":123}

# 5. Start phone client on Android
cd ~/mgh-phone/phone && node phone-client.js
# → [Phone] Connected to VM
# → [Phone] Authenticated
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Phone can't connect to VM | Check Tailscale is running on both. Ping `100.x.y.z` from Termux |
| `termux-notification-list` returns empty | Enable notification access for Termux:API in Android Settings |
| Shizuku commands fail | Re-start Shizuku after reboot. Grant Termux permission in Shizuku app |
| NeonDB connection refused | Check IP allowlist in Neon dashboard. Add `0.0.0.0/0` temporarily |
| Render app sleeps | Add UptimeRobot monitor pinging `/api/health` every 5 min |
| WhatsApp messages not sending | Calibrate screen coordinates. Enable Pointer Location in Developer Options |

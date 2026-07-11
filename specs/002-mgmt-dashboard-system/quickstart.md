# Quickstart: MGH WhatsApp Management System

## Prerequisites

- **Node.js v24+**
- **npm 10+**
- **Oracle Cloud VM** (free tier, Ubuntu 22.04, 4 OCPU, 24GB RAM) — for production
- **Android phone** with Termux, Shizuku, Tailscale — for WhatsApp automation
- **Tailscale** installed on both VM and phone

## Setup — Development

### 1. Clone & Install

```bash
git clone https://github.com/doxoncde/MGH-whatsapp-management.git
cd MGH-whatsapp-management

# Install backend + frontend dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values:
#   PORT=3001
#   API_TOKEN=your-secret-dashboard-token
#   ADMIN_WHATSAPP=+919876543211
#   TELEGRAM_BOT_TOKEN=... (optional)
#   TELEGRAM_CHAT_ID=... (optional)
```

### 3. Initialize Database

```bash
cd backend
npm run db:init
# Creates data/mgh.db with schema + seed data (10 sample customers)
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev
# → Backend on http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# → Frontend on http://localhost:5173
# → API proxy: /api/* → localhost:3001
```

### 5. Open Dashboard

```
http://localhost:5173/?token=your-secret-dashboard-token
```

You should see the executive dashboard with KPI cards, funnel chart, and activity feed. All 8 pages accessible via the left sidebar.

---

## Setup — WhatsApp Automation

### 1. Phone Setup

```bash
# On Android phone in Termux:
cd /data/data/com.termux/files/home
git clone https://github.com/doxoncde/MGH-whatsapp-management.git
cd MGH-whatsapp-management/phone

# Install
npm install

# Configure
echo 'PHONE_AUTH_TOKEN=your-phone-token' > .env
echo 'VM_URL=ws://<TAILSCALE_VM_IP>:9090' >> .env

# Start
node phone-client.js
```

### 2. VM Orchestrator Setup

```bash
# On Oracle VM:
cd ~/MGH-whatsapp-management/backend

# Start orchestrator (runs on port 9090)
npm run orchestrator

# Or with PM2 for production:
pm2 start src/whatsapp/orchestrator.js --name mgh-orchestrator
```

### 3. Test WhatsApp Flow

Send a WhatsApp message to your resort number from another phone:

```
You: "Hi"
Bot: "🌴 Welcome to MGH Resort! 1️⃣ Brochure  2️⃣ Videos  3️⃣ Both"
```

Check the dashboard — the customer should appear in the CRM with a new conversation logged.

---

## Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### 2. Server Production

```bash
cd backend
npm run start
# Express serves frontend/dist/ as static files
# API on /api/*
# WebSocket on :9090
# Dashboard on http://<vm-ip>:3001
```

### 3. PM2 Setup

```bash
npm install -g pm2
pm2 start server.js --name mgh-backend
pm2 start src/whatsapp/orchestrator.js --name mgh-orchestrator
pm2 save
pm2 startup
```

---

## Verification Checklist

- [ ] Backend starts without errors on port 3001
- [ ] `GET /api/health` returns 200
- [ ] `GET /api/dashboard/overview` returns KPI data
- [ ] `GET /api/customers` returns customer list
- [ ] Frontend dev server starts on port 5173
- [ ] Executive dashboard renders KPI cards with data
- [ ] Bot performance page renders charts
- [ ] Customer CRM shows searchable table
- [ ] Team page shows leaderboard
- [ ] System health shows status cards
- [ ] All 8 sidebar navigation links work
- [ ] Phone client connects to VM orchestrator
- [ ] Sending WhatsApp message triggers dashboard event
- [ ] `npm run build` succeeds in frontend
- [ ] Built frontend loads from Express static serve

---

## Troubleshooting

| Problem | Check |
|---|---|
| Dashboard blank | Browser console for errors. Verify API token in URL. |
| API returns 401 | Token mismatch between `.env` API_TOKEN and URL `?token=`. |
| Charts not rendering | Chart.js is installed. Check console for import errors. |
| No mock data in CRM | Run `npm run db:init` to seed database. |
| Phone client disconnects | Check Tailscale is connected. Verify VM_URL in .env. |
| WebSocket connection refused | Ensure orchestrator is running on VM. Check port 9090 open. |

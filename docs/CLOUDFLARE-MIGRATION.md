# Cloudflare Edge Deployment Guide

**Feature**: `004-cloudflare-edge`

---

## Prerequisites

1. Cloudflare account (free: https://dash.cloudflare.com/sign-up)
2. NeonDB PostgreSQL database (free: https://neon.tech)
3. Project code pushed to GitHub

---

## Step 1: Cloudflare Workers Setup

```bash
cd cloudflare

# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Install dependencies
npm install

# Copy env vars
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your values:
#   API_TOKEN = your-dashboard-token
#   PHONE_AUTH_TOKEN = your-phone-auth-token
#   ADMIN_WHATSAPP = +91XXXXXXXXXX
#   DATABASE_URL = postgresql://... from NeonDB dashboard
```

---

## Step 2: NeonDB Database Setup

1. Go to https://neon.tech → Create project
2. Choose region: **ap-south-1 (Mumbai)** or nearest
3. Copy the connection string — format:
   ```
   postgresql://user:password@ep-xxxx.ap-south-1.aws.neon.tech/mgh_db?sslmode=require
   ```
4. Paste into `.dev.vars` as `DATABASE_URL`
5. Run the migration:
   ```bash
   # Execute the schema SQL against NeonDB
   psql "postgresql://user:password@ep-xxxx.ap-south-1.aws.neon.tech/mgh_db?sslmode=require" \
     -f src/db/migrations/001_initial.sql
   ```
   Or use NeonDB's SQL Editor in the dashboard — copy-paste the migration file.

---

## Step 3: Deploy

```bash
cd cloudflare

# Deploy DO + Worker
wrangler deploy

# Output shows:
# Deployed 'mgh-bot' (Worker URL: https://mgh-bot.<your-subdomain>.workers.dev)
# Orchestrator DO is automatically deployed with the Worker
```

---

## Step 4: Configure Wrangler Secrets (Production)

Do NOT commit `.dev.vars` to git. Use wrangler secrets for production:

```bash
wrangler secret put API_TOKEN
wrangler secret put PHONE_AUTH_TOKEN
wrangler secret put ADMIN_WHATSAPP
wrangler secret put DATABASE_URL
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

---

## Step 5: Point Frontend to Worker

Update `frontend/.env`:
```env
VITE_API_URL=https://mgh-bot.<your-subdomain>.workers.dev
```

Deploy frontend:
```bash
cd frontend
npm run build
npx vercel --prod
```

---

## Step 6: Point Phone to DO WebSocket

On the Android phone (Termux):

```bash
# Stop old phone-client (if running)
pm2 stop phone-client

# Update VM_URL to point to DO WebSocket endpoint
export VM_URL="wss://mgh-bot.<your-subdomain>.workers.dev/ws"
export PHONE_AUTH_TOKEN="phone-secret-token-change-me"

# Use the latest phone-client from the repo
cd ~/mgh-phone/phone
git pull
npm install

# Start with PM2
pm2 start phone-client.js --name phone-client
pm2 save
```

---

## Step 7: Verify

```bash
# Health check
curl https://mgh-bot.<your-subdomain>.workers.dev/api/health
# → {"status":"ok","uptime":...}

# Dashboard overview (authenticated)
curl -H "Authorization: Bearer mgh-dashboard-secret-token-change-me" \
  https://mgh-bot.<your-subdomain>.workers.dev/api/dashboard/overview

# Phone connection: check DO health
curl https://mgh-bot.<your-subdomain>.workers.dev/ws/health
# → {"phoneConnected":true,"phoneId":"phone-1"}
```

On the phone, you should see:
```
[Phone] Connected to VM
[Phone] Authenticated
```

On the Worker logs (`wrangler tail`), you should see:
```
[DO] Phone phone-1 authenticated
```

---

## Rollback Plan

If Cloudflare migration fails:

1. Point frontend `.env` back to Oracle VM or localhost
2. Point phone `VM_URL` back to Oracle VM or localhost
3. The original code in `backend/` and `phone/phone-client.js` is untouched and still works

No data is lost — NeonDB is the new source of truth regardless.

---

## Monitoring

```bash
# Live tail of Worker + DO logs
wrangler tail

# DO-specific metrics
wrangler d1 list  # (if using D1 for additional storage)
```

Key things to watch:
- `[DO] Phone disconnected` — phone crash/network issue
- `[DO] Message error` — incoming message parsing failure
- NeonDB cold start logs — latency spikes

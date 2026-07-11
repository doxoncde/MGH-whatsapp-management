# Quickstart Guide: WhatsApp Auto-Reply Bot

## Prerequisites

1. **Node.js v24+** installed (`node --version`)
2. **Meta Business Account** with a verified WhatsApp Business phone number
3. **Meta App** with WhatsApp product added and a permanent access token
4. **ngrok** (for local dev) or a public HTTPS domain (for production)
5. **Media files**: `brochure.pdf` and at least one `.mp4` video in `media/`

## Setup

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Meta credentials:

```env
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_ACCESS_TOKEN=EAAxxx...your-token...
VERIFY_TOKEN=my_custom_verify_token
PORT=3000
```

### 2. Add Media Files

Place your resort brochure and videos in the `media/` directory:

```
media/
├── brochure.pdf
├── video1.mp4
└── video2.mp4
```

Update `src/whatsapp/templates.js` with your specific file names and MIME types.

### 3. Install & Start

```bash
npm install
npm start
```

Expected output:
```
[MGH Bot] Server started on port 3000
[MGH Bot] Uploaded brochure: media-id-abc123
[MGH Bot] Uploaded video1: media-id-def456
[MGH Bot] Uploaded video2: media-id-ghi789
[MGH Bot] Media pre-loaded. Ready for messages.
```

### 4. Expose with ngrok (dev only)

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`).

### 5. Configure Meta Webhook

1. Go to [Meta Developer Dashboard](https://developers.facebook.com) → Your App → WhatsApp → Configuration
2. Set **Webhook URL**: `https://your-domain.com/webhook` (ngrok URL for dev)
3. Set **Verify Token**: Same as `VERIFY_TOKEN` in `.env`
4. Click **Verify and Save**
5. Subscribe to the `messages` webhook field

### 6. Test

Send a WhatsApp message to your resort number:

```
You: Hi
Bot: 🌴 Welcome to MGH Resort!
     How can we help you today?
     1️⃣ View our Brochure
     2️⃣ Watch Resort Videos
     3️⃣ Both
     Reply with 1, 2, or 3.

You: 1
Bot: 📄 [brochure.pdf]
     Here's our resort brochure. Reply 2 if you'd like to see our videos too!

You: 2
Bot: 🎥 [video1.mp4]
     🎥 [video2.mp4]
     Here are videos of our resort. Enjoy!

You: 3
Bot: 📄 [brochure.pdf]
     🎥 [video1.mp4]
     🎥 [video2.mp4]
     Here's everything! Let us know if you have any questions.
```

## Health Check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "uptime": 3600,
  "media": {
    "brochure": "loaded",
    "video1": "loaded",
    "video2": "loaded"
  }
}
```

## Production Deployment

```bash
# Railway / Render (free tier)
# Push to GitHub, connect repo, add env vars, deploy.

# VPS with pm2
npm install -g pm2
pm2 start server.js --name mgh-whatsapp
pm2 save
pm2 startup
```

## Troubleshooting

| Problem | Check |
|---|---|
| Webhook verify fails | `VERIFY_TOKEN` matches in `.env` and Meta dashboard |
| Messages not received | Webhook URL is HTTPS, `messages` field subscribed, server is running |
| Media not sending | Check `npm start` logs for upload errors. Files exist in `media/` |
| "Unknown integration" error | Access token has `whatsapp_business_messaging` permission |
| Costs appearing | Confirm all messages are replies (not outbound-initiated). Check Meta billing dashboard. |

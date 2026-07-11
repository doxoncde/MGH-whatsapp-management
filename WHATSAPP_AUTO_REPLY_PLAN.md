# WhatsApp Auto-Reply Bot — MGH Resort

## Overview
A Node.js + Express server that integrates with Meta's WhatsApp Cloud API. When a customer messages the resort's WhatsApp number, the system auto-replies with a menu: **1 for brochure, 2 for videos**. Based on the selection, it sends the resort brochure (PDF/image) and/or pre-set videos. All within the free 24-hour service window.

---

## Architecture

```
Customer's WhatsApp
        │
        ▼
Meta WhatsApp Cloud API
        │
        ▼ (webhook POST)
Express Server (Node.js)
        │
        ├── Webhook verification (GET)
        ├── Message handler (POST)
        ├── Menu state management
        ├── Media sender (brochure, videos)
        └── Conversation state store (JSON file)
```

---

## India Pricing — WhatsApp Cloud API (2026)

| Category | Rate | What It Covers |
|---|---|---|
| **Service** | **FREE** | Replies within 24 hours of customer messaging you first |
| Utility | ₹0.115/msg | Order updates, payment reminders |
| Marketing | ₹0.8631/msg | Promotions, offers |
| Authentication | ₹0.115/msg | OTPs, verification codes |

**Your use case is 100% Service category = completely FREE on Meta's side.**

| Item | Cost |
|---|---|
| Meta API (service messages) | **₹0** |
| BSP platform fee | ~₹999–₹2,500/month |
| 18% GST on BSP | ~₹180–₹450/month |
| Hosting (free tier) | **₹0** |
| **Total** | **~₹1,200–₹3,000/month** |

---

## Meta Setup Checklist (One-Time)

1. Create a **Meta Business Account** at business.facebook.com
2. Create a **WhatsApp Business App** in Meta Developers dashboard
3. Get a **WhatsApp Business phone number** (can use resort's existing number after verification)
4. Generate a **permanent access token** (or system user token)
5. Configure **webhook URL**: `https://your-server.com/webhook`
6. Subscribe to `messages` webhook field
7. Set up a **public HTTPS URL** (ngrok for dev, real domain + SSL for production)

---

## Tech Stack

| Component | Choice | Why |
|---|---|---|
| Runtime | Node.js v24 | Already installed, native |
| Framework | Express.js | Lightweight webhook server |
| HTTP client | axios | Meta API calls |
| Env vars | dotenv | Secure token storage |
| State store | In-memory Map + JSON file | No DB needed for MVP |
| Media hosting | Upload to Meta once, reuse IDs | No public URL required |
| Process manager | pm2 (optional) | Keep running 24/7 |

---

## Project Structure

```
MGH automated reply/
├── .env
├── .env.example
├── package.json
├── server.js                          # Express entry point — webhooks
├── src/
│   ├── whatsapp/
│   │   ├── client.js                  # Meta Cloud API (send messages/media)
│   │   ├── webhook.js                 # Webhook verification & message parsing
│   │   └── templates.js               # Menu messages, brochure/video payloads
│   ├── handler/
│   │   └── messageHandler.js          # Incoming message router + menu logic
│   ├── state/
│   │   └── conversationStore.js       # In-memory state per phone number
│   └── media/
│       └── mediaSender.js             # Upload & send PDF/images/videos
├── media/                             # Resort brochure & video files
│   ├── brochure.pdf
│   ├── video1.mp4
│   └── video2.mp4
└── data/                              # Persistent state backup
    └── conversations.json
```

---

## Component Details

### 1. `.env` — Configuration

```
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_ACCESS_TOKEN=EAAxxx...
VERIFY_TOKEN=my_custom_verify_token
PORT=3000
```

### 2. `server.js` — Entry Point

- Load dotenv
- Mount webhook routes: `GET /webhook` (verification), `POST /webhook` (incoming messages)
- On startup: pre-upload all media files to Meta, cache media IDs
- Start Express on configured PORT

### 3. `src/whatsapp/webhook.js` — Webhook Handling

**GET `/webhook`**: Meta's verification challenge.
- Reads `hub.mode`, `hub.verify_token`, `hub.challenge` from query params
- If `hub.verify_token` matches `VERIFY_TOKEN`, returns `hub.challenge` with status 200
- Otherwise returns 403

**POST `/webhook`**: Incoming messages.
- Parses JSON body from Meta
- Extracts: `entry[0].changes[0].value.messages[0]` → `from` (customer number), `text.body` (message)
- Calls `messageHandler.handleIncoming(phoneNumber, messageText)`
- Returns 200 immediately (Meta expects fast response)

### 4. `src/whatsapp/client.js` — Meta API Client

```js
const META_API = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;

// Send text
sendTextMessage(to, text)
// POST with { messaging_product: "whatsapp", to, type: "text", text: { body } }

// Send media by ID
sendMediaMessage(to, mediaId, type)  // type: "document" | "image" | "video"
// POST with { messaging_product: "whatsapp", to, type, [type]: { id: mediaId } }

// Upload media to Meta
uploadMedia(filePath, mimeType)
// POST to /{PHONE_NUMBER_ID}/media as multipart/form-data
// Returns { id: "media-id-string" }
```

### 5. `src/whatsapp/templates.js` — Message Templates

```js
const MENU_MESSAGE =
  "🌴 *Welcome to MGH Resort!*\n\n" +
  "How can we help you today?\n\n" +
  "1️⃣  View our Brochure\n" +
  "2️⃣  Watch Resort Videos\n" +
  "3️⃣  Both\n\n" +
  "Reply with *1*, *2*, or *3*.";

const BROCHURE_SENT =
  "📄 Here's our resort brochure. Reply *2* if you'd like to see our videos too!";

const VIDEOS_SENT =
  "🎥 Here are videos of our resort. Enjoy! Reply *1* for the brochure.";

const BOTH_SENT =
  "📄🎥 Here's everything! Let us know if you have any questions.";

const INVALID_OPTION =
  "Please reply with *1* (Brochure), *2* (Videos), or *3* (Both).";
```

### 6. `src/handler/messageHandler.js` — Core Logic

```
handleIncoming(phoneNumber, messageText):
  state = conversationStore.get(phoneNumber)

  if state == null:
    → sendTextMessage(phoneNumber, MENU_MESSAGE)
    → conversationStore.set(phoneNumber, { step: "awaiting_choice" })

  else if state.step == "awaiting_choice":
    choice = messageText.trim()

    if choice == "1":
      → sendMediaMessage(phoneNumber, brochureMediaId, "document")
      → sendTextMessage(phoneNumber, BROCHURE_SENT)
    else if choice == "2":
      → for each video: sendMediaMessage(phoneNumber, videoId, "video")
      → sendTextMessage(phoneNumber, VIDEOS_SENT)
    else if choice == "3":
      → sendMediaMessage(phoneNumber, brochureMediaId, "document")
      → for each video: sendMediaMessage(phoneNumber, videoId, "video")
      → sendTextMessage(phoneNumber, BOTH_SENT)
    else:
      → sendTextMessage(phoneNumber, INVALID_OPTION)
      → return  // stay in awaiting_choice, let them retry

    → conversationStore.set(phoneNumber, { step: "done" })

  else if state.step == "done":
    → sendTextMessage(phoneNumber, MENU_MESSAGE)
    → conversationStore.set(phoneNumber, { step: "awaiting_choice" })
```

### 7. `src/state/conversationStore.js` — State Management

- `Map<phoneNumber, { step: string, timestamp: number }>`
- `get(phoneNumber)` → returns state or null
- `set(phoneNumber, state)` → stores state
- `clear(phoneNumber)` → removes entry
- On startup: load from `data/conversations.json`
- Periodic save: every 60 seconds, write to `data/conversations.json`
- Cleanup: clear states older than 24 hours (service window expired)

### 8. `src/media/mediaSender.js` — Media Handling

**Pre-upload approach (recommended):**

- On server startup, upload all files from `media/` folder to Meta
- Store returned media IDs in memory
- When sending, use media IDs directly — no public URL needed
- Supported formats: PDF (document), MP4 (video), JPEG/PNG (image)
- Max file sizes: 100MB for documents, 16MB for videos

---

## Message Flow

```
Customer: "Hi"
Resort:   🌴 Welcome to MGH Resort!
          How can we help you today?

          1️⃣  View our Brochure
          2️⃣  Watch Resort Videos
          3️⃣  Both

          Reply with 1, 2, or 3.

Customer: "1"
Resort:   📄 [brochure.pdf]
          Here's our resort brochure. Reply 2 if you'd like to see our videos too!

Customer: "2"
Resort:   🎥 [video1.mp4]
          🎥 [video2.mp4]
          Here are videos of our resort. Enjoy! Reply 1 for the brochure.

Customer: "3"
Resort:   📄 [brochure.pdf]
          🎥 [video1.mp4]
          🎥 [video2.mp4]
          Here's everything! Let us know if you have any questions.

Customer: "Hi" (again later)
Resort:   🌴 Welcome to MGH Resort! ...  (menu resets)
```

---

## NPM Dependencies

```json
{
  "dependencies": {
    "express": "^4.21.0",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0",
    "form-data": "^4.0.0",
    "fs-extra": "^11.2.0"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

---

## Running the Server

```bash
# Development (with ngrok for webhook testing)
npx ngrok http 3000
# Copy ngrok HTTPS URL → paste into Meta webhook config
npm run dev

# Production
npm start
# Or with pm2:
pm2 start server.js --name mgh-whatsapp
pm2 save
pm2 startup
```

---

## Deployment Options

| Option | Cost | Notes |
|---|---|---|
| Railway / Render | Free tier | Public URL, HTTPS included, may sleep on free tier |
| fly.io | Free tier | 3 shared VMs, public URL |
| AWS Lightsail | ~₹400–700/mo | VPS with static IP, needs SSL setup |
| Any VPS + Caddy | ~₹500/mo | Caddy auto-handles SSL, simple |

---

## Verification Checklist

- [ ] Webhook verification: Meta accepts the webhook URL
- [ ] Menu message: Customer messages → receives menu
- [ ] Option 1: Reply "1" → brochure delivered
- [ ] Option 2: Reply "2" → all videos delivered
- [ ] Option 3: Reply "3" → brochure + videos delivered
- [ ] Invalid input: Reply "xyz" → retry message, stays on menu
- [ ] New session: Message again after 30 min → fresh menu
- [ ] Cost: Meta dashboard shows ₹0 charges (all service messages)

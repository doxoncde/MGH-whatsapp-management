# Handoff Prompt: MGH Resort WhatsApp Management System — Google AI Studio

> Paste this entire document into Google AI Studio. Ask it to generate a **visual prototype UI mockup** showing the full integrated management system. Request **HTML/CSS output with screenshots** of each dashboard page.

---

## Context: What We're Building

**MGH Resort** needs an integrated WhatsApp management system. Customers message the resort's WhatsApp number, an automated bot replies with a menu (brochure, videos, or talk to sales). The system also collects customer name + phone number, stores them in a database, and enables the resort to send promotional offers and booking-related messages. A full admin dashboard tracks everything.

**Current WhatsApp automation architecture**: An Android phone with Shizuku (ADB bridge) connects via Tailscale encrypted tunnel to an Oracle Cloud free VM running a Node.js orchestrator. The phone executes UI commands (tap, type, swipe) on the official WhatsApp app based on commands from the VM. This avoids API costs — all messages are free service messages since we only reply when customers message first.

---

## What the Visual Prototype Should Show

Please generate a **complete UI mockup set** for a web-based management dashboard (React/Tailwind CSS style preferred, dark theme). The dashboard is the brain of the entire system. Show these pages:

---

### PAGE 1: Executive Dashboard (Overview)

A quick-glance page for the resort owner/manager.

**Top Cards (KPI row):**
- New Leads Today: 47
- Bookings This Month: 23
- Revenue This Month: ₹2,15,000
- Conversion Rate: 18.7% (arrow up 2.3%)
- Active Conversations: 12
- Team Online: 3/4

**Main Area — Funnel Visualization:**
A horizontal funnel chart showing:
- Conversations Started: 247
- Menu Opened: 238
- Brochure Viewed: 112
- Videos Watched: 89
- Asked Human Question: 67
- Booking Intent: 34
- Booked: 23

**Secondary Charts Row:**
- Left: 7-Day Conversation Trend (line chart, rising)
- Right: Revenue by Week (bar chart)

**Sidebar:**
- Recent Activity feed (last 5 events):
  - "Rahul Sharma booked — ₹12,000 — 5 min ago"
  - "New lead: +9198XXXXXX — 12 min ago"
  - "Priya requested brochure — 18 min ago"
  - "Vikram watched videos, asked about pool — 25 min ago"
  - "Anita — booking confirmed ₹8,500 — 42 min ago"

**Navigation:** Overview | Bot Performance | Team | Customers | Promotions | System

---

### PAGE 2: Bot Performance

Analyze how well the automated WhatsApp bot is performing.

**Metric Gauges (top row):**
- Bot Reply Rate: 99.2% (green)
- Menu Engagement: 42% (green)
- Invalid Input Rate: 7.3% (yellow)
- Media Delivery: 98% (green)

**Content Breakdown (pie chart):**
- Brochure Requests: 48% of menu replies
- Video Requests: 32%
- Both Requests: 20%

**Timeline Chart:**
- Hourly message volume heatmap: 24-hour x 7-day grid
  - Bright spots at 10 AM, 2 PM, 7 PM
  - Dark at 1 AM - 6 AM

**Message Variant Performance Table:**
| Variant | Sent | Response Rate | Engagement |
|---|---|---|---|
| Welcome Menu v3 (🌴 emoji) | 89 | 44% | Best |
| Welcome Menu v1 (Namaste) | 78 | 41% | Good |
| Welcome Menu v2 (plain) | 72 | 38% | Good |
| Welcome Menu v4 (ocean 🌊) | 8 | 35% | New |

**Top Customer Questions (word cloud or list):**
- "Price?" (23 times)
- "Pool available?" (18)
- "Room types?" (14)
- "Check-in time?" (11)
- "Wedding packages?" (7)

**Recent Errors Log:**
- "Video resort-tour.mp4 failed to upload — 2 hours ago"

---

### PAGE 3: Customer Data Collection & Database

This is critical — show how customer name + phone is captured and stored.

**Left Panel — Active Conversation (simulated WhatsApp chat view):**
```
Customer: "Hi"
Bot: "🌴 Welcome to MGH Resort! 
     1️⃣ Brochure  2️⃣ Videos  3️⃣ Both
     Reply with a number"

Customer: "1"
Bot: "📄 Here's our brochure! [PDF sent]
     Would you also like:
     4️⃣ Talk to our sales team
     5️⃣ Check availability & pricing"

Customer: "5"
Bot: "Great! To help you better, may I know your name?"

Customer: "Rahul Sharma"
Bot: "Thanks Rahul! What dates are you looking at?"

Customer: "15-18 August, 2 adults"
Bot: "Perfect! Let me check availability. 
     One moment... [employee gets notification]"
```

**Right Panel — Customer Record (auto-created from conversation):**
- Name: Rahul Sharma
- Phone: +919876543210
- Tags: 📄 Brochure Viewed | 💰 Price Inquiry
- Lead Score: 85/100 (hot)
- Conversation History: 3 conversations
- First Contact: 2026-06-15
- Last Contact: Today, 2:15 PM
- Preferred Dates: 15-18 Aug 2026
- Guest Count: 2
- Status: 🟡 Negotiating
- Assigned To: Priya (Sales)
- Notes: "Interested in pool-facing room. Budget ~₹8,000/night."
- Action Buttons: [Send Offer] [Schedule Follow-up] [Mark as Booked]

---

### PAGE 4: Customer Database (CRM View)

A searchable, filterable table of all customers.

**Filters Bar:**
- Search by name or phone
- Status: All | New Lead | Engaged | Hot Lead | Booked | Lost
- Date Range picker
- Tag filter: Brochure | Videos | Price Inquiry | Wedding | Corporate

**Customer Table:**
| Name | Phone | Lead Score | Status | Last Contact | Tags | Assigned |
|---|---|---|---|---|---|---|
| Rahul Sharma | +919876543210 | 85 🔥 | Negotiating | 5 min ago | 📄💰 | Priya |
| Anita Desai | +919876543211 | 95 🔥 | Booked | 1 hr ago | 🎥📄 | Priya |
| Vikram Patel | +919876543212 | 60 🟡 | Engaged | 25 min | 🎥 | Unassigned |
| Sunita Rao | +919876543213 | 20 🟢 | New Lead | 2 hrs | 📄 | Unassigned |
| ... | ... | ... | ... | ... | ... | ... |

Each row has action buttons: [View] [Assign] [Send Message] [Edit]

**Bulk Actions:** [Send Promotion to Selected] [Export CSV] [Assign to Employee]

---

### PAGE 5: Promotions & Campaigns

Send promotional WhatsApp messages to customer segments.

**Top: Segment Builder**
- Who: All customers tagged "Brochure Viewed" AND status "Engaged" AND last contact >7 days ago
- Preview: "12 customers match this segment"

**Message Composer (WhatsApp template preview):**
```
┌─────────────────────────────────────┐
│  WhatsApp Message Preview           │
│                                     │
│  🏖️ Escape to MGH Resort!          │
│                                     │
│  Hi {{name}},                       │
│                                     │
│  Monsoon season is here — enjoy     │
│  30% off on all pool-facing rooms!  │
│  🌧️ Use code MONSOON30.            │
│                                     │
│  Dates: 1 July - 31 August          │
│                                     │
│  [Book Now]  [Talk to Us]           │
│                                     │
│  Variable fields: {{name}} = name   │
│  Buttons: CTA with links            │
└─────────────────────────────────────┘
```

**Campaign History Table:**
| Campaign | Sent To | Opens | Clicks | Bookings | Revenue |
|---|---|---|---|---|---|
| Monsoon 30% Off | 87 | 72 (83%) | 41 (47%) | 8 | ₹96,000 |
| Summer Getaway | 54 | 48 (89%) | 28 (52%) | 11 | ₹1,42,000 |
| Diwali Special | 32 | 30 (94%) | 19 (59%) | 6 | ₹78,000 |

**Campaign Schedule:**
- ⏰ Draft: "Christmas Package" — 43 customers matched — Scheduled: Dec 1

---

### PAGE 6: Team Performance

**Team Leaderboard (top of page):**

Cards in a row, ranked by conversion rate:

```
🥇 Priya Sharma
    Leads: 34 | Bookings: 12 | Conv: 35.3%
    Revenue: ₹1,42,000 | Avg Reply: 1.2 min
    ⭐ 4.8/5 rating

🥈 Rajesh Kumar
    Leads: 28 | Bookings: 9 | Conv: 32.1%
    Revenue: ₹98,000 | Avg Reply: 2.1 min
    ⭐ 4.6/5 rating

🥉 Anita Verma
    Leads: 41 | Bookings: 11 | Conv: 26.8%
    Revenue: ₹1,05,000 | Avg Reply: 3.4 min
    ⭐ 4.3/5 rating

4. Unassigned
    Leads: 21 | Bookings: 0 | Conv: 0%
    ⚠️ Waiting for assignment
```

**Detailed Employee View (clicking Priya):**
- Monthly trend chart: bookings per week (line going up)
- Response time trend (line going down — getting faster)
- Lead pipeline: 34 assigned → 18 responded → 15 intent → 12 booked
- Activity log: last 10 actions with timestamps
- Customer satisfaction: 4.8/5 from 12 reviews

**Team-wide Metrics (bottom):**
- Total team bookings: 32 this month
- Team revenue: ₹3,45,000
- Avg conversion: 31.4%
- Leads waiting: 5
- Peak hours: 11 AM - 1 PM, 5 PM - 8 PM

---

### PAGE 7: System Health

Technical monitoring for the admin.

**Status Cards:**
- 🟢 Bot Uptime: 99.8% (last 30 days)
- 🟢 Oracle VM: CPU 34%, RAM 42%
- 🟢 Android Phone: Connected, Battery 89% (charging)
- 🟢 Tailscale: Connected
- 🟢 WhatsApp: Running (foreground)
- 🟡 API Errors: 2 in last 24 hours

**Error Log Table:**
| Time | Type | Detail |
|---|---|---|
| 14:23 | API Error | WhatsApp crashed — auto-restarted in 12s |
| 08:15 | Media Upload | video-pool.mp4 checksum mismatch |
| Yesterday | Phone | Battery dropped to 5% — switched to backup |

**Daily Stats Graph:**
- Messages per day bar chart for last 30 days
- Average bot reply time line chart

**Admin Actions:**
- [Restart Bot] [Restart Phone Client] [Download Logs] [Test Notification]

---

## Technical Requirements to Convey

- **Theme**: Dark mode dashboard, modern clean UI, resort/tropical warm accent colors (teal, gold, coral)
- **Framework look**: Tailwind CSS style, responsive
- **Charts**: Use a charting library aesthetic (Chart.js or Recharts style)
- **Navigation**: Collapsible left sidebar with icons
- **Real-time feel**: Show a "Live" badge on active conversation, refreshing timestamps

---

## How the System Works (Backend Summary)

```
CUSTOMER WHATSAPP → Android Phone (WhatsApp Official + Shizuku)
                        ↕ Tailscale encrypted tunnel
                   Oracle Cloud VM (Node.js Orchestrator)
                        ├── Event Logger → SQLite Database
                        ├── Message Processor → Reply via Phone
                        ├── Notification Engine → WhatsApp/Telegram alerts
                        └── Express API → Admin Dashboard (web UI)
                             ├── /api/dashboard/overview
                             ├── /api/dashboard/bot
                             ├── /api/dashboard/team
                             ├── /api/customers
                             ├── /api/campaigns
                             └── /api/system
```

All customer data (name, phone, conversation history, tags) is stored in SQLite on the VM. The dashboard is served as a web page on the same VM, accessible via Tailscale or authenticated public URL.

---

## Output Format Requested

Generate as **interactive HTML prototype** with:
1. All 7 pages as separate tabs or full-page renders
2. Dark theme, Tailwind-style aesthetic
3. Mock data filled in (realistic Indian names, numbers, resort context)
4. Charts rendered with mock data
5. Fully clickable navigation between pages

If you can only output one thing, prioritize: **PAGE 1 (Executive Dashboard) + PAGE 3 (Customer Data Collection) + PAGE 6 (Team Performance)**

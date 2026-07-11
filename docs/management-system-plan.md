# MGH Resort — WhatsApp Management System: Planning & Research

**Phase**: Planning (No Implementation)
**Created**: 2026-07-11
**Status**: Draft — Research & Design

---

## 1. Research Summary: Industry WhatsApp Analytics

### 1.1 What Industry Tracks (Market Research Findings)

From research across hospitality, ecommerce, and healthcare WhatsApp analytics platforms (Kuba Labs, FlowCart, ReachMax, SleekFlow, Flostr):

| Tier | Metrics | Why Track It |
|---|---|---|
| **Acquisition** | Conversations started, template open rate (60-90% on WhatsApp vs 20-25% email), cost per initiated conversation | Understand how customers find you |
| **Conversion** | Chat-to-booking rate, drop-off rate per funnel step, booking completion time, quote-to-booking rate | Measure how many leads become customers |
| **Retention** | Rebooking rate, no-show rate, NPS score, customer lifetime value by channel | Track long-term value |
| **Operations** | Response time, agent reply count, resolution time, automated vs human handoff rate | Measure team + bot efficiency |

### 1.2 Industry Benchmarks

| Metric | Poor | Average | Good | Excellent |
|---|---|---|---|---|
| WhatsApp booking conversion rate | <15% | 15-35% | 35-45% | >45% |
| Automated response time | >10s | 5-10s | 2-5s | <2s |
| Funnel abandonment rate | >40% | 20-40% | 10-20% | <10% |
| Template message open rate | <50% | 50-70% | 70-85% | >85% |
| No-show rate (with reminders) | >20% | 10-20% | 5-10% | <5% |
| Rebooking rate (90 days) | <10% | 10-20% | 20-35% | >35% |

---

## 2. Customer Conversion Funnel — MGH Resort

### 2.1 Funnel Stages (Lead Pipeline)

```
STAGE 1: AWARENESS
  Customer messages resort WhatsApp number for the first time
  |
STAGE 2: ENGAGEMENT (AUTO)
  Bot sends welcome menu. Customer picks:
  - "1" → Brochure delivered
  - "2" → Videos delivered
  - "3" → Both delivered
  |
STAGE 3: INTEREST SIGNAL
  Customer asks a question beyond menu options:
  "What's the price?", "Is pool available?", "Dates?"
  → This is a HOT LEAD
  |
STAGE 4: HANDOFF
  System notifies sales team. Employee takes over conversation.
  Employee → Customer: personalized replies, pricing, availability
  |
STAGE 5: INTENT
  Customer provides dates, guest count, preferences
  → This is a QUALIFIED LEAD
  |
STAGE 6: BOOKING
  Customer confirms: "Yes, book it"
  → Booking created (manually or via integrated calendar)
  |
STAGE 7: POST-BOOKING
  Automated confirmation. Check-in reminder. Post-stay review request.
```

### 2.2 What to Track at Each Stage

| Stage | Event to Log | Data Points |
|---|---|---|
| 1. Awareness | `conversation_started` | phone_hash, timestamp, source (organic/click-to-whatsapp) |
| 2. Engagement | `menu_sent`, `brochure_sent`, `videos_sent`, `both_sent` | phone_hash, action, timestamp |
| 3. Interest | `customer_question_asked` | phone_hash, question_text (first 100 chars), timestamp |
| 4. Handoff | `handoff_requested`, `employee_assigned`, `employee_first_reply` | phone_hash, employee_id, timestamp |
| 5. Intent | `dates_provided`, `guest_count_provided` | phone_hash, data_values, timestamp |
| 6. Booking | `booking_confirmed` | booking_id, phone_hash, booking_value, check_in_date, guest_count, timestamp |
| 7. Post-Booking | `reminder_sent`, `review_requested`, `review_received` | phone_hash, action, timestamp |

### 2.3 Funnel Conversion Metrics

```
Conversion Rates:
  Awareness → Engagement:   menu_opens / conversations_started
  Engagement → Interest:    questions_asked / menu_opens
  Interest → Handoff:       handoffs / questions_asked
  Handoff → Intent:         intent_provided / handoffs
  Intent → Booking:         bookings / intent_provided
  Booking → Post-Stay:      reviews_received / bookings

Overall Funnel Efficiency:
  Booking Rate = bookings / conversations_started
```

---

## 3. Auto-Reply Bot Performance KPIs

### 3.1 Bot Metrics

| KPI | Formula | Target | Alert If |
|---|---|---|---|
| **Bot Reply Rate** | menu_sent / conversations_started | >98% | <95% |
| **Menu Engagement Rate** | customers_who_replied_123 / menu_sent | >40% | <25% |
| **Brochure Request Rate** | brochure_requests / menu_sent | 30-40% | — |
| **Video Request Rate** | video_requests / menu_sent | 25-35% | — |
| **Both Request Rate** | both_requests / menu_sent | 20-30% | — |
| **Invalid Input Rate** | invalid_inputs / total_replies | <10% | >15% |
| **Bot Drop-off Rate** | conversations_with_no_menu_reply / menu_sent | <30% | >50% |
| **Time to First Reply** | bot_reply_timestamp - message_received_timestamp | <3s | >10s |
| **Media Delivery Success Rate** | media_delivered / media_requested | >95% | <90% |
| **Conversation Restart Rate** | fresh_menus_after_24h / total_new_conversations | 10-20% | — |

### 3.2 Content Effectiveness (A/B Testable)

| Metric | Why |
|---|---|
| Brochure variant A vs B selection rate | Which welcome message converts better? |
| Video view duration (if trackable) | Are customers actually watching? |
| Most common question after brochure | Is the brochure answering the right questions? |
| Time from brochure open to human request | Gauge of content quality |

---

## 4. Employee/Sales Team Performance KPIs

### 4.1 Individual Employee Metrics

| KPI | Formula | Target |
|---|---|---|
| **Leads Assigned** | Count of handoffs to this employee | — |
| **First Reply Time** | employee_first_reply - handoff_time | <5 min |
| **Avg Reply Time (during active convo)** | avg(reply_n - reply_n-1) | <2 min |
| **Leads → Intent Rate** | intents / leads_assigned | >60% |
| **Intent → Booking Rate** | bookings / intents | >50% |
| **Overall Conversion Rate** | bookings / leads_assigned | >30% |
| **Avg Booking Value** | sum(booking_value) / bookings | ↑ over time |
| **Messages per Booking** | total_employee_msgs / bookings | 8-15 is healthy |
| **Customer Satisfaction** | post-stay rating / NPS | >4.0 / >50 |
| **Weekly Active Time** | Hours spent actively replying | — |

### 4.2 Team Aggregate Metrics

| KPI | Formula |
|---|---|
| **Total Team Bookings This Month** | sum(all bookings) |
| **Team Revenue This Month** | sum(all booking_value) |
| **Team Conversion Rate** | bookings / total_leads_assigned |
| **Avg Team First Reply Time** | avg(all first_reply_times) |
| **Lead Response Coverage** | leads replied / leads assigned (should be 100%) |
| **Peak Hours Identified** | Which hours get most customer messages? |

### 4.3 Employee Message Tracking

```
For each employee message sent:
  - employee_id
  - customer_phone_hash
  - message_type: text | media | template
  - message_direction: employee_to_customer | customer_to_employee
  - timestamp
  - conversation_id
  - is_first_contact (initial outreach vs ongoing convo)
```

---

## 5. System Health & Operational KPIs

### 5.1 Technical Health

| KPI | Target | Alert If |
|---|---|---|
| Bot uptime | >99.5% | <99% |
| Webhook response time | <500ms | >3s |
| API error rate (Meta) | <1% | >3% |
| Media upload failures | 0 | >0 |
| VM CPU usage | <60% | >85% |
| VM RAM usage | <70% | >90% |
| Phone connection uptime | >99% | <95% |
| Tailscale tunnel health | Connected | Disconnected >5min |

### 5.2 Business Hours Coverage

| KPI | Target |
|---|---|
| Messages received outside 8 AM - 10 PM | % of total |
| Bot coverage during off-hours | 100% (bot handles all) |
| Employee coverage during business hours | >95% |
| Longest gap without human reply (during hours) | <30 min |

---

## 6. Revenue & Business Impact KPIs

### 6.1 Direct Revenue Metrics

| KPI | Formula |
|---|---|
| **WhatsApp-Attributed Revenue (Monthly)** | sum(booking_value) where channel = whatsapp |
| **Avg Booking Value (WhatsApp)** | total_rev / total_bookings |
| **Revenue per Conversation Started** | total_rev / total_conversations_started |
| **Revenue per Employee (WhatsApp)** | emp_revenue / emp_id |
| **WhatsApp Share of Total Bookings** | wa_bookings / total_bookings |

### 6.2 Cost Metrics

| KPI | Formula |
|---|---|
| **Cost per Booking** | (infrastructure_cost + employee_salary_portion) / wa_bookings |
| **Cost per Lead** | infrastructure_cost / conversations_started |
| **Employee Time per Booking** | avg(employee_time_spent) / booking |
| **ROI** | (wa_attributed_revenue - costs) / costs × 100 |

### 6.3 Retention Metrics

| KPI | Target |
|---|---|
| Customer re-engagement rate (messages again after 7+ days) | >15% |
| Rebooking rate (same customer books again within 90 days) | >20% |
| Referral rate ("A friend recommended you" keyword in chats) | >5% |
| Post-stay review rate | >30% |

---

## 7. Dashboard Design

### 7.1 Dashboard Pages

```
┌─────────────────────────────────────────────────────┐
│  DASHBOARD 1: Executive Overview                    │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │ New      │ Bookings │ Revenue  │ Conv     │     │
│  │ Leads    │ This Mo  │ This Mo  │ Rate     │     │
│  │ 247      │ 43       │ ₹2.1L    │ 17.4%    │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Funnel Visualization (Sankey/Funnel Chart)  │    │
│  │  Awareness → Engagement → Interest → Booking │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────┬──────────────────────────┐    │
│  │  7-Day Trend    │  30-Day Revenue Trend     │    │
│  │  (Line Chart)   │  (Bar Chart)              │    │
│  └─────────────────┘──────────────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  DASHBOARD 2: Bot Performance                       │
│  - Reply rate gauge                                 │
│  - Menu engagement breakdown (brochure/videos/both) │
│  - Media delivery success rate                      │
│  - Most/least popular content variants              │
│  - Hourly conversation volume heatmap               │
│  - Invalid input trends (which options confuse?)    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  DASHBOARD 3: Team Performance                      │
│  - Employee leaderboard (conversion rate, bookings) │
│  - Avg reply time per employee                      │
│  - Leads in pipeline (not yet booked)               │
│  - Response coverage (% of leads getting human reply)│
│  - Peak activity hours (staff accordingly)          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  DASHBOARD 4: System Health                         │
│  - Uptime tracker                                    │
│  - API error log                                     │
│  - Recent alerts                                     │
│  - Phone battery/connection status                   │
└─────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack for Dashboard

| Component | Option A: Minimal | Option B: Full |
|---|---|---|
| Dashboard Framework | Plain HTML/CSS/JS served by Express | Next.js or React with Chart.js |
| Charts | Chart.js (lightweight) | Apache ECharts or Recharts |
| Data Storage | JSON files + in-memory | SQLite (simple, no server needed) |
| Real-time Updates | Polling every 30s | WebSocket push |
| Authentication | Simple token in URL param | JWT + login page |

**Recommendation**: Option A for MVP. SQLite is free, zero-config, and runs in-process. Chart.js is 80KB. The dashboard lives on the same Oracle VM as the orchestrator, served by Express on port 3000.

---

## 8. Data Architecture

### 8.1 Event Logging Table (SQLite)

```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_hash TEXT NOT NULL,          -- SHA-256 first 12 chars of customer phone
  conversation_id TEXT NOT NULL,     -- UUID per conversation session
  event_type TEXT NOT NULL,          -- 'conversation_started', 'menu_sent', 'brochure_sent', etc.
  event_data JSON,                   -- Additional context {"variant": "menu_v3", "media_id": "abc"}
  actor TEXT DEFAULT 'bot',          -- 'bot' or 'employee_id'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phone ON events(phone_hash);
CREATE INDEX idx_convo ON events(conversation_id);
CREATE INDEX idx_type ON events(event_type);
CREATE INDEX idx_created ON events(created_at);
```

### 8.2 Conversation Table

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,               -- UUID
  phone_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active',      -- 'active', 'handoff', 'booked', 'closed'
  assigned_employee TEXT,
  booking_id TEXT,
  booking_value REAL,
  guest_count INTEGER,
  check_in_date TEXT,
  source TEXT DEFAULT 'organic',     -- 'organic', 'click_to_whatsapp'
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.3 Employee Table

```sql
CREATE TABLE employees (
  id TEXT PRIMARY KEY,               -- employee_id
  name TEXT NOT NULL,
  whatsapp_number TEXT,               -- For notifications
  role TEXT DEFAULT 'sales',         -- 'sales', 'manager', 'admin'
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.4 KPI Aggregations (Materialized via SQL queries)

```sql
-- Daily KPI snapshot (run via cron or on-demand)
CREATE TABLE daily_kpi_snapshots (
  date TEXT PRIMARY KEY,
  conversations_started INTEGER,
  menus_sent INTEGER,
  brochure_requests INTEGER,
  video_requests INTEGER,
  both_requests INTEGER,
  questions_asked INTEGER,
  handoffs_initiated INTEGER,
  handoffs_completed INTEGER,
  bookings_confirmed INTEGER,
  total_booking_value REAL,
  avg_bot_reply_time_ms INTEGER,
  avg_employee_first_reply_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 8.5 Data Flow

```
Phone (WhatsApp)
  | notification
  v
Notification Listener (Termux)
  | WebSocket JSON
  v
Orchestrator (VM)
  |
  |---> Message Processor → Reply via Phone
  |
  |---> Event Logger → SQLite DB
  |
  |---> Dashboard API (Express :3000)
           |
           v
        Admin Dashboard (Browser)
```

---

## 9. Notification System — From Bot to Team

### 9.1 Notification Triggers

| Trigger | Notification | Recipient | Channel |
|---|---|---|---|
| New conversation started | "New lead: +91XXXXXX messaged" | All sales team | WhatsApp group / Telegram |
| Customer asks human question | "🔥 HOT LEAD: +91XXXXXX: 'What's the price?'" | All sales team | WhatsApp + Telegram |
| Lead assigned to employee | "@Rahul — new lead assigned: +91XXXXXX" | Specific employee | WhatsApp DM |
| Booking confirmed | "🎉 BOOKING: ₹15,000 — Rahul closed. +91XXXXXX" | Team group + Manager | WhatsApp + Dashboard |
| Lead unresponded for 15 min | "⏰ Unresponded: +91XXXXXX waiting 15+ min" | Manager | WhatsApp DM |
| System health alert | "⚠️ Phone disconnected for 10 min" | Admin | Telegram |

### 9.2 Notification Architecture

```
Orchestrator (VM)
  |
  |---> WhatsApp Notification → via phone (same ADB pipeline)
  |       Send message to employee's personal WhatsApp number
  |
  |---> Telegram Bot (optional, free)
  |       Uses Telegram Bot API — no cost, instant, reliable
  |
  |---> Dashboard Alert Badge
  |       Red dot + sound on admin dashboard
```

---

## 10. Implementation Phases (for future reference)

| Phase | Scope | Timeline Estimate |
|---|---|---|
| **Phase 1: Core Bot** | ✅ Already planned — auto-reply with menu + media | 2-3 days |
| **Phase 2: Conversation Tracking** | Event logging to SQLite, conversation state persistence | 1-2 days |
| **Phase 3: Human Handoff** | "Reply 4 for sales team" → employee notification → employee can reply | 2-3 days |
| **Phase 4: Basic Dashboard** | Executive overview + bot performance dashboard (HTML/Chart.js) | 3-4 days |
| **Phase 5: Team Dashboard** | Employee metrics, lead pipeline, leaderboard | 2-3 days |
| **Phase 6: Advanced Analytics** | A/B testing, revenue attribution, retention tracking | 3-5 days |
| **Phase 7: Integrations** | Calendar booking, payment link, CRM push | Varies |

---

## 11. Open Questions / Decisions Needed

| # | Question | Options |
|---|---|---|
| Q1 | Should the dashboard be behind login? | Simple token URL (quick) vs JWT auth (secure) |
| Q2 | Notification channel preference? | WhatsApp (via phone) vs Telegram bot vs both |
| Q3 | How many sales employees? | 1-2 (simple leaderboard) vs 5+ (need round-robin logic) |
| Q4 | Integrate with any existing booking system? | Yes (need API details) vs No (manual booking entry) |
| Q5 | Keep SQLite or need remote access? | SQLite local to VM (simple) vs PostgreSQL (multi-user) |
| Q6 | Dashboard accessible from outside? | VPN/Tailscale only vs public URL with auth |

---

## Appendix A: Event Types Reference

```javascript
const EVENT_TYPES = {
  // Bot events
  CONVERSATION_STARTED:    'conversation_started',
  MENU_SENT:               'menu_sent',
  BROCHURE_SENT:           'brochure_sent',
  VIDEOS_SENT:             'videos_sent',
  BOTH_SENT:               'both_sent',
  BROCHURE_REQUESTED:      'brochure_requested',
  VIDEOS_REQUESTED:        'videos_requested',
  BOTH_REQUESTED:          'both_requested',
  INVALID_INPUT:           'invalid_input',
  MEDIA_DELIVERY_FAILED:   'media_delivery_failed',
  CONVERSATION_EXPIRED:    'conversation_expired',
  CONVERSATION_RESTARTED:  'conversation_restarted',

  // Customer-initiated events
  CUSTOMER_QUESTION:       'customer_question',
  HANDOFF_REQUESTED:       'handoff_requested',
  DATES_PROVIDED:          'dates_provided',
  GUEST_COUNT_PROVIDED:    'guest_count_provided',
  PRICE_INQUIRY:           'price_inquiry',

  // Employee events
  EMPLOYEE_ASSIGNED:       'employee_assigned',
  EMPLOYEE_FIRST_REPLY:    'employee_first_reply',
  EMPLOYEE_MESSAGE_SENT:   'employee_message_sent',
  
  // Business outcome events
  BOOKING_CONFIRMED:       'booking_confirmed',
  BOOKING_CANCELLED:       'booking_cancelled',
  REMINDER_SENT:           'reminder_sent',
  REVIEW_RECEIVED:         'review_received',
  REFERRAL_DETECTED:       'referral_detected',

  // System events
  SYSTEM_HEALTH_CHECK:     'system_health_check',
  MEDIA_UPLOAD_SUCCESS:    'media_upload_success',
  MEDIA_UPLOAD_FAILED:     'media_upload_failed',
  PHONE_CONNECTED:         'phone_connected',
  PHONE_DISCONNECTED:      'phone_disconnected',
  API_ERROR:               'api_error',
};
```

## Appendix B: Dashboard API Endpoints

```javascript
// Proposed REST endpoints served by the orchestrator

GET  /api/dashboard/overview          // Executive KPIs (today, this week, this month)
GET  /api/dashboard/funnel            // Funnel stage counts for visualization
GET  /api/dashboard/bot               // Bot performance metrics
GET  /api/dashboard/team              // Team aggregate stats
GET  /api/dashboard/team/:employeeId  // Individual employee stats
GET  /api/dashboard/system            // System health metrics
GET  /api/events?type=X&from=Y&to=Z   // Raw event query for custom analysis
GET  /api/conversations?status=X      // Active conversation list
GET  /api/export/csv?from=Y&to=Z      // CSV export for Excel analysis
```

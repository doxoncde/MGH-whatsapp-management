# Feature Specification: MGH Resort WhatsApp Management System

**Feature Branch**: `002-mgmt-dashboard-system`

**Created**: 2026-07-11

**Status**: Draft

**Input**: Build a full-stack WhatsApp management system — React dashboard with 8 pages, Node.js backend with SQLite, WhatsApp automation layer, customer CRM, promotions engine, team performance tracking, and system health monitoring.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Executive Dashboard Overview (Priority: P1)

The resort owner opens the dashboard to get an immediate snapshot of business performance. The executive dashboard shows key KPIs (new leads, bookings, revenue, conversion rate, active conversations, team online status), a conversion funnel visualization, 7-day trend charts, and a recent activity feed.

**Why this priority**: The executive dashboard is the first page every user sees. It must work for the system to have any value at login.

**Independent Test**: Start the frontend dev server. Navigate to `/`. Verify KPI cards load with data, funnel chart renders, line/bar charts display, and activity feed shows recent events.

**Acceptance Scenarios**:

1. **Given** the system has recorded conversations and bookings, **When** the owner opens the executive dashboard, **Then** KPI cards show accurate counts for leads, bookings, revenue, and conversion rate
2. **Given** at least 7 days of data exists, **When** the page loads, **Then** the 7-day trend chart displays daily conversation counts
3. **Given** recent activity exists, **When** the page loads, **Then** the activity feed shows the 10 most recent events with timestamps and descriptions
4. **Given** no data exists (fresh install), **When** the dashboard loads, **Then** KPI cards show zeros and charts display empty states with helpful messaging

---

### User Story 2 — Bot Performance Analytics (Priority: P1)

The owner wants to analyze how well the automated WhatsApp bot is performing. The bot performance page shows reply rate, menu engagement breakdown, content variant A/B comparison, hourly message volume heatmap, and top customer questions.

**Why this priority**: Critical for optimizing the automated bot which handles all initial customer contact. Directly impacts lead quality and conversion.

**Independent Test**: Navigate to `/bot-performance`. Verify reply rate gauge displays, pie chart shows brochure/videos/both split, variant table renders, and heatmap is populated.

**Acceptance Scenarios**:

1. **Given** bot has sent menus to 100 customers and 42 replied, **When** viewing bot performance, **Then** the menu engagement rate shows 42% with a green indicator
2. **Given** multiple message variants have been used, **When** the variant performance table loads, **Then** each variant shows sent count, response rate, and an engagement comparison
3. **Given** at least 24 hours of message data exists, **When** viewing the heatmap, **Then** brighter cells appear at peak hours (10 AM, 2 PM, 7 PM) and dark at night (1 AM-6 AM)

---

### User Story 3 — Customer CRM & Data Collection (Priority: P1)

When a customer messages the resort WhatsApp, the system auto-captures their name and phone number. The CRM page shows all customers in a searchable, filterable table. Each customer has a lead score, tags, status, assigned employee, and action buttons. A split-view data collection page shows the WhatsApp conversation on the left and the auto-populated customer record on the right.

**Why this priority**: The CRM is the core business value — converting WhatsApp chats into trackable customer records. Without this, the system is just a messaging bot.

**Independent Test**: Navigate to `/customers`. Verify table loads with customer data. Click on a customer to view details. Use the search bar and status filter. Navigate to `/customer-data` and verify the split view renders.

**Acceptance Scenarios**:

1. **Given** customers have messaged the resort, **When** viewing the CRM table, **Then** each row shows name, phone, lead score, status, last contact time, tags, and assigned employee
2. **Given** a conversation where a customer provided their name, **When** viewing their record, **Then** the name field is populated from the WhatsApp conversation
3. **Given** a customer asked about pricing and viewed the brochure, **When** viewing their record, **Then** lead score reflects engagement signals (price inquiry = +30, brochure viewed = +20, videos watched = +15)
4. **Given** the search bar, **When** the owner types a partial name or phone number, **Then** the table filters to matching records in real time
5. **Given** empty CRM (no customers), **When** viewing the page, **Then** an empty state message is displayed with guidance

---

### User Story 4 — Promotions & Campaigns (Priority: P2)

The owner wants to send promotional WhatsApp messages to specific customer segments. The promotions page has a segment builder, a message template composer with variable fields ({{name}}), and a campaign history table showing open rates, click rates, bookings generated, and revenue.

**Why this priority**: Drives repeat bookings and revenue. Can operate independently of other features once customer data exists.

**Independent Test**: Navigate to `/promotions`. Build a segment, compose a template, and verify the preview renders. Check the campaign history table.

**Acceptance Scenarios**:

1. **Given** customers tagged "Brochure Viewed" and "Price Inquiry", **When** building a segment with these filters, **Then** the matching count updates to show how many customers match
2. **Given** a template with {{name}} variable, **When** previewing for a specific customer, **Then** the variable is replaced with the actual customer name
3. **Given** campaigns have been sent historically, **When** viewing the history table, **Then** each row shows campaign name, sent count, open rate, click rate, bookings generated, and revenue

---

### User Story 5 — Team Performance & Employee Tracking (Priority: P2)

The owner wants to see how each sales employee is performing. The team page shows a leaderboard ranked by conversion rate, per-employee detailed stats (leads, bookings, revenue, reply time, satisfaction rating), and tracks every message sent by each employee to customers.

**Why this priority**: Drives accountability and identifies training needs. Can be added after the core CRM is functional.

**Independent Test**: Navigate to `/team`. Verify leaderboard renders with employee cards ranked by conversion rate. Click an employee to see detailed stats.

**Acceptance Scenarios**:

1. **Given** multiple employees have handled leads and closed bookings, **When** viewing the leaderboard, **Then** employees are ranked by conversion rate with their booking count, revenue, and reply time displayed
2. **Given** an employee has sent 50+ messages this month, **When** viewing their detail page, **Then** a monthly trend chart shows their booking and response time trends
3. **Given** leads are unassigned, **When** viewing the leaderboard, **Then** an "Unassigned" section shows the count of leads waiting for assignment

---

### User Story 6 — System Health Monitoring (Priority: P2)

The admin needs to monitor system health. The system health page shows uptime, VM CPU/RAM usage, phone connection status, Tailscale tunnel status, error logs, and daily message stats.

**Why this priority**: Critical for operations but non-blocking for initial deployment.

**Independent Test**: Navigate to `/system`. Verify status cards show current state. Check error log table.

**Acceptance Scenarios**:

1. **Given** the system has been running for 30 days, **When** viewing system health, **Then** the uptime card shows 99%+ with a 30-day trend
2. **Given** an API error occurred 2 hours ago, **When** viewing the error log, **Then** the error appears with timestamp, type, and detail

---

### User Story 7 — Backend REST API (Priority: P1)

The dashboard frontend needs data. The backend exposes REST API endpoints for all dashboard data. Each endpoint returns JSON with proper error handling, CORS headers, and authentication.

**Why this priority**: The frontend can't function without the API. Must be built alongside the frontend.

**Independent Test**: Start the backend, call `GET /api/dashboard/overview`, verify JSON response with correct schema.

**Acceptance Scenarios**:

1. **Given** the backend is running, **When** any dashboard API endpoint is called, **Then** it returns JSON within 200ms
2. **Given** an invalid request, **When** calling an API endpoint, **Then** it returns a structured error response with appropriate HTTP status code
3. **Given** CSV export is requested, **When** calling `GET /api/export/csv`, **Then** a valid CSV file is returned with proper headers

---

### User Story 8 — WhatsApp Automation Integration (Priority: P1)

The backend orchestrator communicates with the Android phone via WebSocket over Tailscale. When a customer messages, the phone sends a notification to the VM, which processes it through the anti-detection engines (delay, typing, idle behavior, template variants) and sends reply commands back to the phone.

**Why this priority**: This is the core automation that makes customer interaction possible.

**Independent Test**: Simulate a phone WebSocket connection. Send a mock WhatsApp message. Verify the orchestrator processes it and responds with appropriate commands.

**Acceptance Scenarios**:

1. **Given** a phone is connected via WebSocket, **When** a customer message arrives, **Then** the orchestrator receives it within 3 seconds
2. **Given** the orchestrator processes a message, **When** it decides to reply, **Then** it sends a sequence of ADB commands (tap, type with delays, send) to the phone
3. **Given** a new conversation starts, **When** the bot sends the welcome menu, **Then** the menu is randomly selected from 5 variants

---

### Edge Cases

- What happens when the SQLite database is empty? All API endpoints return empty arrays with appropriate metadata (count: 0, message: "No data yet").
- What happens when the phone disconnects mid-conversation? The VM detects the WebSocket close and logs the disconnection. Customer messages are queued. When the phone reconnects, pending messages are processed.
- What happens with concurrent API requests to the dashboard? SQLite handles concurrent reads natively. Write operations use transactions to prevent races.
- What happens when the campaign segment matches zero customers? The segment builder shows "0 customers match" and disables the send button.
- What happens when a customer provides a non-Indian phone number? The system still records it. Lead scoring and processing are identical.
- What happens when chart data exceeds 1000 data points? Charts aggregate data by day/week/month depending on the time range selected.

## Requirements *(mandatory)*

### Functional Requirements

**Dashboard Frontend:**
- **FR-001**: System MUST render an executive dashboard with KPI cards, funnel chart, trend chart, revenue chart, and activity feed
- **FR-002**: System MUST render a bot performance page with reply rate gauge, content breakdown pie chart, variant comparison table, hourly heatmap, and top questions list
- **FR-003**: System MUST render a customer CRM with searchable, filterable table showing name, phone, lead score, status, tags, assigned employee
- **FR-004**: System MUST render a customer data collection split view showing WhatsApp chat on left and customer record on right
- **FR-005**: System MUST render a promotions page with segment builder, template composer with variable fields, message preview, and campaign history
- **FR-006**: System MUST render a team performance page with leaderboard ranked by conversion rate, per-employee detail views, and employee message tracking
- **FR-007**: System MUST render a system health page with status cards, error log table, daily stats graph, and admin action buttons
- **FR-008**: System MUST render an admin/settings page for resort info, WhatsApp config, and employee management
- **FR-009**: All dashboard pages MUST use a dark theme with teal/gold/coral accent colors
- **FR-010**: All dashboard pages MUST handle loading, empty, and error states gracefully

**Backend API:**
- **FR-011**: System MUST expose `GET /api/dashboard/overview` returning aggregated KPIs for today, this week, and this month
- **FR-012**: System MUST expose `GET /api/dashboard/bot` returning bot performance metrics including reply rate, engagement breakdown, variant stats, and heatmap data
- **FR-013**: System MUST expose `GET /api/customers` with query params for search, status filter, tag filter, and pagination
- **FR-014**: System MUST expose `GET /api/customers/:id` returning full customer record with conversation history
- **FR-015**: System MUST expose `POST /api/customers` and `PUT /api/customers/:id` for creating and updating customer records
- **FR-016**: System MUST expose `GET /api/dashboard/team` and `GET /api/dashboard/team/:employeeId` for team aggregate and per-employee stats
- **FR-017**: System MUST expose `GET /api/system/health` returning VM stats, phone connection status, and uptime
- **FR-018**: System MUST expose `GET /api/export/csv` with date range params for CSV data export
- **FR-019**: All API endpoints MUST return responses within 200ms p95
- **FR-020**: All API endpoints MUST include CORS headers for dashboard origin

**Data & Storage:**
- **FR-021**: System MUST store all events in SQLite with tables: events, conversations, customers, employees, campaigns, bookings
- **FR-022**: System MUST hash customer phone numbers (SHA-256, first 12 chars) before storing in any log or non-essential table
- **FR-023**: System MUST auto-create customer records when name is first captured from WhatsApp conversation
- **FR-024**: System MUST calculate lead scores based on engagement signals: brochure_viewed (+20), videos_watched (+15), price_inquiry (+30), dates_provided (+25), booking_confirmed (+50)
- **FR-025**: System MUST track every employee message sent to customers with employee_id, customer_id, message_type, and timestamp

**WhatsApp Automation:**
- **FR-026**: System MUST maintain a persistent WebSocket connection between the VM orchestrator and the Android phone client
- **FR-027**: System MUST process incoming WhatsApp notifications within 3 seconds of phone detection
- **FR-028**: System MUST generate human-like reply delays using a configurable timing engine with Gaussian distribution
- **FR-029**: System MUST simulate typing with character-by-character input, multiple bursts, and random pauses
- **FR-030**: System MUST randomize idle behaviors (scroll, contact view, message highlight) before 30% of replies
- **FR-031**: System MUST randomly select from 5 welcome menu variants, 4 brochure variants, 4 video variants, 3 both variants, and 3 retry variants

**Notifications:**
- **FR-032**: System MUST send notifications to the admin WhatsApp number or Telegram when a new customer messages
- **FR-033**: System MUST send notifications when a customer asks a human question (hot lead alert)
- **FR-034**: System MUST send notifications when a lead remains unresponded for 15+ minutes

### Key Entities

- **Customer**: Phone number (hashed), name, lead score, tags, status (new_lead/engaged/negotiating/booked/lost), assigned employee, first contact date, last contact date, preferred dates, guest count, notes
- **Employee**: ID, name, WhatsApp number, role (sales/manager/admin), active status
- **Conversation**: ID, customer reference, status (active/handoff/booked/closed), assigned employee, booking reference, start time, last activity time
- **Event**: ID, phone hash, conversation reference, event type, event data (JSON), actor (bot/employee_id), timestamp
- **Campaign**: ID, name, segment criteria (JSON), template content, variable fields, sent count, open count, click count, booking count, revenue, status (draft/scheduled/sent), scheduled date
- **Booking**: ID, customer reference, employee reference, booking value, guest count, check-in date, check-out date, source (whatsapp), status (confirmed/cancelled/no_show), created date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Executive dashboard loads and renders within 2 seconds on first visit, 500ms on subsequent visits
- **SC-002**: API response time is under 200ms for 95% of requests
- **SC-003**: Customer CRM search returns results within 300ms for databases up to 10,000 customer records
- **SC-004**: Bot processes incoming WhatsApp messages and sends reply commands within 5 seconds of notification
- **SC-005**: Lead scoring is accurate — all defined engagement signals correctly adjust the lead score
- **SC-006**: Campaign segment builder correctly counts matching customers within 1 second
- **SC-007**: Team leaderboard correctly ranks employees by conversion rate with real-time updates
- **SC-008**: CSV export handles 10,000 records without timeout (under 30 seconds)
- **SC-009**: All 8 dashboard pages render without JavaScript console errors
- **SC-010**: System handles 50 concurrent customer conversations without message loss or processing delay

## Assumptions

- The Android phone with WhatsApp, Shizuku, Termux, and Tailscale is already set up per the architecture document
- Oracle Cloud VM is provisioned with Node.js 24 and Tailscale
- The resort has 3-5 sales employees who will be assigned leads
- The frontend is served on the same VM as the backend (no separate hosting needed for MVP)
- Customer data (names, phones) is stored in SQLite — sufficient for resort-scale operations
- The dashboard is accessed by 1-5 admin users simultaneously (not public-facing)
- Promotional messages will be sent via the same phone-based WhatsApp (not Cloud API) — staying within free usage
- Campaign open/click tracking relies on WhatsApp read receipts (not guaranteed for all users)
- Internet connectivity on the phone is stable (WiFi, AC-powered)
- The system is not multi-tenant — single resort, single WhatsApp number

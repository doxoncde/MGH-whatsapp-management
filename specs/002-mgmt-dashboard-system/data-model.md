# Data Model: MGH WhatsApp Management System

## Entities

### Customer

Represents a person who has interacted with the resort via WhatsApp.

| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | UUID |
| `phone_hash` | `TEXT NOT NULL UNIQUE` | SHA-256 first 16 chars of phone number |
| `phone_display` | `TEXT` | Last 4 digits + country code (for display: "91XXXX4321") |
| `name` | `TEXT` | Customer's name (captured from conversation) |
| `lead_score` | `INTEGER DEFAULT 0` | Computed engagement score |
| `status` | `TEXT DEFAULT 'new_lead'` | new_lead / engaged / negotiating / booked / lost |
| `tags` | `TEXT DEFAULT '[]'` | JSON array of tags: ["brochure_viewed", "price_inquiry"] |
| `assigned_employee` | `TEXT` | FK → employees.id, nullable |
| `first_contact_date` | `TEXT` | ISO 8601 datetime |
| `last_contact_date` | `TEXT` | ISO 8601 datetime |
| `preferred_dates` | `TEXT` | Free text (e.g., "15-18 Aug 2026") |
| `guest_count` | `INTEGER` | Number of guests mentioned |
| `notes` | `TEXT` | Employee notes |
| `created_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | Record creation |
| `updated_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | Last update |

### Employee

| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | UUID |
| `name` | `TEXT NOT NULL` | Display name |
| `whatsapp_number` | `TEXT` | For notifications |
| `telegram_id` | `TEXT` | For Telegram notifications |
| `role` | `TEXT DEFAULT 'sales'` | sales / manager / admin |
| `active` | `INTEGER DEFAULT 1` | 1 = active, 0 = inactive |
| `created_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | |

### Conversation

| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | UUID |
| `customer_id` | `TEXT NOT NULL` | FK → customers.id |
| `status` | `TEXT DEFAULT 'active'` | active / handoff / booked / closed |
| `assigned_employee` | `TEXT` | FK → employees.id |
| `booking_id` | `TEXT` | FK → bookings.id, nullable |
| `started_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | |
| `last_activity_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | |

### Event

Every action in the system is logged as an event.

| Field | Type | Description |
|---|---|---|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Sequential ID |
| `phone_hash` | `TEXT NOT NULL` | Hashed phone (for privacy in logs) |
| `customer_id` | `TEXT` | FK → customers.id, nullable |
| `conversation_id` | `TEXT` | FK → conversations.id, nullable |
| `employee_id` | `TEXT` | FK → employees.id, nullable |
| `event_type` | `TEXT NOT NULL` | See event types reference |
| `event_data` | `TEXT DEFAULT '{}'` | JSON with event-specific payload |
| `actor` | `TEXT DEFAULT 'bot'` | bot / employee_id |
| `created_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | |

### Booking

| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | UUID |
| `customer_id` | `TEXT NOT NULL` | FK → customers.id |
| `employee_id` | `TEXT` | FK → employees.id |
| `booking_value` | `REAL` | Amount in INR |
| `guest_count` | `INTEGER` | |
| `check_in_date` | `TEXT` | ISO 8601 date |
| `check_out_date` | `TEXT` | ISO 8601 date |
| `status` | `TEXT DEFAULT 'confirmed'` | confirmed / cancelled / no_show |
| `source` | `TEXT DEFAULT 'whatsapp'` | whatsapp / phone / walk_in |
| `created_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | |

### Campaign

| Field | Type | Description |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | UUID |
| `name` | `TEXT NOT NULL` | Campaign name |
| `segment_criteria` | `TEXT NOT NULL` | JSON with tag/status/score filters |
| `template_content` | `TEXT NOT NULL` | WhatsApp message template with {{variables}} |
| `variable_fields` | `TEXT DEFAULT '[]'` | JSON array of variable names |
| `sent_count` | `INTEGER DEFAULT 0` | |
| `open_count` | `INTEGER DEFAULT 0` | |
| `click_count` | `INTEGER DEFAULT 0` | |
| `booking_count` | `INTEGER DEFAULT 0` | |
| `revenue` | `REAL DEFAULT 0` | |
| `status` | `TEXT DEFAULT 'draft'` | draft / scheduled / sending / sent |
| `scheduled_at` | `TEXT` | ISO 8601 datetime |
| `sent_at` | `TEXT` | ISO 8601 datetime |
| `created_at` | `TEXT DEFAULT CURRENT_TIMESTAMP` | |

### KPI Snapshot

Daily aggregated metrics for trends.

| Field | Type | Description |
|---|---|---|
| `date` | `TEXT PRIMARY KEY` | YYYY-MM-DD |
| `conversations_started` | `INTEGER DEFAULT 0` | |
| `menus_sent` | `INTEGER DEFAULT 0` | |
| `brochure_requests` | `INTEGER DEFAULT 0` | |
| `video_requests` | `INTEGER DEFAULT 0` | |
| `both_requests` | `INTEGER DEFAULT 0` | |
| `questions_asked` | `INTEGER DEFAULT 0` | |
| `bookings_confirmed` | `INTEGER DEFAULT 0` | |
| `total_booking_value` | `REAL DEFAULT 0` | |
| `avg_bot_reply_time_ms` | `INTEGER` | |
| `avg_employee_first_reply_time_ms` | `INTEGER` | |

## Indexes

```sql
CREATE INDEX idx_customers_phone ON customers(phone_hash);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_lead_score ON customers(lead_score);
CREATE INDEX idx_customers_assigned ON customers(assigned_employee);
CREATE INDEX idx_customers_last_contact ON customers(last_contact_date);

CREATE INDEX idx_events_phone ON events(phone_hash);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_conversation ON events(conversation_id);
CREATE INDEX idx_events_customer ON events(customer_id);
CREATE INDEX idx_events_created ON events(created_at);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_employee ON conversations(assigned_employee);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_employee ON bookings(employee_id);
CREATE INDEX idx_bookings_date ON bookings(check_in_date);

CREATE INDEX idx_campaigns_status ON campaigns(status);
```

## Entity Relationships

```
customers 1───* conversations
customers 1───* events
customers 1───* bookings
customers *───1 employees (assigned_employee)

employees 1───* conversations
employees 1───* bookings
employees 1───* events

conversations 1───* events
conversations 1───0..1 bookings

campaigns (standalone, references segment criteria)
```

## State Transitions

### Customer Status
```
new_lead → engaged → negotiating → booked
                               → lost
new_lead → lost
```

### Conversation Status
```
active → handoff → booked
                → closed
active → closed
```

### Campaign Status
```
draft → scheduled → sending → sent
```

-- MGH Management System - Initial Schema

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  phone_hash TEXT NOT NULL UNIQUE,
  phone_display TEXT,
  name TEXT,
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new_lead',
  tags TEXT DEFAULT '[]',
  assigned_employee TEXT,
  first_contact_date TEXT DEFAULT (datetime('now')),
  last_contact_date TEXT DEFAULT (datetime('now')),
  preferred_dates TEXT,
  guest_count INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  telegram_id TEXT,
  role TEXT DEFAULT 'sales',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  assigned_employee TEXT,
  booking_id TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  last_activity_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_hash TEXT NOT NULL,
  customer_id TEXT,
  conversation_id TEXT,
  employee_id TEXT,
  event_type TEXT NOT NULL,
  event_data TEXT DEFAULT '{}',
  actor TEXT DEFAULT 'bot',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  employee_id TEXT,
  booking_value REAL,
  guest_count INTEGER,
  check_in_date TEXT,
  check_out_date TEXT,
  status TEXT DEFAULT 'confirmed',
  source TEXT DEFAULT 'whatsapp',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  segment_criteria TEXT NOT NULL,
  template_content TEXT NOT NULL,
  variable_fields TEXT DEFAULT '[]',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  scheduled_at TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  date TEXT PRIMARY KEY,
  conversations_started INTEGER DEFAULT 0,
  menus_sent INTEGER DEFAULT 0,
  brochure_requests INTEGER DEFAULT 0,
  video_requests INTEGER DEFAULT 0,
  both_requests INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  bookings_confirmed INTEGER DEFAULT 0,
  total_booking_value REAL DEFAULT 0,
  avg_bot_reply_time_ms INTEGER,
  avg_employee_first_reply_time_ms INTEGER
);

-- Indexes
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

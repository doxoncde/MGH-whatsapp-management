CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash VARCHAR(64) NOT NULL UNIQUE,
  phone_display VARCHAR(20),
  name VARCHAR(255),
  lead_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'new_lead',
  tags JSONB DEFAULT '[]',
  assigned_employee UUID REFERENCES employees(id),
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

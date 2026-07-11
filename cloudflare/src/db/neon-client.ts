import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction | null = null;

export function getNeon(): NeonQueryFunction {
  if (!sql) {
    const url = (globalThis as any).DATABASE_URL || process.env.DATABASE_URL || '';
    if (!url) throw new Error('[NeonDB] DATABASE_URL not configured');
    sql = neon(url);
    console.log('[NeonDB] Connection initialized');
  }
  return sql;
}

export async function query(text: string, params: any[] = []) {
  const s = getNeon();
  return s(text, params);
}

// --- Customer operations ---

export function hashPhone(phone: string): string {
  const encoder = new TextEncoder();
  return crypto.subtle
    ? 'sha256-on-edge' // replaced synchronously via Web Crypto
    : phone.slice(-16);
}

export async function hashPhoneAsync(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phone);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function ensureCustomer(phone: string, name?: string) {
  const phoneHash = await hashPhoneAsync(phone);
  const phoneDisplay = phone.slice(-4);

  const existing = await query(
    'SELECT * FROM customers WHERE phone_hash = $1',
    [phoneHash]
  );

  if (existing.length > 0) {
    const customer = existing[0];
    if (name && !customer.name) {
      await query(
        'UPDATE customers SET name = $1, updated_at = NOW() WHERE id = $2',
        [name, customer.id]
      );
      customer.name = name;
    }
    return customer;
  }

  const result = await query(
    `INSERT INTO customers (phone_hash, phone_display, name, status, tags)
     VALUES ($1, $2, $3, 'new_lead', '[]')
     RETURNING *`,
    [phoneHash, phoneDisplay, name || '']
  );

  const customer = result[0];

  await query(
    `INSERT INTO conversations (customer_id, status) VALUES ($1, 'active')`,
    [customer.id]
  );

  await logEvent({
    phoneHash,
    customerId: customer.id,
    eventType: 'conversation_started',
    actor: 'bot',
  });

  return customer;
}

export async function updateCustomer(id: string, fields: Record<string, any>) {
  const setClauses: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      setClauses.push(`${key} = $${idx}`);
      params.push(value);
      idx++;
    }
  }

  if (setClauses.length === 0) return;

  params.push(id);
  await query(
    `UPDATE customers SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
    params
  );
}

export async function updateLeadScore(customerId: string, score: number, status: string) {
  await query(
    'UPDATE customers SET lead_score = $1, status = $2, updated_at = NOW() WHERE id = $3',
    [score, status, customerId]
  );
}

// --- Event operations ---

export async function logEvent(params: {
  phoneHash: string;
  customerId?: string;
  conversationId?: string;
  employeeId?: string;
  eventType: string;
  eventData?: Record<string, any>;
  actor?: string;
}) {
  const { phoneHash = '', customerId, conversationId, employeeId, eventType, eventData = {}, actor = 'bot' } = params;

  await query(
    `INSERT INTO events (phone_hash, customer_id, conversation_id, employee_id, event_type, event_data, actor)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [phoneHash, customerId || null, conversationId || null, employeeId || null, eventType, JSON.stringify(eventData), actor]
  );

  if (customerId) {
    await query(
      'UPDATE customers SET last_contact_date = NOW(), updated_at = NOW() WHERE id = $1',
      [customerId]
    );
  }

  if (conversationId) {
    await query(
      'UPDATE conversations SET last_activity_at = NOW() WHERE id = $1',
      [conversationId]
    );
  }
}

export async function getCustomerEvents(customerId: string) {
  return query(
    'SELECT event_type, created_at FROM events WHERE customer_id = $1 ORDER BY created_at ASC',
    [customerId]
  );
}

// --- Bookings ---

export async function getBookingsByCustomer(customerId: string) {
  return query(
    'SELECT * FROM bookings WHERE customer_id = $1 ORDER BY created_at DESC',
    [customerId]
  );
}

// --- Campaigns ---

export async function getCampaigns() {
  return query('SELECT * FROM campaigns ORDER BY created_at DESC');
}

export async function createCampaign(data: {
  name: string;
  segment_criteria: Record<string, any>;
  template_content: string;
  variable_fields?: string[];
  scheduled_at?: string;
}) {
  const result = await query(
    `INSERT INTO campaigns (name, segment_criteria, template_content, variable_fields, scheduled_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.name,
      JSON.stringify(data.segment_criteria),
      data.template_content,
      JSON.stringify(data.variable_fields || []),
      data.scheduled_at || null,
    ]
  );
  return result[0];
}

export async function updateCampaignSend(id: string, matchedCount: number) {
  return query(
    `UPDATE campaigns SET sent_count = $1, status = 'sent', sent_at = NOW() WHERE id = $2`,
    [matchedCount, id]
  );
}

// --- Query helpers ---

export async function getDashboardOverview() {
  const today = new Date().toISOString().split('T')[0];

  const [todayStats, weekStats, monthStats, funnel, bookings] = await Promise.all([
    query(
      `SELECT
        COUNT(*) FILTER (WHERE event_type = 'conversation_started') AS conversations,
        COUNT(*) FILTER (WHERE event_type = 'menu_sent') AS menus,
        COUNT(*) FILTER (WHERE event_type = 'brochure_requested') AS brochures,
        COUNT(*) FILTER (WHERE event_type = 'videos_requested') AS videos,
        COUNT(*) FILTER (WHERE event_type = 'price_inquiry') AS price_inquiries
       FROM events WHERE created_at::date = $1`,
      [today]
    ),
    query(
      `SELECT created_at::date AS day,
        COUNT(*) FILTER (WHERE event_type = 'conversation_started') AS conversations,
        COUNT(*) FILTER (WHERE event_type = 'menu_sent') AS menus
       FROM events WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY day ORDER BY day`
    ),
    query(
      `SELECT
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END) AS booked_count,
        COALESCE(SUM(booking_value), 0) AS total_revenue
       FROM bookings WHERE created_at >= NOW() - INTERVAL '30 days'`
    ),
    query(
      `SELECT status, COUNT(*) AS count FROM customers GROUP BY status ORDER BY count DESC`
    ),
    query(
      `SELECT * FROM bookings ORDER BY check_in_date DESC LIMIT 5`
    )
  ]);

  return {
    today: todayStats[0] || {},
    week: weekStats,
    month: monthStats[0] || {},
    funnel: funnel,
    recentBookings: bookings,
  };
}

export async function getBotPerformance() {
  const [menuRates, variants, errors] = await Promise.all([
    query(
      `SELECT event_type, COUNT(*) AS count FROM events
       WHERE event_type IN ('menu_sent','brochure_requested','videos_requested','both_requested')
       AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY event_type`
    ),
    query(
      `SELECT event_data, COUNT(*) AS count FROM events
       WHERE event_type = 'menu_sent' AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY event_data ORDER BY count DESC LIMIT 5`
    ),
    query(
      `SELECT * FROM events WHERE actor = 'bot' AND event_type = 'error'
       ORDER BY created_at DESC LIMIT 10`
    ),
  ]);

  return { menuRates, variants, errors };
}

export async function searchCustomers(params: {
  search?: string;
  status?: string;
  tag?: string;
  minScore?: number;
  assigned?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(name ILIKE $${idx} OR phone_display ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status) {
    conditions.push(`status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  if (params.tag) {
    conditions.push(`tags::text ILIKE $${idx}`);
    values.push(`%${params.tag}%`);
    idx++;
  }

  if (params.minScore) {
    conditions.push(`lead_score >= $${idx}`);
    values.push(params.minScore);
    idx++;
  }

  if (params.assigned) {
    conditions.push(`assigned_employee = $${idx}`);
    values.push(params.assigned);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = params.sort || 'last_contact_date';
  const sortDir = params.order || 'DESC';
  const limit = Math.min(params.limit || 20, 100);
  const offset = ((params.page || 1) - 1) * limit;

  const [customers, total] = await Promise.all([
    query(
      `SELECT * FROM customers ${where} ORDER BY ${sortCol} ${sortDir} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    ),
    query(
      `SELECT COUNT(*) AS total FROM customers ${where}`,
      values
    ),
  ]);

  return {
    customers,
    total: parseInt(total[0]?.total || '0'),
    page: params.page || 1,
    limit,
  };
}

export async function getTeamStats() {
  return query(
    `SELECT e.*,
      COUNT(DISTINCT c.id) AS lead_count,
      COUNT(DISTINCT b.id) AS booking_count,
      COALESCE(SUM(b.booking_value), 0) AS total_revenue,
      CASE WHEN COUNT(DISTINCT c.id) > 0
        THEN ROUND(COUNT(DISTINCT b.id)::numeric / COUNT(DISTINCT c.id)::numeric * 100, 1)
        ELSE 0 END AS conversion_rate
     FROM employees e
     LEFT JOIN customers c ON c.assigned_employee = e.id
     LEFT JOIN bookings b ON b.employee_id = e.id
     WHERE e.active = true
     GROUP BY e.id
     ORDER BY total_revenue DESC`
  );
}

export { query as neonQuery };

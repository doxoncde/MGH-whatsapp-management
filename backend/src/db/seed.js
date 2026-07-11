import { initDb, getDb } from './database.js';
import { createHash } from 'crypto';

await initDb();
const db = getDb();
const uuid = () => crypto.randomUUID();

console.log('Seeding database...');

// Employees
const employees = [
  { name: 'Priya Sharma', role: 'sales', whatsapp: '+919876543211' },
  { name: 'Rajesh Kumar', role: 'sales', whatsapp: '+919876543212' },
  { name: 'Anita Verma', role: 'sales', whatsapp: '+919876543213' },
  { name: 'Admin', role: 'admin', whatsapp: '+919876543210' },
];
for (const e of employees) {
  db.prepare('INSERT OR REPLACE INTO employees (id, name, role, whatsapp_number) VALUES (?, ?, ?, ?)')
    .run(uuid(), e.name, e.role, e.whatsapp);
}
console.log(`Seeded ${employees.length} employees`);

// Customers
const customerData = [
  { name: 'Rahul Sharma', phone: '+919876543210', status: 'negotiating', score: 85, tags: ['brochure_viewed', 'price_inquiry'], assigned: 'Priya Sharma' },
  { name: 'Anita Desai', phone: '+919876543211', status: 'booked', score: 95, tags: ['videos_watched', 'brochure_viewed'], assigned: 'Priya Sharma' },
  { name: 'Vikram Patel', phone: '+919876543212', status: 'engaged', score: 60, tags: ['videos_watched'], assigned: null },
  { name: 'Sunita Rao', phone: '+919876543213', status: 'new_lead', score: 20, tags: ['brochure_viewed'], assigned: null },
  { name: 'Mohammed Ali', phone: '+919876543214', status: 'negotiating', score: 75, tags: ['brochure_viewed', 'videos_watched'], assigned: 'Rajesh Kumar' },
  { name: 'Priya Nair', phone: '+919876543215', status: 'booked', score: 90, tags: ['brochure_viewed', 'price_inquiry'], assigned: 'Rajesh Kumar' },
  { name: 'Deepak Singh', phone: '+919876543216', status: 'engaged', score: 50, tags: ['brochure_viewed'], assigned: null },
  { name: 'Neha Gupta', phone: '+919876543217', status: 'new_lead', score: 10, tags: [], assigned: null },
  { name: 'Suresh Reddy', phone: '+919876543218', status: 'negotiating', score: 70, tags: ['videos_watched', 'price_inquiry'], assigned: 'Anita Verma' },
  { name: 'Kavita Joshi', phone: '+919876543219', status: 'booked', score: 88, tags: ['brochure_viewed', 'videos_watched'], assigned: 'Anita Verma' },
];

function hashPhone(phone) { return createHash('sha256').update(phone).digest('hex').slice(0, 16); }

const insertCust = db.prepare(
  'INSERT OR REPLACE INTO customers (id, phone_hash, phone_display, name, lead_score, status, tags, assigned_employee, first_contact_date, last_contact_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(?, ?), datetime(?, ?))'
);
for (const c of customerData) {
  const id = uuid();
  const daysAgo = Math.floor(Math.random() * 30);
  insertCust.run(id, hashPhone(c.phone), 'XXXX' + c.phone.slice(-4), c.name, c.score, c.status, JSON.stringify(c.tags), c.assigned, 'now', `-${daysAgo} days`, 'now', `-${Math.floor(daysAgo * 0.3)} days`);
}
console.log(`Seeded ${customerData.length} customers`);

// Events
const allCustomers = db.prepare('SELECT id, phone_hash FROM customers').all();
const eventTypes = ['conversation_started', 'menu_sent', 'brochure_requested', 'brochure_sent', 'videos_requested', 'videos_sent', 'customer_question', 'price_inquiry', 'dates_provided'];

const insertEvt = db.prepare('INSERT INTO events (phone_hash, customer_id, event_type, actor, created_at) VALUES (?, ?, ?, ?, datetime(?, ?))');
for (let i = 0; i < 200; i++) {
  const c = allCustomers[Math.floor(Math.random() * allCustomers.length)];
  const evt = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const hoursAgo = Math.floor(Math.random() * 720);
  insertEvt.run(c.phone_hash, c.id, evt, 'bot', 'now', `-${hoursAgo} hours`);
}
console.log('Seeded 200 events');

// Bookings
const insertBk = db.prepare('INSERT INTO bookings (id, customer_id, booking_value, guest_count, check_in_date, check_out_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (let i = 0; i < 20; i++) {
  const c = allCustomers[Math.floor(Math.random() * allCustomers.length)];
  const value = Math.round(Math.random() * 20000 + 5000);
  const daysFromNow = Math.floor(Math.random() * 60) + 10;
  const checkIn = new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + (daysFromNow + Math.floor(Math.random() * 3) + 1) * 86400000).toISOString().split('T')[0];
  insertBk.run(uuid(), c.id, value, Math.floor(Math.random() * 4) + 1, checkIn, checkOut, 'confirmed');
}
console.log('Seeded 20 bookings');

// Campaigns
const campaigns = [
  { name: 'Monsoon 30% Off', criteria: '{"tags":["brochure_viewed"],"status":["engaged","negotiating"],"lead_score_min":40}', sent: 87, opened: 72, clicked: 41, booked: 8, revenue: 96000, status: 'sent' },
  { name: 'Summer Getaway', criteria: '{"tags":["videos_watched"],"status":["engaged"],"lead_score_min":30}', sent: 54, opened: 48, clicked: 28, booked: 11, revenue: 142000, status: 'sent' },
  { name: 'Diwali Special', criteria: '{"tags":["price_inquiry"],"status":["negotiating"],"lead_score_min":60}', sent: 32, opened: 30, clicked: 19, booked: 6, revenue: 78000, status: 'sent' },
  { name: 'Christmas Package', criteria: '{"tags":["brochure_viewed","videos_watched"],"status":["engaged","new_lead"],"lead_score_min":20}', sent: 0, opened: 0, clicked: 0, booked: 0, revenue: 0, status: 'draft' },
];
const insertCmp = db.prepare('INSERT INTO campaigns (id, name, segment_criteria, template_content, variable_fields, sent_count, open_count, click_count, booking_count, revenue, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
for (const cmp of campaigns) {
  insertCmp.run(uuid(), cmp.name, cmp.criteria, 'Hi {{name}}, check our offer!', '["name"]', cmp.sent, cmp.opened, cmp.clicked, cmp.booked, cmp.revenue, cmp.status);
}
console.log(`Seeded ${campaigns.length} campaigns`);

console.log('Seed complete!');

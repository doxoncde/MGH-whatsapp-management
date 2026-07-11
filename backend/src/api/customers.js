import { Router } from 'express';
import { getDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { hashPhone } from '../services/eventLogger.js';
import { calculateScore } from '../services/leadScorer.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { search, status, tag, min_score, assigned, sort = 'last_contact_date', order = 'desc', page = 1, limit = 25 } = req.query;
  
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR phone_display LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (tag) { query += ' AND tags LIKE ?'; params.push(`%${tag}%`); }
  if (min_score) { query += ' AND lead_score >= ?'; params.push(Number(min_score)); }
  if (assigned === 'unassigned') { query += ' AND (assigned_employee IS NULL OR assigned_employee = ?)'; params.push(''); }
  else if (assigned) { query += ' AND assigned_employee = ?'; params.push(assigned); }
  
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countQuery).get(...params);
  
  const offset = (Number(page) - 1) * Number(limit);
  const allowedSorts = ['last_contact_date', 'lead_score', 'name', 'created_at'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'last_contact_date';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';
  
  query += ` ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`;
  const customers = db.prepare(query).all(...params, Number(limit), offset)
    .map(c => ({ ...c, tags: JSON.parse(c.tags || '[]') }));
  
  res.json({ customers, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) || 1 });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: true, message: 'Customer not found' });
  
  customer.tags = JSON.parse(customer.tags || '[]');
  
  const conversations = db.prepare('SELECT * FROM conversations WHERE customer_id = ? ORDER BY last_activity_at DESC LIMIT 10').all(req.params.id);
  const bookings = db.prepare('SELECT * FROM bookings WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  const events = db.prepare('SELECT * FROM events WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50').all(req.params.id)
    .map(e => ({ ...e, event_data: JSON.parse(e.event_data || '{}') }));
  
  res.json({ ...customer, conversations, bookings, events });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: true, message: 'Phone number required' });
  
  const phoneHashVal = hashPhone(phone);
  const existing = db.prepare('SELECT * FROM customers WHERE phone_hash = ?').get(phoneHashVal);
  if (existing) return res.json(existing);
  
  const id = uuidv4();
  db.prepare(`INSERT INTO customers (id, phone_hash, phone_display, name, status, tags)
    VALUES (?, ?, ?, ?, 'new_lead', '[]')`).run(id, phoneHashVal, phone.slice(-4), name || '');
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  customer.tags = JSON.parse(customer.tags || '[]');
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, status, tags, assigned_employee, preferred_dates, guest_count, notes } = req.body;
  
  const updates = [];
  const params = [];
  
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
  if (assigned_employee !== undefined) { updates.push('assigned_employee = ?'); params.push(assigned_employee); }
  if (preferred_dates !== undefined) { updates.push('preferred_dates = ?'); params.push(preferred_dates); }
  if (guest_count !== undefined) { updates.push('guest_count = ?'); params.push(guest_count); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  
  if (updates.length === 0) return res.status(400).json({ error: true, message: 'No fields to update' });
  
  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);
  
  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  
  if (assigned_employee !== undefined) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    db.prepare('UPDATE conversations SET assigned_employee = ?, status = ? WHERE customer_id = ? AND status = ?')
      .run(assigned_employee, 'handoff', req.params.id, 'active');
  }
  
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  customer.tags = JSON.parse(customer.tags || '[]');
  res.json(customer);
});

export default router;

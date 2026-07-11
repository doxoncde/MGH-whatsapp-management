import { getDb } from '../db/database.js';
import { createHash } from 'crypto';
import { scoringWeights, scoreLabel } from '../config/scoring.js';

export function hashPhone(phone) {
  return createHash('sha256').update(phone).digest('hex').slice(0, 16);
}

export function logEvent({ phone, customerId, conversationId, employeeId, eventType, eventData = {}, actor = 'bot' }) {
  const db = getDb();
  const phoneHash = phone ? hashPhone(phone) : '';
  
  db.prepare(`INSERT INTO events (phone_hash, customer_id, conversation_id, employee_id, event_type, event_data, actor)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(phoneHash, customerId || null, conversationId || null, employeeId || null, eventType, JSON.stringify(eventData), actor);
  
  if (customerId) {
    db.prepare(`UPDATE customers SET last_contact_date = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(customerId);
  }
  if (conversationId) {
    db.prepare(`UPDATE conversations SET last_activity_at = datetime('now') WHERE id = ?`).run(conversationId);
  }
}

export function ensureCustomer(phone, name) {
  const db = getDb();
  const phoneHash = hashPhone(phone);
  const uuid = () => crypto.randomUUID();
  
  let customer = db.prepare('SELECT * FROM customers WHERE phone_hash = ?').get(phoneHash);
  if (!customer) {
    const id = uuid();
    const phoneDisplay = phone.slice(-4);
    db.prepare(`INSERT INTO customers (id, phone_hash, phone_display, name, status, tags)
      VALUES (?, ?, ?, ?, 'new_lead', '[]')`).run(id, phoneHash, phoneDisplay, name || '');
    
    db.prepare(`INSERT INTO conversations (id, customer_id, status) VALUES (?, ?, 'active')`).run(uuid(), id);
    
    customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    logEvent({ phone, customerId: id, eventType: 'conversation_started', actor: 'bot' });
  } else if (name && !customer.name) {
    db.prepare("UPDATE customers SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, customer.id);
    customer.name = name;
  }
  return customer;
}

export function updateLeadScore(customerId) {
  const db = getDb();
  const events = db.prepare('SELECT event_type FROM events WHERE customer_id = ?').all(customerId);
  
  let score = 0;
  const seenTypes = new Set();
  
  for (const evt of events) {
    const weight = scoringWeights[evt.event_type] || 0;
    if (evt.event_type === 'multiple_conversations') {
      score += weight;
    } else if (!seenTypes.has(evt.event_type)) {
      score += weight;
      seenTypes.add(evt.event_type);
    }
  }
  
  const status = scoreLabel(score);
  db.prepare("UPDATE customers SET lead_score = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(score, status, customerId);
  
  return score;
}

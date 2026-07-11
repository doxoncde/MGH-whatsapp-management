import { Router } from 'express';
import { getDb } from '../db/database.js';
import { stringify } from 'csv-stringify/sync';

const router = Router();

router.get('/csv', (req, res) => {
  const db = getDb();
  const { from, to, type = 'events' } = req.query;
  
  const fromDate = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const toDate = to || new Date().toISOString().split('T')[0];
  
  let records = [];
  let filename = 'export.csv';
  
  if (type === 'customers') {
    records = db.prepare('SELECT id, name, phone_display, lead_score, status, first_contact_date, last_contact_date FROM customers WHERE date(created_at) BETWEEN ? AND ?').all(fromDate, toDate);
    filename = 'customers-export.csv';
  } else if (type === 'bookings') {
    records = db.prepare('SELECT * FROM bookings WHERE date(created_at) BETWEEN ? AND ?').all(fromDate, toDate);
    filename = 'bookings-export.csv';
  } else {
    records = db.prepare("SELECT id, phone_hash, event_type, actor, created_at FROM events WHERE date(created_at) BETWEEN ? AND ? ORDER BY created_at ASC").all(fromDate, toDate)
      .map(r => ({ id: r.id, phone_hash: r.phone_hash, event_type: r.event_type, actor: r.actor, created_at: r.created_at }));
    filename = 'events-export.csv';
  }
  
  const csv = stringify(records, { header: true });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
});

export default router;

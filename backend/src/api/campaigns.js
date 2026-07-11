import { Router } from 'express';
import { getDb } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const campaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all()
    .map(c => ({ ...c, segment_criteria: JSON.parse(c.segment_criteria || '{}'), variable_fields: JSON.parse(c.variable_fields || '[]') }));
  res.json({ campaigns });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, segment_criteria, template_content, variable_fields, scheduled_at } = req.body;
  
  const id = uuidv4();
  db.prepare(`INSERT INTO campaigns (id, name, segment_criteria, template_content, variable_fields, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?)`).run(id, name, JSON.stringify(segment_criteria), template_content, JSON.stringify(variable_fields || []), scheduled_at || null);
  
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  campaign.segment_criteria = JSON.parse(campaign.segment_criteria || '{}');
  campaign.variable_fields = JSON.parse(campaign.variable_fields || '[]');
  res.status(201).json(campaign);
});

router.post('/:id/send', (req, res) => {
  const db = getDb();
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: true, message: 'Campaign not found' });
  
  const criteria = JSON.parse(campaign.segment_criteria || '{}');
  
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  
  if (criteria.tags?.length) {
    for (const tag of criteria.tags) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }
  }
  if (criteria.status?.length) {
    query += ` AND status IN (${criteria.status.map(() => '?').join(',')})`;
    params.push(...criteria.status);
  }
  if (criteria.lead_score_min) {
    query += ' AND lead_score >= ?';
    params.push(criteria.lead_score_min);
  }
  if (criteria.last_contact_before) {
    query += ' AND last_contact_date < ?';
    params.push(criteria.last_contact_before);
  }
  
  const matches = db.prepare(query).all(...params);
  
  // Update campaign stats
  db.prepare(`UPDATE campaigns SET sent_count = ?, status = 'sent', sent_at = datetime('now') WHERE id = ?`)
    .run(matches.length, campaign.id);
  
  res.json({ sent: true, matched_count: matches.length, recipients: matches.map(m => m.id) });
});

router.post('/segment-preview', (req, res) => {
  const db = getDb();
  const criteria = req.body;
  
  let query = 'SELECT COUNT(*) as c FROM customers WHERE 1=1';
  const params = [];
  
  if (criteria.tags?.length) {
    for (const tag of criteria.tags) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }
  }
  if (criteria.status?.length) {
    query += ` AND status IN (${criteria.status.map(() => '?').join(',')})`;
    params.push(...criteria.status);
  }
  if (criteria.lead_score_min) {
    query += ' AND lead_score >= ?';
    params.push(criteria.lead_score_min);
  }
  
  const { c } = db.prepare(query).get(...params);
  res.json({ matched_count: c || 0 });
});

export default router;

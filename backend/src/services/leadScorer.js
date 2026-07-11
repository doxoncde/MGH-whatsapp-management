import { getDb } from '../db/database.js';
import { scoringWeights, scoreLabel } from '../config/scoring.js';

export function calculateScore(customerId) {
  const db = getDb();
  const events = db.prepare('SELECT event_type FROM events WHERE customer_id = ?').all(customerId);
  
  let score = 0;
  const scored = new Set();
  
  for (const { event_type } of events) {
    const weight = scoringWeights[event_type] || 0;
    if (event_type === 'multiple_conversations' || event_type === 'employee_message_sent') {
      score += weight;
    } else if (!scored.has(event_type)) {
      score += weight;
      scored.add(event_type);
    }
  }
  
  const status = scoreLabel(score);
  db.prepare('UPDATE customers SET lead_score = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(score, status, customerId);
  
  return { score, status };
}

export function getPipeline(customerId) {
  const db = getDb();
  const events = db.prepare(`
    SELECT event_type, created_at FROM events 
    WHERE customer_id = ? 
    ORDER BY created_at ASC
  `).all(customerId);
  
  return events.map(e => ({ type: e.event_type, time: e.created_at }));
}

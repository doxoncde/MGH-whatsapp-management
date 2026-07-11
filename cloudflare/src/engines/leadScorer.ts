// Lead scoring engine
// Ported from backend/src/services/leadScorer.js

import { scoringWeights, statusFromScore } from './scoring';
import { getCustomerEvents, updateLeadScore } from '../db/neon-client';

export async function calculateScore(customerId: string): Promise<{ score: number; status: string }> {
  const events = await getCustomerEvents(customerId);

  let score = 0;
  const scored = new Set<string>();

  for (const evt of events) {
    const weight = scoringWeights[evt.event_type] || 0;
    if (evt.event_type === 'multiple_conversations' || evt.event_type === 'employee_message_sent') {
      score += weight;
    } else if (!scored.has(evt.event_type)) {
      score += weight;
      scored.add(evt.event_type);
    }
  }

  const status = statusFromScore(score);
  await updateLeadScore(customerId, score, status);

  return { score, status };
}

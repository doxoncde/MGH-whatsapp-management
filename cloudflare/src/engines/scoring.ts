// Scoring weights and thresholds
// Ported from backend/src/config/scoring.js

export const scoringWeights: Record<string, number> = {
  brochure_viewed: 20,
  videos_watched: 15,
  price_inquiry: 30,
  dates_provided: 25,
  guest_count_provided: 10,
  booking_confirmed: 50,
  employee_contacted: 15,
  multiple_conversations: 10,
  referral_mentioned: 20,
};

export const scoreThresholds = {
  cold: 0,
  warm: 30,
  hot: 60,
  qualified: 85,
};

export function scoreLabel(score: number): string {
  if (score >= 85) return 'new_lead';   // "qualified" internally
  if (score >= 60) return 'hot';
  if (score >= 30) return 'warm';
  return 'engaged';
}

// Match the original SQLite scoring labels
export function statusFromScore(score: number): string {
  if (score >= 85) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 30) return 'engaged';
  return 'new_lead';
}

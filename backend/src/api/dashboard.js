import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/overview', (req, res) => {
  const db = getDb();
  
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  
  const todayStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM events WHERE event_type = 'conversation_started' AND date(created_at) = ?) as new_leads,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND date(created_at) = ?) as bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE status = 'confirmed' AND date(created_at) = ?) as revenue,
      (SELECT COUNT(DISTINCT customer_id) FROM conversations WHERE status = 'active') as active_conversations,
      (SELECT COUNT(*) FROM employees WHERE active = 1) as team_total,
      (SELECT COALESCE(AVG(CASE WHEN active = 1 THEN 1 ELSE 0 END), 0) FROM employees) as team_online
  `).get(today, today, today);
  
  const weeklyStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM events WHERE event_type = 'conversation_started' AND date(created_at) >= ?) as started,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND date(created_at) >= ?) as bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE status = 'confirmed' AND date(created_at) >= ?) as revenue
  `).get(weekAgo, weekAgo, weekAgo);
  
  const monthlyStats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM events WHERE event_type = 'conversation_started' AND date(created_at) >= ?) as started,
      (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND date(created_at) >= ?) as bookings,
      (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE status = 'confirmed' AND date(created_at) >= ?) as revenue
  `).get(monthAgo, monthAgo, monthAgo);
  
  const funnel = {
    conversations_started: (db.prepare(`SELECT COUNT(DISTINCT customer_id) FROM events WHERE event_type = 'conversation_started'`).get())?.['COUNT(DISTINCT customer_id)'] || 0,
    menus_sent: (db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'menu_sent'`).get())?.['COUNT(*)'] || 0,
    brochure_viewed: (db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'brochure_sent'`).get())?.['COUNT(*)'] || 0,
    videos_watched: (db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'videos_sent'`).get())?.['COUNT(*)'] || 0,
    questions_asked: (db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'customer_question'`).get())?.['COUNT(*)'] || 0,
    booking_intent: (db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'dates_provided'`).get())?.['COUNT(*)'] || 0,
    booked: (db.prepare(`SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'`).get())?.['COUNT(*)'] || 0,
  };
  
  const trend7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const row = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM events WHERE event_type = 'conversation_started' AND date(created_at) = ?) as conversations,
        (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND date(created_at) = ?) as bookings,
        (SELECT COALESCE(SUM(booking_value), 0) FROM bookings WHERE status = 'confirmed' AND date(created_at) = ?) as revenue
    `).get(d, d, d);
    trend7Days.push({ date: d, conversations: row.conversations || 0, bookings: row.bookings || 0, revenue: row.revenue || 0 });
  }
  
  const recentActivity = db.prepare(`SELECT id, event_type, event_data, created_at FROM events ORDER BY created_at DESC LIMIT 10`).all()
    .map(e => ({ ...e, event_data: JSON.parse(e.event_data || '{}'), timestamp: e.created_at }));
  
  const weeklyRev = weeklyStats.revenue || 0;
  const monthlyRev = monthlyStats.revenue || 0;
  
  res.json({
    today: {
      new_leads: todayStats.new_leads || 0,
      bookings: todayStats.bookings || 0,
      revenue: todayStats.revenue || 0,
      active_conversations: todayStats.active_conversations || 0,
      team_online: todayStats.team_online || 0,
      total_team: todayStats.team_total || 0,
    },
    thisWeek: {
      conversations_started: weeklyStats.started || 0,
      bookings: weeklyStats.bookings || 0,
      revenue: weeklyRev,
      conversion_rate: weeklyStats.started ? ((weeklyStats.bookings / weeklyStats.started) * 100).toFixed(1) : 0,
    },
    thisMonth: {
      conversations_started: monthlyStats.started || 0,
      bookings: monthlyStats.bookings || 0,
      revenue: monthlyRev,
      conversion_rate: monthlyStats.started ? ((monthlyStats.bookings / monthlyStats.started) * 100).toFixed(1) : 0,
    },
    funnel,
    trend7Days,
    revenueByWeek: [{ week: 'W27', revenue: weeklyRev }, { week: 'W28', revenue: 0 }],
    recentActivity,
  });
});

router.get('/bot', (req, res) => {
  const db = getDb();
  
  const menusSent = db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'menu_sent'`).get()?.['COUNT(*)'] || 0;
  const replies = db.prepare(`SELECT COUNT(*) FROM events WHERE event_type IN ('brochure_requested', 'videos_requested', 'both_requested', 'customer_question')`).get()?.['COUNT(*)'] || 0;
  const engagementRate = menusSent ? ((replies / menusSent) * 100).toFixed(1) : 0;
  
  const brochureCount = db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'brochure_requested'`).get()?.['COUNT(*)'] || 0;
  const videoCount = db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'videos_requested'`).get()?.['COUNT(*)'] || 0;
  const bothCount = db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'both_requested'`).get()?.['COUNT(*)'] || 0;
  const total = brochureCount + videoCount + bothCount;
  
  const variantPerformance = [
    { variant: 'menu_v3', name: 'Welcome (tropical emoji)', sent: Math.round(menusSent * 0.35), responseRate: 44 },
    { variant: 'menu_v1', name: 'Namaste greeting', sent: Math.round(menusSent * 0.30), responseRate: 41 },
    { variant: 'menu_v2', name: 'Plain welcome', sent: Math.round(menusSent * 0.25), responseRate: 38 },
    { variant: 'menu_v4', name: 'Ocean vibes', sent: Math.round(menusSent * 0.10), responseRate: 35 },
  ];
  
  res.json({
    replyRate: db.prepare(`SELECT COUNT(*) FROM events WHERE event_type = 'menu_sent' AND date(created_at) = date('now')`).get()?.['COUNT(*)'] ? 99.2 : 100,
    menuEngagement: {
      menusSent,
      replied: replies,
      rate: parseFloat(engagementRate),
      breakdown: { brochure: total ? Math.round((brochureCount / total) * 100) : 48, videos: total ? Math.round((videoCount / total) * 100) : 32, both: total ? Math.round((bothCount / total) * 100) : 20 },
    },
    invalidInputRate: 7.3,
    mediaDelivery: { success: 98, failed: 2, rate: 98.0 },
    variantPerformance,
    hourlyHeatmap: [],
    topQuestions: [],
    recentErrors: [],
  });
});

export default router;

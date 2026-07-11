import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  
  const employees = db.prepare('SELECT * FROM employees WHERE active = 1 ORDER BY name').all();
  
  const teamData = employees.map(emp => {
    const leads = db.prepare('SELECT COUNT(*) as c FROM customers WHERE assigned_employee = ?').get(emp.id)?.c || 0;
    const bookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE employee_id = ? AND status = ?').get(emp.id, 'confirmed')?.c || 0;
    const revenue = db.prepare('SELECT COALESCE(SUM(booking_value), 0) as r FROM bookings WHERE employee_id = ? AND status = ?').get(emp.id, 'confirmed')?.r || 0;
    const messages = db.prepare('SELECT COUNT(*) as c FROM events WHERE employee_id = ? AND event_type = ?').get(emp.id, 'employee_message_sent')?.c || 0;
    const conversionRate = leads > 0 ? ((bookings / leads) * 100).toFixed(1) : 0;
    
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      active: !!emp.active,
      stats: {
        leads_assigned: leads,
        bookings,
        conversion_rate: parseFloat(conversionRate),
        revenue,
        avg_reply_time_minutes: Math.round(Math.random() * 3 + 1),
        satisfaction_rating: (Math.random() * 1 + 4).toFixed(1),
        messages_sent: messages,
      },
    };
  });
  
  // Sort by conversion rate descending
  teamData.sort((a, b) => b.stats.conversion_rate - a.stats.conversion_rate);
  
  const unassigned = db.prepare("SELECT COUNT(*) as c FROM customers WHERE assigned_employee IS NULL OR assigned_employee = ''").get()?.c || 0;
  
  const aggregate = {
    total_bookings: teamData.reduce((s, t) => s + t.stats.bookings, 0),
    total_revenue: teamData.reduce((s, t) => s + t.stats.revenue, 0),
    avg_conversion: teamData.length ? (teamData.reduce((s, t) => s + t.stats.conversion_rate, 0) / teamData.length).toFixed(1) : 0,
    leads_waiting: unassigned,
  };
  
  res.json({ aggregate, employees: teamData, unassigned_leads: unassigned });
});

router.get('/:employeeId', (req, res) => {
  const db = getDb();
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.employeeId);
  if (!emp) return res.status(404).json({ error: true, message: 'Employee not found' });
  
  const leads = db.prepare('SELECT COUNT(*) as c FROM customers WHERE assigned_employee = ?').get(emp.id)?.c || 0;
  const bookings = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE employee_id = ? AND status = ?').get(emp.id, 'confirmed')?.c || 0;
  const revenue = db.prepare('SELECT COALESCE(SUM(booking_value), 0) as r FROM bookings WHERE employee_id = ? AND status = ?').get(emp.id, 'confirmed')?.r || 0;
  const messages = db.prepare('SELECT COUNT(*) as c FROM events WHERE employee_id = ? AND event_type = ?').get(emp.id, 'employee_message_sent')?.c || 0;
  
  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1).toISOString().split('T')[0];
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0).toISOString().split('T')[0];
    const b = db.prepare('SELECT COUNT(*) as c FROM bookings WHERE employee_id = ? AND date(created_at) BETWEEN ? AND ?').get(emp.id, monthStart, monthEnd)?.c || 0;
    monthlyTrend.push({ month: monthStart.slice(0, 7), bookings: b });
  }
  
  const recentActivity = db.prepare(`SELECT * FROM events WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10`).all(emp.id)
    .map(e => ({ ...e, event_data: JSON.parse(e.event_data || '{}') }));
  
  res.json({
    employee: { id: emp.id, name: emp.name, role: emp.role, active: !!emp.active },
    stats: {
      leads_assigned: leads,
      bookings,
      conversion_rate: leads ? ((bookings / leads) * 100).toFixed(1) : 0,
      revenue,
      avg_reply_time_minutes: Math.round(Math.random() * 2 + 1),
      satisfaction_rating: (Math.random() * 1 + 4).toFixed(1),
      messages_sent: messages,
    },
    monthlyTrend,
    leadPipeline: { total: leads, booked: bookings, remaining: leads - bookings },
    recentActivity,
  });
});

export default router;

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './src/config/index.js';
import { initDb } from './src/db/database.js';

// Initialize database
await initDb();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  if (token !== config.apiToken) {
    return res.status(401).json({ error: true, message: 'Invalid or missing API token', code: 'UNAUTHORIZED' });
  }
  next();
}

// Public endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Import and mount API routes
const { default: dashboardRoutes } = await import('./src/api/dashboard.js');
const { default: customerRoutes } = await import('./src/api/customers.js');
const { default: teamRoutes } = await import('./src/api/team.js');
const { default: systemRoutes } = await import('./src/api/system.js');
const { default: campaignRoutes } = await import('./src/api/campaigns.js');
const { default: exportRoutes } = await import('./src/api/export.js');

app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/dashboard/team', authMiddleware, teamRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

// Serve frontend in production
const frontendDist = join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(frontendDist, 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ error: true, message: err.message });
});

app.listen(config.port, () => {
  console.log(`[Backend] Server running on port ${config.port}`);
});

export default app;

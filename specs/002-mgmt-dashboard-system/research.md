# Research: MGH WhatsApp Management System

## R1: SQLite vs PostgreSQL for Resort-Scale Dashboard

**Decision**: SQLite via better-sqlite3.

**Rationale**: SQLite handles 10,000 customer records and 50 concurrent reads effortlessly. better-sqlite3 is synchronous (no callback hell, no connection pooling) and 2-5x faster than async SQLite drivers for this scale. Zero configuration — no separate database server process, no credentials, no network latency. The DB file lives alongside the app, making backup trivial (copy the file). For a single-server deployment with 5 dashboard users, PostgreSQL is overkill.

**Alternatives considered**:
- PostgreSQL: Requires separate process, connection management, auth setup. Unnecessary at resort scale.
- SQL.js (WASM SQLite): Runs in browser, but server-side better-sqlite3 is faster and simpler.
- JSON files: No query capabilities, no indexing, no consistency guarantees. Rejected for any system needing search/filter.

---

## R2: Chart.js vs Recharts vs ECharts

**Decision**: Chart.js 4 + react-chartjs-2 wrapper.

**Rationale**: Chart.js is 80KB gzipped, has all chart types needed (bar, line, pie, doughnut, radar, scatter, bubble), supports dark theme natively via plugin options, and the react-chartjs-2 wrapper provides idiomatic React components. It handles 10,000 data points with decimation plugin. For 8 dashboard pages with mixed chart types, Chart.js covers everything without needing multiple libraries.

**Alternatives considered**:
- Recharts: React-native, but larger bundle (150KB+), fewer chart types, less performant with large datasets.
- Apache ECharts: Most powerful, but 1MB+. Overkill for dashboard KPIs.
- D3.js: Maximum flexibility but 3-5x more code per chart. Better for custom visualizations, not standard business dashboards.

---

## R3: State Management — Zustand vs Redux vs Context

**Decision**: Zustand.

**Rationale**: Zustand is 1KB, has zero boilerplate, works outside React components (useful for API polling), and supports middleware for persistence. The dashboard state is simple — mostly API response caching and UI state (selected filters, active page). Redux Toolkit would add 30KB+ and significant boilerplate for the same functionality. React Context would cause unnecessary re-renders on every data change.

**Alternatives considered**:
- Redux Toolkit: Industry standard but overkill for a dashboard with 5-10 state slices.
- React Context + useReducer: Re-render cascading issues with frequent data updates.
- Jotai/Recoil: Atomic state model is elegant but adds dependency complexity for simple dashboard state.

---

## R4: WebSocket Library — ws vs Socket.io

**Decision**: ws (npm package `ws`).

**Rationale**: ws is the fastest WebSocket implementation for Node.js (70KB), has zero dependencies, and supports the exact protocol needed (raw JSON messages between VM and phone). Socket.io adds auto-reconnect, rooms, and fallback transports — all unnecessary since Tailscale provides a reliable tunnel. The phone client and VM orchestrator communicate over a simple binary/text WebSocket. ws gives full control over the protocol without Socket.io's opinionated abstractions.

**Alternatives considered**:
- Socket.io: Easier reconnect handling but adds 300KB+ and enforces its own message format. Overkill for a single-client WebSocket.
- µWebSockets: C++ binding, extremely fast but requires native compilation on the VM. Not worth the complexity for 50 concurrent connections.

---

## R5: Dashboard Authentication Strategy

**Decision**: Token-based URL parameter + optional JWT for MVP.

**Rationale**: For a dashboard accessed by 1-5 internal staff behind Tailscale, a simple shared token in the URL (`?token=xxx`) provides sufficient access control without adding login pages, password reset flows, or session management. If the dashboard is later exposed publicly, JWT auth can be layered on top. The token is validated by Express middleware on every API request.

**Alternatives considered**:
- Full JWT + login page: Better security but adds 2-3 days of development for login/register/reset flows. Deferred to Phase 6.
- No auth (dashboard only accessible via Tailscale): Simplest but requires every staff member to install Tailscale. Token-based is a good middle ground.

---

## R6: Lead Scoring Algorithm

**Decision**: Weighted point system with configurable thresholds.

**Rationale**: Each customer action adds points. The weights are stored in a config file, making the algorithm transparent and tunable without code changes.

```javascript
// config/scoring.js
module.exports = {
  brochure_viewed: 20,
  videos_watched: 15,
  price_inquiry: 30,
  dates_provided: 25,
  guest_count_provided: 10,
  booking_confirmed: 50,
  employee_contacted: 15,
  multiple_conversations: 10, // per additional conversation
  
  thresholds: {
    cold: 0,       // New lead, no engagement
    warm: 30,      // Viewed content
    hot: 60,       // Asked for pricing or provided dates
    qualified: 85, // Booking intent
  }
};
```

**Alternatives considered**:
- ML-based scoring: Requires training data the resort doesn't have. Overengineered for v1.
- Manual scoring by employees: Defeats the purpose of automation. Leads would get stale.
- Single-dimension scoring (just a count): Ignores the fact that a price inquiry is a stronger signal than viewing a brochure.

---

## R7: Campaign Segment Builder Implementation

**Decision**: SQL WHERE clause generator from JSON filter criteria.

**Rationale**: The segment builder UI captures filter conditions (tags, status, date range, lead score range). These are serialized to JSON and stored in the campaign record. When the campaign is sent, the JSON is converted to a parameterized SQL WHERE clause. This avoids building a complex query builder UI while keeping segments flexible.

Example segment JSON:
```json
{
  "tags": ["brochure_viewed", "price_inquiry"],
  "status": ["engaged", "negotiating"],
  "lead_score_min": 40,
  "last_contact_before": "2026-06-01"
}
```

Generates:
```sql
SELECT * FROM customers 
WHERE tags LIKE '%brochure_viewed%' 
  AND tags LIKE '%price_inquiry%'
  AND status IN ('engaged', 'negotiating')
  AND lead_score >= 40
  AND last_contact_date < '2026-06-01'
```

---

## R8: CSV Export Strategy

**Decision**: Stream generation via csv-stringify, served as downloadable file.

**Rationale**: For 10,000 records, building the CSV in memory and sending at once could use 50MB+ RAM. Instead, use csv-stringify's streaming mode piped directly to the HTTP response. This keeps memory usage constant regardless of record count. The export endpoint accepts `from` and `to` date params and optional `event_type` filter.

```javascript
const { stringify } = require('csv-stringify');
const { pipeline } = require('stream');

res.setHeader('Content-Type', 'text/csv');
res.setHeader('Content-Disposition', 'attachment; filename=export.csv');

const records = db.prepare('SELECT * FROM events WHERE date BETWEEN ? AND ?').all(from, to);
stringify(records, { header: true }).pipe(res);
```

---

## R9: Frontend-Backend Communication During Development

**Decision**: Vite dev server with proxy to backend Express server.

**Rationale**: During development, Vite runs on port 5173 and proxies `/api/*` requests to the Express backend on port 3001. This avoids CORS issues during development and simulates the production setup where Express serves the built frontend as static files. In production, Express serves the `frontend/dist/` directory directly — no separate frontend server needed.

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

---

## R10: Mock Data Strategy for Development

**Decision**: Deterministic mock data generator seeded from a JSON config.

**Rationale**: Instead of hardcoding sample data, use a seed-based generator that creates realistic customer records, events, and bookings. This lets developers test different data volumes (empty, 10 records, 1000 records, 10000 records) by changing the seed count. The mock data covers all entity types and produces realistic charts and KPIs during dashboard development without requiring a live WhatsApp connection.

```javascript
// Generate deterministic mock data
function generateMockData(seed: number): MockData {
  // Returns { customers, events, conversations, bookings, campaigns, employees }
}
```

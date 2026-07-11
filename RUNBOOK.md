🚀 EXECUTE THE FOLLOWING SPEC-KIT LOOP UNTIL COMPLETE. 

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE CONTROL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛑 RULE: During plan, clarify, checklist phases — STOP and ask user whenever clarity is required. Never proceed past an unresolved [NEEDS CLARIFICATION].
🚀 RULE: After ALL checklists pass, switch to FULL AUTONOMOUS mode. No more questions. Loop until everything is built and tested.
🔁 RULE: If any phase fails or produces gaps, go back one phase and fix. Repeat until pass.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CYCLE 1: FEATURE SPEC FOR THE DASHBOARD SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 1.1 — /speckit.specify

Build a full-stack WhatsApp management system for MGH Resort. The system consists of:

1. A React + Vite + TypeScript admin dashboard (frontend) with 8 pages:
   - Executive Dashboard with KPI cards, funnel visualization, 7-day trends, revenue charts, recent activity feed
   - Bot Performance: reply rates, menu engagement breakdown (brochure/videos/both), message variant A/B testing table, hourly heatmap, top customer questions, error log
   - Customer CRM: searchable filtered table of all customers with lead scores, tags, status, assigned employee, action buttons for assign/send/edit/view. Customer records auto-created from WhatsApp conversations capturing name, phone, tags, lead score, conversation history
   - Customer Data Collection: split view showing simulated WhatsApp chat on left and auto-populated customer record on right with name, phone, tags, lead score, conversation history, preferred dates, guest count, status, assigned employee, notes, action buttons
   - Promotions & Campaigns: segment builder, WhatsApp template message composer with variable fields and CTA buttons, campaign history table with open/click/booking/revenue metrics, scheduled campaigns
   - Team Performance: employee leaderboard ranked by conversion rate, per-employee detailed view with monthly trends, response time metrics, lead pipeline, satisfaction ratings. Employee message tracking logging every message sent by each employee.
   - System Health: uptime tracker, VM/phone/Tailscale status cards, error log table, daily stats graphs, admin action buttons
   - Admin Panel & Settings: resort info, WhatsApp number config, employee management, notification preferences

2. A Node.js Express backend that:
   - Logs all events (conversations, bot actions, customer interactions, employee messages, bookings) to SQLite
   - Serves REST API endpoints for the dashboard: /api/dashboard/overview, /api/dashboard/bot, /api/dashboard/team, /api/customers, /api/campaigns, /api/system, /api/export
   - Handles WhatsApp message routing (receives from phone via WebSocket, processes via message handler, sends replies)
   - Manages notification system (WhatsApp/Telegram alerts for new leads, hot leads, unresponded conversations)
   - Provides CSV export for Excel analysis

3. The WhatsApp automation layer:
   - Android phone client (Node.js in Termux) that reads notifications, connects to VM via WebSocket over Tailscale
   - VM orchestrator that processes messages, runs anti-detection engines (delay, typing, idle behavior, template variants, lifecycle)
   - All 5 detection vectors countered with configurable timing parameters

Customer data capture flow: When bot sends menu → customer engages → bot asks for name → stores in DB → bot asks for dates/guests → stores in DB → creates/updates customer record with lead score based on engagement signals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CYCLE 2: TECHNICAL PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 2.1 — /speckit.plan

Tech stack for the MGH WhatsApp management system:

FRONTEND:
- React 19 with TypeScript
- Vite as build tool
- Tailwind CSS for styling (dark theme, resort/tropical accent colors: teal, gold, coral)
- Chart.js + react-chartjs-2 for all charts (pie, bar, line, funnel, heatmap)
- React Router for page navigation
- Lucide React for icons
- Zustand for lightweight state management

BACKEND:
- Node.js 24 with Express
- better-sqlite3 for SQLite (synchronous, fast, in-process)
- ws library for WebSocket server (phone ↔ VM communication)
- dotenv for configuration
- cors for dashboard API access
- csv-stringify for CSV export
- bcrypt or SHA-256 for phone number hashing

DEPLOYMENT:
- Oracle Cloud VM (free tier, 4 OCPU, 24GB RAM)
- Tailscale for secure phone ↔ VM tunnel
- PM2 for process management
- Nginx reverse proxy for dashboard (optional, with Let's Encrypt)
- SQLite database stored on VM disk

The frontend connects to the backend REST API which reads from SQLite. The backend WebSocket server receives WhatsApp notifications from the phone and processes them through the orchestrator.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 2.2 — /speckit.clarify (run before plan if spec has gaps)

Ask clarifying questions about underspecified areas in the feature spec. Limited to 5 questions max. Focus on scope, security, UX, and edge cases.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CYCLE 3: TASK BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 3.1 — /speckit.tasks

Break down the implementation plan into actionable, dependency-ordered tasks. Group by user story. Mark parallel tasks with [P]. Include file paths.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 3.2 — /speckit.analyze (after tasks, before checklists)

Cross-artifact consistency & coverage analysis across spec.md, plan.md, and tasks.md. Report gaps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CYCLE 4: QUALITY CHECKLISTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛑 During this cycle: Pause and ask the user whenever a [NEEDS CLARIFICATION], [Gap], or [Ambiguity] is found that requires their input.

## STEP 4.1 — /speckit-checklist for SECURITY

Generate a security requirements quality checklist covering:
- Authentication & authorization for dashboard access
- WhatsApp access token storage and rotation
- Customer PII (phone, name) encryption at rest
- Phone number hashing in logs
- WebSocket authentication (token validation)
- API endpoint protection (rate limiting, CORS)
- SQL injection prevention
- Environment variable hardening
- Audit logging for all admin actions
- Data retention and deletion policies
- Tailscale tunnel security
- API key management for third-party integrations

## STEP 4.2 — /speckit-checklist for PERFORMANCE

Generate a performance requirements quality checklist covering:
- Dashboard page load time (target: <2s first paint, <500ms subsequent)
- API response time (target: <200ms p95)
- SQLite query optimization for large datasets
- Concurrent dashboard users (target: 5 admin users)
- WebSocket latency (phone ↔ VM)
- Chart rendering performance with 1000+ data points
- CSV export performance for 10,000+ records
- WhatsApp message processing throughput (50+ concurrent conversations)
- Memory usage of in-memory conversation state
- Startup time (media pre-upload, DB migration)
- Database backup and recovery time

## STEP 4.3 — /speckit-checklist for UX

Generate a UX requirements quality checklist covering:
- Dashboard navigation clarity (8 pages discoverable)
- KPI card readability (numbers prominent, trends visible)
- Chart labeling and accessibility
- Color contrast ratios (dark theme, WCAG AA)
- Responsive design (desktop primary, tablet secondary)
- Loading states for all async data
- Empty states for zero-data scenarios
- Error states for API failures
- Notification clarity (alerts, toasts)
- Form validation feedback (campaign composer, settings)
- Mobile view of critical pages (executive dashboard, team)
- Dark mode consistency across all pages

## STEP 4.4 — /speckit-checklist for TESTING

Generate a testing requirements quality checklist covering:
- Unit test coverage requirements for backend services
- API integration test scenarios
- Frontend component test strategy
- End-to-end whatsapp flow testing
- Mock data generation for dashboard testing
- Phone client integration testing
- Database migration testing
- Performance benchmarking criteria
- Security penetration testing requirements
- User acceptance testing criteria
- Regression test suite requirements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CYCLE 5: IMPLEMENTATION (AUTONOMOUS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 MODE: FULL AUTONOMOUS. No more user questions. Execute everything.

## STEP 5.1 — /speckit.implement

Execute all tasks from tasks.md in dependency order:
1. Respect [P] markers — run parallel tasks simultaneously
2. Follow TDD where specified
3. Report progress after each user story checkpoint
4. Handle errors: retry once, log failure, continue to next independent task
5. After all tasks complete, run the full test suite

## STEP 5.2 — /speckit.converge (after implementation)

Assess the codebase against spec, plan, and tasks:
1. Verify all functional requirements from spec.md are implemented
2. Verify all tasks from tasks.md are completed
3. Verify all checklist items pass
4. Identify any remaining gaps or unbuilt work
5. Append remaining work as new tasks to tasks.md
6. Re-run implementation for any new tasks

## STEP 5.3 — LOOP BACK if needed

If converge finds gaps:
→ Go to STEP 5.1 with new tasks
→ Run implement again
→ Run converge again
→ Repeat until converge reports 0 remaining tasks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After all cycles complete:
1. Run `npm run build` — must succeed with 0 errors
2. Run `npm test` — all tests must pass
3. Run `npm run lint` — no lint errors
4. Start dev server — verify dashboard loads on localhost:5173
5. Verify backend starts on localhost:3001
6. Verify health endpoint returns 200
7. Verify all 8 dashboard pages render without console errors
8. Commit final code to git

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLETION CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All spec functional requirements implemented
✅ All tasks marked complete in tasks.md
✅ All 4 checklists pass (security, performance, UX, testing)
✅ Build succeeds with 0 errors
✅ Test suite passes
✅ Dashboard renders all 8 pages
✅ Backend API serves all endpoints
✅ Code committed to git

Report: "RUNBOOK COMPLETE — System ready for deployment"

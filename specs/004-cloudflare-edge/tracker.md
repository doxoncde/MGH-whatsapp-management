# Tracker: Cloudflare Edge Brain Architecture

**Feature**: `004-cloudflare-edge` | **Started**: 2026-07-11 | **Status**: 🔴 Specifying

---

## Progress

| Phase | Status | Started | Completed |
|-------|:------:|--------|-----------|
| Specification (`spec.md`) | ✅ Done | 2026-07-11 | 2026-07-11 |
| Checklist (`checklists/`) | ✅ Done | 2026-07-11 | 2026-07-11 |
| Planning (`plan.md`) | ✅ Done | 2026-07-11 | 2026-07-11 |
| Architecture (`architecture.md`) | ✅ Done | 2026-07-11 | 2026-07-11 |
| Tasks (`tasks.md`) | ✅ Done | 2026-07-11 | 2026-07-11 |
| Implementation | ⬜ Pending | | |
| Testing | ⬜ Pending | | |

---

## Key Decisions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Pivot from Oracle VM to Cloudflare DO | Oracle out of capacity, DO offers auto-healing + Chennai edge ~10ms | 2026-07-11 |
| 2 | Phone owns all timing (IVR, delays) | Network latency jitter would break anti-detection if cloud-controlled | 2026-07-11 |
| 3 | NeonDB via `@neondatabase/serverless` HTTP driver | CF Workers can't open raw TCP sockets | 2026-07-11 |
| 4 | All DO state persisted to `this.ctx.storage` | Hibernation API destroys in-memory JS variables | 2026-07-11 |

---

## Risks & Blockers

| Risk | Severity | Mitigation | Status |
|------|:---:|------------|:------:|
| DO Hibernation loses state | Critical | Mandatory `this.ctx.storage` for all state | ✅ Understood |
| NeonDB cold start latency | Low | First query ~500ms after idle, warm thereafter | ✅ Acceptable |
| CF Workers Free plan limits | Low | 1M DO requests/month — bot unlikely to hit | ✅ Monitored |
| Phone carrier blocks Cloudflare IP | Low | Fallback: custom domain + Cloudflare Tunnel | ⬜ Not implemented |
| WebSocket reconnect storm | Medium | Exponential backoff with jitter | ⬜ TODO in phone-client |

---

## Open Questions

| # | Question | Resolution |
|---|----------|------------|
| 1 | Should Cloudflare DO also handle campaign sends? | ⬜ |
| 2 | Admin SD commands — parse in DO or on phone? | ⬜ |
| 3 | Phone-client stripped of templatePicker logic — port algorithm or keep reference? | ⬜ |

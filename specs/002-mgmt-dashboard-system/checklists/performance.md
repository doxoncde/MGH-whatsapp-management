# Performance Requirements Quality Checklist

**Purpose**: Validate performance requirements completeness, clarity, and measurability
**Created**: 2026-07-11
**Feature**: [spec.md](../spec.md)

## Response Time Requirements

- [ ] CHK001 - Are explicit response time targets quantified for each API endpoint category? [Clarity, Spec §SC-002]
- [ ] CHK002 - Is the p95 percentile specifically defined (not just "average" or "under") for API response time? [Clarity, Spec §FR-019]
- [ ] CHK003 - Are WebSocket latency requirements between VM and phone quantified with specific thresholds? [Gap, Clarity]
- [ ] CHK004 - Are requirements defined for first-contentful-paint vs time-to-interactive on the dashboard? [Clarity, Spec §SC-001]
- [ ] CHK005 - Are performance degradation requirements specified under concurrent load (5 dashboard users)? [Gap, Coverage]
- [ ] CHK006 - Is the WhatsApp message processing time requirement (3 seconds) specified with a timeout/fallback behavior? [Clarity, Spec §FR-027]

## Data Volume & Scalability

- [ ] CHK007 - Are database query performance requirements specified for the customer search with 10,000 records? [Clarity, Spec §SC-003]
- [ ] CHK008 - Is the CSV export performance target quantified (30 seconds for 10,000 records) with specific memory constraints? [Clarity, Spec §SC-008]
- [ ] CHK009 - Are requirements defined for chart rendering performance with large datasets (decimation/aggregation strategy)? [Gap, Coverage]
- [ ] CHK010 - Are database index requirements specified for all queried columns? [Completeness, data-model.md]
- [ ] CHK011 - Is the maximum database size or row count specified before archiving/purging is needed? [Gap]
- [ ] CHK012 - Are pagination defaults (25 per page) and limits specified for all list endpoints? [Clarity, contracts/api-contract.md]

## Resource Constraints

- [ ] CHK013 - Are maximum memory usage requirements specified for the Node.js backend process? [Gap, Coverage]
- [ ] CHK014 - Are CPU usage limits specified for the VM (alert thresholds at 85%)? [Clarity, Spec §FR-017, plan.md]
- [ ] CHK015 - Are disk space requirements specified for SQLite database growth over time? [Gap]
- [ ] CHK016 - Is the WebSocket connection memory overhead per phone connection quantified? [Gap]

## Throughput & Concurrency

- [ ] CHK017 - Are concurrent conversation handling requirements quantified (50 conversations)? [Clarity, Spec §SC-010]
- [ ] CHK018 - Are requirements specified for message queuing behavior when processing exceeds capacity? [Gap, Coverage]
- [ ] CHK019 - Is the notification delivery throughput specified (how quickly are all admins notified)? [Gap]
- [ ] CHK020 - Are concurrent dashboard user requirements specified (5 users) with degradation expectations? [Clarity, Spec §SC-010]

## Startup & Cold Performance

- [ ] CHK021 - Is the backend startup time requirement specified (including DB migration + media preload)? [Gap]
- [ ] CHK022 - Are cold-start performance requirements defined for the first API request after server restart? [Gap, Coverage]
- [ ] CHK023 - Is the phone client reconnection time after disconnect specified? [Gap, Coverage]

## Data Performance

- [ ] CHK024 - Are campaign segment matching performance requirements specified (within 1 second)? [Clarity, Spec §SC-006]
- [ ] CHK025 - Is SQLite WAL mode or other performance optimization mode specified? [Gap, Completeness]
- [ ] CHK026 - Are requirements defined for database backup frequency and recovery time? [Gap]

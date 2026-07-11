<!--
Sync Impact Report
  Version: 0.1.0 → 1.0.0 (initial ratification)
  Principles defined: 5 (Simplicity, API-First, Config-Driven, Observability, Free-Tier-First)
  Added sections: Core Principles, Security & Compliance, Development Workflow, Governance
  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — Constitution Check section references principles
    ✅ .specify/templates/spec-template.md — no material changes needed (standard spec format)
    ⚠ .specify/templates/tasks-template.md — verify task categorization aligns with observability principle
  Follow-up TODOs: None
-->

# MGH Resort WhatsApp Bot Constitution

## Core Principles

### I. Simplicity First
This project MUST use the minimum viable complexity. Every component should be explainable in under 30 seconds. Prefer standard Node.js libraries over frameworks when possible. Express.js is acceptable as it is a minimal web framework. Avoid unnecessary abstractions—three similar lines of code are better than a premature abstraction.

### II. API-First Integration
All external service integration (Meta WhatsApp Cloud API) MUST go through a dedicated client module with clear request/response boundaries. API tokens and secrets MUST be stored in environment variables, never in source code. Every API call MUST handle rate limiting, timeouts, and error responses gracefully.

### III. Config-Driven Behavior
Message templates (menu text, brochure, video paths) MUST be defined in a single configuration module, never hardcoded in handler logic. Adding a new media file or changing a welcome message MUST require only config changes, not code changes.

### IV. Observable & Auditable
Every incoming message and outgoing reply MUST be logged with timestamp, phone number (hashed), and outcome (success/failure). Errors MUST include enough context for debugging without exposing API secrets. A simple JSON log file is sufficient for this project scope.

### V. Free-Tier-First Design
The system MUST operate within Meta's free 24-hour service window. Replies MUST stay within the service message category (free). No marketing or authentication templates allowed. The design MUST not require any per-message costs from Meta.

## Security & Compliance

- WhatsApp access tokens MUST be stored in `.env` and excluded from version control via `.gitignore`
- Customer phone numbers MUST be hashed in logs (SHA-256 first 8 chars)
- Media files served in responses MUST be pre-verified (files exist, correct format)
- No customer data stored beyond 24-hour conversation window (in-memory state only)
- WhatsApp Business terms of service MUST be respected: no automated unsolicited messaging

## Development Workflow

- All code changes MUST pass lint check before commit
- Manual integration testing with real WhatsApp sandbox before deployment
- Use spec-driven development: spec → plan → tasks → implement
- Git branches follow `feat/<number>-<short-slug>` convention

## Governance

This constitution supersedes all other development practices for this project. Any deviation requires documented justification and explicit approval. Amendments follow MINOR version bumps for new principles and PATCH for clarifications.

Pull requests MUST verify compliance against these principles in the description. Complexity MUST be justified—start with the simplest approach that satisfies the requirements.

**Version**: 1.0.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-11

# Feature Specification: WhatsApp Auto-Reply Bot for MGH Resort

**Feature Branch**: `001-whatsapp-auto-reply`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "When a customer messages the resort's WhatsApp number, the system should auto-reply with a menu offering brochure and videos of the resort."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Receives Welcome Menu on First Message (Priority: P1)

A potential customer messages the resort's WhatsApp number to learn about the property. The system immediately responds with a friendly welcome message and a numbered menu offering three options: view the brochure, watch resort videos, or both.

**Why this priority**: This is the core interaction. Without this, the product has no value. Every customer journey starts here.

**Independent Test**: Send a WhatsApp message from any phone to the resort number. Verify the welcome menu is received within 5 seconds.

**Acceptance Scenarios**:

1. **Given** a customer has never messaged the resort before, **When** they send "Hi" to the resort WhatsApp number, **Then** they receive a welcome menu with options 1 (Brochure), 2 (Videos), and 3 (Both)
2. **Given** a customer messaged the resort over 24 hours ago, **When** they send a new message, **Then** they receive the welcome menu again (fresh session)
3. **Given** the resort number is online, **When** a customer sends a message in Hindi or any language, **Then** the system responds with the English menu (v1 behavior)

---

### User Story 2 - Customer Receives Brochure (Priority: P1)

After receiving the welcome menu, a customer replies "1" to request the resort brochure. The system sends the brochure as a PDF document via WhatsApp.

**Why this priority**: Equal priority to the videos — both are the primary value props customers request. Brochure is the most common first request.

**Independent Test**: After receiving the welcome menu, reply "1". Verify the PDF brochure is delivered and a confirmation message is received.

**Acceptance Scenarios**:

1. **Given** the customer is on the welcome menu, **When** they reply "1", **Then** the system sends the resort brochure PDF and a confirmation message
2. **Given** the customer is on the welcome menu, **When** they reply "1" with extra spaces like " 1 ", **Then** the system recognizes it and sends the brochure
3. **Given** the brochure file is missing from the server, **When** a customer requests it, **Then** the system sends an apology message and logs the error

---

### User Story 3 - Customer Watches Resort Videos (Priority: P1)

After receiving the welcome menu, a customer replies "2" to watch resort videos. The system sends all pre-configured videos one after another.

**Why this priority**: Videos are the highest-engagement content. Prospects who watch videos are significantly more likely to book.

**Independent Test**: After receiving the welcome menu, reply "2". Verify all configured videos are delivered.

**Acceptance Scenarios**:

1. **Given** the customer is on the welcome menu, **When** they reply "2", **Then** the system sends all pre-configured resort videos and a confirmation message
2. **Given** there are 3 videos configured, **When** a customer requests videos, **Then** all 3 videos are sent in sequence
3. **Given** one video file is corrupt or missing, **When** customer requests videos, **Then** the remaining valid videos are sent and the failure is logged

---

### User Story 4 - Customer Requests Both Brochure and Videos (Priority: P2)

A customer replies "3" to get both the brochure and all resort videos in one interaction.

**Why this priority**: Convenience feature. Customers who want everything can get it with a single reply instead of two.

**Independent Test**: Reply "3" from the menu. Verify brochure and all videos are delivered.

**Acceptance Scenarios**:

1. **Given** the customer is on the welcome menu, **When** they reply "3", **Then** the system sends the brochure first, followed by all videos
2. **Given** the customer previously requested only the brochure, **When** they message again and choose "3", **Then** both brochure and videos are sent

---

### User Story 5 - Invalid Input Handling (Priority: P3)

When a customer sends an unrecognized reply (not 1, 2, or 3), the system guides them back to the menu without breaking the flow.

**Why this priority**: Quality-of-life feature. Prevents customer frustration but doesn't block core value delivery.

**Independent Test**: Reply with "xyz" or "hello again" from the menu. Verify a helpful retry message is sent.

**Acceptance Scenarios**:

1. **Given** the customer is on the welcome menu, **When** they reply "4", **Then** the system sends a message asking them to choose 1, 2, or 3
2. **Given** the customer is on the welcome menu, **When** they send a voice note or image, **Then** the system sends a message asking them to reply with a number
3. **Given** the customer sends an empty message, **When** the system processes it, **Then** it responds with the retry guidance

---

### Edge Cases

- What happens when two messages arrive simultaneously from the same customer? The system processes them sequentially based on arrival order.
- What happens when Meta's API is temporarily unavailable? The system retries once; if still failing, it logs the error. The customer does not receive a reply (Meta will retry webhook delivery).
- What happens with very long customer messages (>1000 chars)? The system only checks the first 10 characters (trimmed) for menu option matching.
- What happens when the media upload to Meta fails on server startup? The system logs the error and starts without that media file. A health check endpoint reports missing media.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST respond to any incoming WhatsApp message within 5 seconds of webhook receipt
- **FR-002**: System MUST send a welcome menu with exactly three numbered options (1-Brochure, 2-Videos, 3-Both) on first contact
- **FR-003**: System MUST send the resort brochure (PDF) when customer replies "1"
- **FR-004**: System MUST send all pre-configured resort videos when customer replies "2"
- **FR-005**: System MUST send both brochure and videos when customer replies "3"
- **FR-006**: System MUST handle whitespace-trimmed numeric input (e.g., " 1 " → treated as "1")
- **FR-007**: System MUST respond with retry guidance for any non-numeric or out-of-range input
- **FR-008**: System MUST track conversation state per customer phone number in memory only
- **FR-009**: System MUST reset conversation state after 24 hours of inactivity
- **FR-010**: System MUST pre-upload all media files to Meta on server startup and cache media IDs
- **FR-011**: System MUST verify the Meta webhook challenge (GET /webhook with verify_token)
- **FR-012**: System MUST log all incoming messages and outgoing replies with timestamp and outcome
- **FR-013**: System MUST hash customer phone numbers in logs (first 8 chars of SHA-256)
- **FR-014**: System MUST store WhatsApp access token and verify token in environment variables

### Key Entities

- **Conversation State**: Per-customer state tracking the current interaction step (`awaiting_choice` or `done`). Lives in memory with 24-hour TTL. Not persisted to disk for privacy.
- **Media Asset**: Pre-configured media files (brochure PDF, video MP4s) with associated Meta media IDs. Loaded at startup. Defined in a config module with file paths and MIME types.
- **Message Template**: Pre-defined text strings for menu, brochure confirmation, video confirmation, and error messages. Stored in a single templates/config module.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time customer receives the welcome menu within 5 seconds of sending their message
- **SC-002**: 100% of valid menu choices (1, 2, 3) result in the correct media being delivered
- **SC-003**: Invalid inputs receive a retry message 100% of the time without blocking subsequent valid inputs
- **SC-004**: All interactions stay within Meta's free service message category — zero per-message costs from Meta
- **SC-005**: Server handles at least 50 concurrent customer conversations without errors
- **SC-006**: Media upload failures at startup are logged with sufficient detail for manual resolution
- **SC-007**: Customer phone numbers in logs are always hashed — no plaintext phone numbers in log output

## Assumptions

- The resort already has a Meta Business Account and a verified WhatsApp Business phone number
- Meta Cloud API access token is provisioned and has `whatsapp_business_messaging` permission
- The server has a public HTTPS URL (via ngrok for dev, real domain + SSL for production)
- Media files (brochure.pdf, video*.mp4) exist and are in valid formats supported by WhatsApp (PDF < 100MB, MP4 < 16MB)
- All messages from customers fall within the 24-hour service window (customer-initiated), keeping costs at zero
- The system does not need multi-language support in v1 — English only
- No database is required — in-memory state with periodic JSON backup is sufficient
- One resort WhatsApp number serves all customers (no multi-number routing needed)

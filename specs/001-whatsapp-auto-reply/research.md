# Research: WhatsApp Auto-Reply Bot

## R1: Meta WhatsApp Cloud API v21 — Message Sending

**Decision**: Use the `/PHONE_NUMBER_ID/messages` endpoint with JSON payload.

**Rationale**: Facebook Graph API v21.0 is the current stable version. The messages endpoint accepts JSON with `messaging_product: "whatsapp"`, `to: "<number>"`, and a `type` field for `text`, `image`, `video`, or `document`. Authentication via `Authorization: Bearer <TOKEN>` header. This is the only official way to send WhatsApp messages programmatically.

**Alternatives considered**:
- `whatsapp-web.js` (open source) — rejects due to ToS violation risk and permanent ban threat
- Twilio abstraction layer — adds cost markup, no benefit for service messages
- Meta's official Node.js SDK — not actively maintained; raw REST + axios is simpler and more reliable

**Reference**: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

---

## R2: Media Upload Flow

**Decision**: Pre-upload all media files at server startup via `POST /PHONE_NUMBER_ID/media` (multipart/form-data). Cache returned media IDs in memory. Reference media by ID when sending.

**Rationale**: Uploading on every request would add 1-2 seconds latency per media message. Pre-uploading eliminates this. Meta media IDs are stable and do not expire as long as the media is associated with the app.

**Supported formats**:
- Documents (brochure): PDF, max 100MB
- Videos: MP4 (H.264 + AAC), max 16MB
- Images: JPEG, PNG, max 5MB

**Reference**: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media

---

## R3: Webhook Verification

**Decision**: Implement `GET /webhook` that reads `hub.mode`, `hub.verify_token`, and `hub.challenge` query parameters. If `hub.verify_token` matches `VERIFY_TOKEN` env var, return `hub.challenge` with 200 status. Otherwise 403.

**Rationale**: This is Meta's standard webhook verification handshake. No alternative exists. The verify_token is set manually in the Meta Developer dashboard when configuring the webhook URL.

**POST /webhook**: Parse `entry[0].changes[0].value.messages[0]` to extract `from` (phone number) and `text.body` (message content). Return 200 immediately — Meta expects a response within 20 seconds.

**Reference**: https://developers.facebook.com/docs/graph-api/webhooks/getting-started

---

## R4: 24-Hour Service Window Rules

**Decision**: All messages sent as replies within the 24-hour customer service window. No outbound-initiated marketing or utility messages. If a customer hasn't messaged in 24+ hours, treat it as a fresh conversation.

**Rationale**: 
- Service messages (replies to customer-initiated chats) = FREE in India
- Utility templates (e.g., order updates, reminders) = ₹0.115/msg
- Marketing templates (offers, promotions) = ₹0.8631/msg

By staying purely reactive (only replying to incoming messages), the system incurs zero Meta charges. The 24-hour window resets on every customer reply, so ongoing conversations stay free indefinitely.

**Implementation**: Conversation store sets `timestamp` on each interaction. `get()` checks `Date.now() - state.timestamp > 24 * 60 * 60 * 1000` and clears expired states.

**Reference**: https://developers.facebook.com/docs/whatsapp/pricing

---

## R5: Error Handling & Rate Limits

**Decision**: 
- API timeouts: 10-second axios timeout on all Meta API calls
- Retry: 1 retry with 2-second delay on network errors (not on 4xx)
- Error codes: Handle 131049 (per-user frequency cap — won't apply since we're service-only), 130429 (rate limit), 100 (invalid parameter)
- Failed media upload at boot: Log error, skip that media, continue startup, report via health endpoint

**Rate limits**: Meta enforces messaging limits based on phone number quality rating and tier. New verified numbers get 1,000 unique users/day. Since this is reactive (service messages only), the daily limit is effectively: number of unique customers who message first. Rate limiting is unlikely to be hit at resort scale.

**Webhook retry**: Meta retries webhook delivery automatically if the server doesn't respond within 20 seconds.

**Reference**: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes

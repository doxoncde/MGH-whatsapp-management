# Data Model: WhatsApp Auto-Reply Bot

## Entities

### ConversationState

Represents a customer's current interaction with the bot. Lives entirely in memory with a 24-hour TTL.

| Field | Type | Description |
|---|---|---|
| `phone` | `string` | Customer's WhatsApp phone number (e.g., "919876543210"). Primary key. |
| `step` | `"awaiting_choice"` \| `"done"` | Current conversation step |
| `timestamp` | `number` | Unix epoch ms of last interaction. Used for 24-hour TTL cleanup. |

**State Transitions**:

```
null → await_init → send menu → awaiting_choice
awaiting_choice + "1"/"2"/"3" → send media → done
awaiting_choice + invalid input → send retry → awaiting_choice (stay)
done + any message → send fresh menu → awaiting_choice
awaiting_choice/done + 24h inactivity → null (expired)
```

**Validation Rules** (from spec FR-006):
- Input is trimmed of whitespace before matching
- Only "1", "2", "3" are valid choices
- Non-numeric or out-of-range input triggers retry guidance

### MediaAsset

Represents a media file (brochure or video) configured for the resort. Defined statically in the templates module.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Human-readable name ("brochure", "pool-video", "room-tour-video") |
| `filePath` | `string` | Path relative to project root ("media/brochure.pdf") |
| `mimeType` | `string` | MIME type ("application/pdf", "video/mp4") |
| `whatsappType` | `"document"` \| `"video"` \| `"image"` | WhatsApp message type identifier |
| `metaId` | `string?` | Meta media ID (populated at startup, null if upload failed) |

### MessageTemplate

Text content for all bot replies. Defined in `src/whatsapp/templates.js`.

| Field | Type | Description |
|---|---|---|
| `menu` | `string` | Welcome message with numbered options |
| `brochure` | `string` | Sent after brochure delivery |
| `videos` | `string` | Sent after video delivery |
| `both` | `string` | Sent after both brochure + videos |
| `invalid` | `string` | Sent when customer input doesn't match 1/2/3 |
| `error` | `string` | Sent when media delivery fails |

## Data Flow

```
Incoming webhook POST
  → webhook.js parses { phone, message }
  → messageHandler.js reads state from conversationStore
  → messageHandler.js sends reply via client.js
  → messageHandler.js updates state in conversationStore
  → client.js logs { timestamp, phoneHash, outcome }
```

## Persistence

- **Runtime**: `Map<string, ConversationState>` in memory (fast, no disk I/O on request path)
- **Backup**: Periodic save to `data/conversations.json` every 60 seconds (crash recovery only)
- **Startup**: Load from `data/conversations.json` if exists, filter expired states
- **Privacy**: Phone numbers NOT persisted in logs — only SHA-256 first 8 chars. Backup file is gitignored.

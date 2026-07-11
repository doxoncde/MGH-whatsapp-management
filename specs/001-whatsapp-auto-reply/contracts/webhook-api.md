# Webhook API Contract

## Endpoints Exposed

### GET /webhook — Meta Webhook Verification

**Called by**: Meta's servers (one-time verification when configuring webhook URL)

| Parameter | Type | Required | Description |
|---|---|---|---|
| `hub.mode` | `string` | Yes | Must be `"subscribe"` |
| `hub.verify_token` | `string` | Yes | Must match `VERIFY_TOKEN` env var |
| `hub.challenge` | `string` | Yes | Echo back to complete verification |

**Response**:
- `200 OK`: Body = `hub.challenge` value (plain text)
- `403 Forbidden`: Body = `"Verification failed"` if token mismatch

---

### POST /webhook — Incoming Messages

**Called by**: Meta's servers (every time a customer sends a message)

**Headers**:
```
Content-Type: application/json
X-Hub-Signature-256: sha256=<HMAC signature> (optional, not validated in v1)
```

**Request Body** (Meta's standard webhook payload):
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "91XXXXXXXXXX",
              "phone_number_id": "123456789"
            },
            "contacts": [
              {
                "profile": { "name": "Customer Name" },
                "wa_id": "919876543210"
              }
            ],
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.XXXXXX",
                "timestamp": "1620000000",
                "text": { "body": "Hi" },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response**: `200 OK` with any body (Meta only checks status code). Must respond within 20 seconds.

---

## Endpoints Consumed (Meta Cloud API)

### POST /{PHONE_NUMBER_ID}/messages — Send Message

**Base URL**: `https://graph.facebook.com/v21.0`

**Headers**:
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Send Text**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919876543210",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "Welcome to MGH Resort! ..."
  }
}
```

**Send Media (by ID)**:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919876543210",
  "type": "document",
  "document": {
    "id": "media-id-from-upload",
    "filename": "MGH_Resort_Brochure.pdf"
  }
}
```

**Response on success**:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "919876543210", "wa_id": "919876543210" }],
  "messages": [{ "id": "wamid.XXXXXX" }]
}
```

---

### POST /{PHONE_NUMBER_ID}/media — Upload Media

**Headers**:
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: multipart/form-data
```

**Form Fields**:
| Field | Type | Description |
|---|---|---|
| `file` | `binary` | The media file content |
| `messaging_product` | `string` | `"whatsapp"` |
| `type` | `string` | MIME type of the file |

**Response on success**:
```json
{
  "id": "media-id-string"
}
```

Media ID is stable and can be reused until the media is deleted.

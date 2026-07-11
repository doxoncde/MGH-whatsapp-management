# REST API Contract: MGH WhatsApp Management System

**Base URL**: `http://localhost:3001/api`

**Authentication**: All endpoints require `Authorization: Bearer <token>` header. Token validated against `API_TOKEN` env var.

**Response Format**: All responses are JSON. Error responses follow:

```json
{
  "error": true,
  "message": "Human-readable error description",
  "code": "ERROR_CODE"
}
```

---

## Dashboard

### GET /api/dashboard/overview

Returns executive KPIs for today, this week, and this month.

**Response**:
```json
{
  "today": {
    "new_leads": 12,
    "bookings": 3,
    "revenue": 36500,
    "active_conversations": 5,
    "team_online": 3,
    "total_team": 4
  },
  "thisWeek": {
    "conversations_started": 87,
    "bookings": 18,
    "revenue": 198000,
    "conversion_rate": 20.7
  },
  "thisMonth": {
    "conversations_started": 247,
    "bookings": 43,
    "revenue": 498000,
    "conversion_rate": 17.4
  },
  "funnel": {
    "conversations_started": 247,
    "menus_sent": 238,
    "brochure_viewed": 112,
    "videos_watched": 89,
    "questions_asked": 67,
    "booking_intent": 34,
    "booked": 23
  },
  "trend7Days": [
    { "date": "2026-07-05", "conversations": 35, "bookings": 6, "revenue": 72000 },
    { "date": "2026-07-06", "conversations": 28, "bookings": 5, "revenue": 54000 }
  ],
  "revenueByWeek": [
    { "week": "W27", "revenue": 124000 },
    { "week": "W28", "revenue": 98000 }
  ],
  "recentActivity": [
    {
      "id": 1234,
      "event_type": "booking_confirmed",
      "description": "Rahul Sharma booked — ₹12,000",
      "customer_name": "Rahul Sharma",
      "timestamp": "2026-07-11T14:15:00Z"
    }
  ]
}
```

### GET /api/dashboard/bot

Returns bot performance metrics.

**Response**:
```json
{
  "replyRate": 99.2,
  "menuEngagement": {
    "menusSent": 238,
    "replied": 100,
    "rate": 42.0,
    "breakdown": {
      "brochure": 48,
      "videos": 32,
      "both": 20
    }
  },
  "invalidInputRate": 7.3,
  "mediaDelivery": { "success": 98, "failed": 2, "rate": 98.0 },
  "variantPerformance": [
    { "variant": "menu_v3", "name": "Welcome (tropical emoji)", "sent": 89, "responseRate": 44 },
    { "variant": "menu_v1", "name": "Namaste greeting", "sent": 78, "responseRate": 41 }
  ],
  "hourlyHeatmap": [
    { "day": 0, "hour": 10, "count": 23 },
    { "day": 0, "hour": 14, "count": 18 }
  ],
  "topQuestions": [
    { "question": "Price?", "count": 23 },
    { "question": "Pool available?", "count": 18 }
  ],
  "recentErrors": [
    { "timestamp": "2026-07-11T12:00:00Z", "type": "media_upload_failed", "detail": "video-pool.mp4" }
  ]
}
```

---

## Customers

### GET /api/customers

Searchable, filterable, paginated customer list.

**Query Params**:
| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Search by name or phone |
| `status` | string | — | Filter by status |
| `tag` | string | — | Filter by tag |
| `min_score` | integer | — | Minimum lead score |
| `assigned` | string | — | Employee ID or "unassigned" |
| `sort` | string | `last_contact_date` | Sort field |
| `order` | string | `desc` | asc / desc |
| `page` | integer | 1 | Page number |
| `limit` | integer | 25 | Results per page |

**Response**:
```json
{
  "customers": [
    {
      "id": "uuid",
      "name": "Rahul Sharma",
      "phone_display": "91XXXX4321",
      "lead_score": 85,
      "status": "negotiating",
      "tags": ["brochure_viewed", "price_inquiry"],
      "assigned_employee": "Priya Sharma",
      "last_contact_date": "2026-07-11T14:15:00Z",
      "created_at": "2026-06-15T10:00:00Z"
    }
  ],
  "total": 247,
  "page": 1,
  "totalPages": 10
}
```

### GET /api/customers/:id

Full customer record with conversation history.

**Response**: Customer object + `conversations` array + `bookings` array.

### POST /api/customers

Create a new customer record. Body:
```json
{
  "phone": "+919876543210",
  "name": "Rahul Sharma"
}
```

### PUT /api/customers/:id

Update customer fields. Body can include any subset of: name, status, tags, assigned_employee, preferred_dates, guest_count, notes.

---

## Team

### GET /api/dashboard/team

Team aggregate stats and leaderboard.

**Response**:
```json
{
  "aggregate": {
    "total_bookings": 32,
    "total_revenue": 345000,
    "avg_conversion": 31.4,
    "leads_waiting": 5
  },
  "employees": [
    {
      "id": "uuid",
      "name": "Priya Sharma",
      "role": "sales",
      "active": true,
      "stats": {
        "leads_assigned": 34,
        "bookings": 12,
        "conversion_rate": 35.3,
        "revenue": 142000,
        "avg_reply_time_minutes": 1.2,
        "satisfaction_rating": 4.8,
        "messages_sent": 145
      }
    }
  ]
}
```

### GET /api/dashboard/team/:employeeId

Per-employee detailed stats with trends.

**Response**: Employee object + `monthlyTrend` array + `leadPipeline` breakdown + `recentActivity` array.

---

## System

### GET /api/system/health

System health and status.

**Response**:
```json
{
  "uptime_hours": 720.5,
  "uptime_30day_percent": 99.8,
  "vm": {
    "cpu_percent": 34,
    "ram_percent": 42,
    "disk_percent": 15
  },
  "phone": {
    "connected": true,
    "battery_percent": 89,
    "charging": true,
    "last_seen": "2026-07-11T14:20:00Z"
  },
  "tailscale": {
    "connected": true,
    "vm_ip": "100.74.x.x",
    "phone_ip": "100.85.x.x"
  },
  "whatsapp": {
    "running": true,
    "foreground": true
  },
  "api_errors_24h": 2,
  "messages_today": 47,
  "error_log": [
    {
      "timestamp": "2026-07-11T12:00:00Z",
      "type": "media_upload_failed",
      "detail": "video-pool.mp4 checksum mismatch"
    }
  ]
}
```

---

## Campaigns

### GET /api/campaigns

List all campaigns.

### POST /api/campaigns

Create a new campaign. Body:
```json
{
  "name": "Monsoon 30% Off",
  "segment_criteria": {
    "tags": ["brochure_viewed"],
    "status": ["engaged", "negotiating"],
    "lead_score_min": 40
  },
  "template_content": "🏖️ Hi {{name}}, enjoy 30% off!",
  "variable_fields": ["name"]
}
```

### POST /api/campaigns/:id/send

Send a campaign to matching customers. Returns matched count.

### GET /api/campaigns/segment-preview

Preview segment match count. Body: `segment_criteria` JSON. Returns `{ "matched_count": 12 }`.

---

## Export

### GET /api/export/csv

CSV data export.

**Query Params**:
| Param | Type | Default | Description |
|---|---|---|---|
| `from` | string | 30 days ago | ISO date |
| `to` | string | today | ISO date |
| `type` | string | events | events / customers / bookings |

**Response**: `Content-Type: text/csv` with `Content-Disposition: attachment`

---

## Admin

### GET /api/admin/settings

Get resort settings.

### PUT /api/admin/settings

Update resort settings. Body:
```json
{
  "resort_name": "MGH Resort",
  "whatsapp_number": "+919876543210",
  "notification_channel": "telegram",
  "telegram_bot_token": "xxx",
  "telegram_chat_id": "xxx",
  "admin_whatsapp": "+919876543211"
}
```

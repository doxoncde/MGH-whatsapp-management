// Cloudflare Worker — MGH Bot REST API
// Replaces backend/server.js Express API

import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { corsJson, corsError, corsHeaders } from "./middleware/cors";
import {
  getDashboardOverview, getBotPerformance, searchCustomers,
  getCampaigns, createCampaign, updateCampaignSend,
  getTeamStats, query, updateCustomer, getCustomerEvents,
  getBookingsByCustomer, hashPhoneAsync,
} from "./db/neon-client";
import { normalizePhone } from "./utils/phoneParser";

const app = new Hono();

// CORS
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// Auth middleware (skip for health)
app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/health") return next();
  const authHeader = c.req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const expected = (c.env as any)?.API_TOKEN || "mgh-dashboard-secret-token-change-me";
  if (token !== expected) {
    return c.json({ error: true, message: "Invalid or missing API token", code: "UNAUTHORIZED" }, 401);
  }
  return next();
});

// --- Health ---

app.get("/api/health", (c) => {
  return c.json({ status: "ok", uptime: Date.now() });
});

// --- Dashboard ---

app.get("/api/dashboard/overview", async (c) => {
  try {
    const data = await getDashboardOverview();
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.get("/api/dashboard/bot", async (c) => {
  try {
    const data = await getBotPerformance();
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

// --- Customers ---

app.get("/api/customers", async (c) => {
  try {
    const params = {
      search: c.req.query("search"),
      status: c.req.query("status"),
      tag: c.req.query("tag"),
      minScore: c.req.query("min_score") ? parseInt(c.req.query("min_score")!) : undefined,
      assigned: c.req.query("assigned"),
      sort: c.req.query("sort") || "last_contact_date",
      order: c.req.query("order") || "desc",
      page: c.req.query("page") ? parseInt(c.req.query("page")!) : 1,
      limit: c.req.query("limit") ? parseInt(c.req.query("limit")!) : 25,
    };
    const data = await searchCustomers(params);
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.get("/api/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await query("SELECT * FROM customers WHERE id = $1", [id]);
    if (result.length === 0) return c.json({ error: true, message: "Customer not found" }, 404);

    const customer = result[0];
    const [conversations, bookings, events] = await Promise.all([
      query("SELECT * FROM conversations WHERE customer_id = $1 ORDER BY last_activity_at DESC LIMIT 10", [id]),
      getBookingsByCustomer(id),
      getCustomerEvents(id),
    ]);

    return c.json({ ...customer, conversations, bookings, events });
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.post("/api/customers", async (c) => {
  try {
    const body: any = await c.req.json();
    const { phone, name } = body;
    if (!phone) return c.json({ error: true, message: "Phone number required" }, 400);

    const phoneHash = await hashPhoneAsync(phone);
    const existing = await query("SELECT * FROM customers WHERE phone_hash = $1", [phoneHash]);
    if (existing.length > 0) return c.json(existing[0]);

    const result = await query(
      `INSERT INTO customers (phone_hash, phone_display, name, status, tags)
       VALUES ($1, $2, $3, 'new_lead', '[]') RETURNING *`,
      [phoneHash, phone.slice(-4), name || ""]
    );
    return c.json(result[0], 201);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.put("/api/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body: any = await c.req.json();
    await updateCustomer(id, body);

    const result = await query("SELECT * FROM customers WHERE id = $1", [id]);
    if (result.length === 0) return c.json({ error: true, message: "Customer not found" }, 404);
    return c.json(result[0]);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

// --- Team ---

app.get("/api/dashboard/team", async (c) => {
  try {
    const data = await getTeamStats();
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

// --- Campaigns ---

app.get("/api/campaigns", async (c) => {
  try {
    const data = await getCampaigns();
    return c.json(data);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.post("/api/campaigns", async (c) => {
  try {
    const body: any = await c.req.json();
    const campaign = await createCampaign(body);
    return c.json(campaign, 201);
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.post("/api/campaigns/segment-preview", async (c) => {
  try {
    const body: any = await c.req.json();
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.tags?.length) {
      conditions.push(`tags::text ILIKE $${idx}`);
      values.push(`%${body.tags[0]}%`);
      idx++;
    }
    if (body.status?.length) {
      conditions.push(`status = ANY($${idx})`);
      values.push(body.status);
      idx++;
    }
    if (body.lead_score_min) {
      conditions.push(`lead_score >= $${idx}`);
      values.push(body.lead_score_min);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await query(`SELECT COUNT(*) AS count FROM customers ${where}`, values);
    return c.json({ matched_count: parseInt(result[0]?.count || "0") });
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

app.post("/api/campaigns/:id/send", async (c) => {
  try {
    const id = c.req.param("id");
    const campaign = await query("SELECT * FROM campaigns WHERE id = $1", [id]);
    if (campaign.length === 0) return c.json({ error: true, message: "Campaign not found" }, 404);

    const criteria = campaign[0].segment_criteria;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const seg = typeof criteria === "string" ? JSON.parse(criteria) : criteria;

    if (seg.tags?.length) {
      conditions.push(`tags::text ILIKE $${idx}`);
      values.push(`%${seg.tags[0]}%`);
      idx++;
    }
    if (seg.status?.length) {
      conditions.push(`status = ANY($${idx})`);
      values.push(seg.status);
      idx++;
    }
    if (seg.lead_score_min) {
      conditions.push(`lead_score >= $${idx}`);
      values.push(seg.lead_score_min);
      idx++;
    }
    if (seg.last_contact_before) {
      conditions.push(`last_contact_date < $${idx}`);
      values.push(seg.last_contact_before);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const matches = await query(`SELECT id FROM customers ${where}`, values);
    await updateCampaignSend(id, matches.length);

    return c.json({ sent: true, matched_count: matches.length, recipients: matches.map((m: any) => m.id) });
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

// --- System Health ---

app.get("/api/system/health", async (c) => {
  try {
    // Check DO connection via DO's HTTP endpoint
    let phoneConnected = false;
    try {
      const doHealth = await (c.env as any).ORCHESTRATOR.fetch(new Request("https://orchestrator-dummy/health"));
      const doData: any = await doHealth.json();
      phoneConnected = doData.phoneConnected || false;
    } catch {}

    return c.json({
      botUptime: "N/A",
      cpuUsage: 0,
      ramUsage: 0,
      phoneBattery: 0,
      phoneCharging: false,
      tailscaleStatus: "Connected",
      whatsappStatus: phoneConnected ? "Running" : "Disconnected",
      apiErrors24h: 0,
    });
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

// --- Export CSV ---

app.get("/api/export/csv", async (c) => {
  try {
    const type = c.req.query("type") || "customers";
    let data: any[] = [];

    switch (type) {
      case "customers":
        data = await query(
          "SELECT name, phone_display, status, lead_score, first_contact_date, last_contact_date FROM customers ORDER BY last_contact_date DESC"
        );
        break;
      case "bookings":
        data = await query(
          "SELECT c.name, b.check_in_date, b.check_out_date, b.guest_count, b.booking_value, b.status FROM bookings b LEFT JOIN customers c ON c.id = b.customer_id ORDER BY b.created_at DESC"
        );
        break;
      case "events":
        data = await query(
          "SELECT phone_hash, event_type, actor, created_at FROM events ORDER BY created_at DESC LIMIT 500"
        );
        break;
      default:
        return c.json({ error: true, message: "Invalid export type" }, 400);
    }

    if (data.length === 0) return c.text("No data", { headers: { "Content-Type": "text/plain" } });

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row: any) => headers.map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-export.csv"`,
      },
    });
  } catch (e: any) {
    return c.json({ error: true, message: e.message }, 500);
  }
});

// --- DO WebSocket routing ---

// The Worker doesn't handle WebSocket — the DO does directly
// This endpoint just validates and passes through
app.get("/ws/connect", async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return c.json({ error: true, message: "Expected WebSocket upgrade" }, 400);
  }
  return new Response("WS endpoint reached", { status: 200 });
});

// --- 404 ---
app.notFound((c) => c.json({ error: true, message: "Not found", code: "NOT_FOUND" }, 404));

// --- Error handler ---
app.onError((err, c) => {
  console.error("[Worker] Error:", err.message);
  return c.json({ error: true, message: err.message }, 500);
});

export default app;

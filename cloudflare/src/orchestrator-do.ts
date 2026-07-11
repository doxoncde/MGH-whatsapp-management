// Cloudflare Durable Object — WhatsApp Bot Orchestrator
// Replaces backend/src/whatsapp/orchestrator.js

import {
  pickMenu, pickBrochure, pickVideos, pickBoth,
} from "./engines/templatePicker";
import { calculateScore } from "./engines/leadScorer";
import { selectBehavior, getBehaviorCommands } from "./engines/idleBehavior";
import {
  ensureCustomer, logEvent, hashPhoneAsync,
} from "./db/neon-client";
import { normalizePhone, isAdminCommand, getConfig } from "./utils/phoneParser";

export class OrchestratorDO implements DurableObject {
  private phoneWS: WebSocket | null = null;
  private phoneId: string | null = null;
  private authenticated: boolean = false;

  constructor(private state: DurableObjectState, private env: any) {
    // state and env stored for use in handlers
  }

  // HTTP fetch — used for WebSocket upgrade and health checks
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "ok",
        phoneConnected: this.phoneWS !== null && this.phoneWS.readyState === 1,
        phoneId: this.phoneId || "none",
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Orchestrator DO", { status: 200 });
  }

  // --- WebSocket handlers (Hibernation API) ---

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
      const msg = JSON.parse(raw);

      // Auth flow
      if (!this.authenticated) {
        if (msg.type === "auth") {
          const expectedToken = (this.env as any).PHONE_AUTH_TOKEN ||
            getConfig("PHONE_AUTH_TOKEN", "phone-secret-token-change-me");
          if (msg.token === expectedToken) {
            this.authenticated = true;
            this.phoneId = msg.phoneId || "phone-1";
            this.phoneWS = ws;
            ws.send(JSON.stringify({ type: "auth_ok" }));
            console.log(`[DO] Phone ${this.phoneId} authenticated`);

            await this.state.storage.put("startedAt", Date.now());
            await this.state.storage.put("lastPhoneConnect", Date.now());
          } else {
            ws.close(4001, "Unauthorized");
          }
        }
        return;
      }

      // Route messages
      if (msg.type === "whatsapp_message") {
        await this.handleWhatsAppMessage(msg.payload, ws);
      } else if (msg.type === "incoming_call") {
        await this.handleIncomingCall(msg.payload, ws);
      } else if (msg.type === "ack") {
        if (msg.commandId) {
          await this.state.storage.put(`ack:${msg.commandId}`, Date.now());
        }
      }
    } catch (e: any) {
      console.error("[DO] Message error:", e.message);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`[DO] Phone disconnected (code: ${code})`);
    this.phoneWS = null;
    this.authenticated = false;
    await this.state.storage.put("lastPhoneDisconnect", Date.now());
  }

  async webSocketError(ws: WebSocket, error: any) {
    console.error("[DO] WebSocket error:", error?.message || error);
    this.phoneWS = null;
    this.authenticated = false;
  }

  // --- Business Logic ---

  private async handleWhatsAppMessage(payload: any, ws: WebSocket) {
    const { sender, message, senderName } = payload || {};
    if (!sender || !message) return;

    // Admin command check
    const adminCmd = isAdminCommand(message);
    if (adminCmd) {
      await this.handleAdminCommand(adminCmd, sender, ws);
      return;
    }

    const phoneHash = await hashPhoneAsync(sender);
    const customer = await ensureCustomer(sender, senderName);

    await logEvent({
      phoneHash,
      customerId: customer.id,
      eventType: "conversation_started",
    });

    // Anti-detection idle behavior
    const behavior = selectBehavior();
    const behaviorCmds = getBehaviorCommands(behavior);
    for (const cmd of behaviorCmds) {
      this.sendCommand(ws, cmd.action, cmd.payload, `idle_${Date.now()}`);
    }

    // Template matching
    const trimmed = (message || "").trim();
    let replyText: string;

    if (/^[1１]/.test(trimmed) || /brochure/i.test(trimmed)) {
      replyText = await pickBrochure(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "brochure_requested" });
    } else if (/^[2２]/.test(trimmed) || /video/i.test(trimmed)) {
      replyText = await pickVideos(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "videos_requested" });
    } else if (/^[3３]/.test(trimmed) || /both|all/i.test(trimmed)) {
      replyText = await pickBoth(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "both_requested" });
    } else if (/price|rate|cost|₹|rs/i.test(trimmed)) {
      replyText = await pickMenu(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "price_inquiry" });
      await this.notifyAdmin(`🔥 HOT LEAD: ${customer.name || senderName} asked "${trimmed}"`);
    } else if (/date|book|check.?in|available/i.test(trimmed)) {
      replyText = await pickMenu(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "dates_provided" });
      await this.notifyAdmin(`🔥 HOT LEAD: ${customer.name || senderName} — Dates inquiry`);
    } else if (!/^[0-9１-３]+$/.test(trimmed) && trimmed.length > 2) {
      replyText = await pickMenu(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "customer_question" });
    } else {
      replyText = await pickMenu(this.state.storage);
      await logEvent({ phoneHash, customerId: customer.id, eventType: "menu_sent" });
    }

    // Scoring
    try { await calculateScore(customer.id); } catch {}

    // Send reply command
    this.sendCommand(ws, "send_message", {
      recipient: sender,
      text: replyText,
    }, `cmd_${Date.now()}`);
  }

  private async handleIncomingCall(payload: any, ws: WebSocket) {
    const { number } = payload;
    if (!number) return;

    console.log(`[DO] Incoming call from: ${number}`);
    await this.notifyAdmin(`📞 Incoming call from ${number}`);

    // Trigger IVR sequence
    this.sendCommand(ws, "ivr_sequence", {
      filepath: "/data/local/tmp/mgh-greeting.wav",
    }, `ivr_${Date.now()}`);

    await this.state.storage.put(`ivr:pending:${number}`, Date.now());
  }

  private async handleAdminCommand(cmd: any, sender: string, ws: WebSocket) {
    if (cmd.command === "send_details" && cmd.phoneRaw) {
      const defaultCountry = (this.env as any).DEFAULT_COUNTRY_CODE || "91";
      const result = normalizePhone(cmd.phoneRaw, defaultCountry);

      if (!result.valid) {
        this.sendToPhone(ws, sender, `❌ Invalid phone: "${cmd.phoneRaw}"`);
        return;
      }

      const menuText = await pickMenu(this.state.storage);
      this.sendToPhone(ws, result.normalized!, menuText);
      this.sendToPhone(ws, sender,
        `✅ Menu sent to ${result.normalized}${result.isIndian ? " (India)" : ""}`);
    }

    if (cmd.command === "status") {
      const connected = this.phoneWS !== null && this.phoneWS.readyState === 1;
      this.sendToPhone(ws, sender,
        `✅ Status: Phone ${connected ? "Connected ✅" : "Disconnected ❌"} | Running on Cloudflare Edge`);
    }
  }

  // --- Communication ---

  private sendCommand(ws: WebSocket, action: string, payload: Record<string, any>, commandId: string) {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type: "command", id: commandId, action, payload }));
  }

  private sendToPhone(ws: WebSocket, recipient: string, text: string) {
    this.sendCommand(ws, "send_message", { recipient, text }, `msg_${Date.now()}`);
  }

  private async notifyAdmin(text: string) {
    const adminNumber = (this.env as any).ADMIN_WHATSAPP || "";
    if (!adminNumber || !this.phoneWS || this.phoneWS.readyState !== 1) {
      console.log("[DO] Admin notify (no phone):", text);
      return;
    }
    this.sendToPhone(this.phoneWS, adminNumber, text);
  }
}

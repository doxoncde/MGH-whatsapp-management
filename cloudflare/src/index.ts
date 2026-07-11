// Cloudflare Durable Object — WhatsApp Bot Orchestrator
// Brain of the MGH bot: receives events from phone, makes decisions, sends commands back

export { OrchestratorDO } from "./orchestrator-do";

// Environment bindings
export interface Env {
  ORCHESTRATOR: DurableObjectNamespace;
  API_TOKEN: string;
  PHONE_AUTH_TOKEN: string;
  ADMIN_WHATSAPP: string;
  DEFAULT_COUNTRY_CODE: string;
  DATABASE_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

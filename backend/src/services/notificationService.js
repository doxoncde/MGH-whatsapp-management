import { config } from '../config/index.js';

let orchestratorRef = null;

export function setOrchestrator(orchestrator) {
  orchestratorRef = orchestrator;
}

export async function notifyNewLead(customerName, phoneHash, message) {
  const text = `🔔 New Lead: ${customerName || 'Unknown'}\nMessage: "${(message || '').slice(0, 100)}"\nPhone: ...${phoneHash.slice(-4)}`;
  
  // WhatsApp notification via orchestrator
  if (orchestratorRef && config.adminWhatsapp) {
    orchestratorRef.sendToPhone(config.adminWhatsapp, text);
  }
  
  // Telegram notification
  if (config.telegramBotToken && config.telegramChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.telegramChatId, text }),
      });
    } catch (e) {
      console.error('[Telegram] Failed to send notification:', e.message);
    }
  }
  
  console.log('[Notification] New lead:', text);
}

export async function notifyHotLead(customerName, phoneHash, question) {
  const text = `🔥 HOT LEAD: ${customerName || 'Unknown'}\nAsked: "${question}"\nPhone: ...${phoneHash.slice(-4)}`;
  
  if (orchestratorRef && config.adminWhatsapp) {
    orchestratorRef.sendToPhone(config.adminWhatsapp, text);
  }
  
  if (config.telegramBotToken && config.telegramChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text,
          parse_mode: 'HTML',
          reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: 'View in Dashboard', url: 'http://localhost:5173/crm' }]],
          }),
        }),
      });
    } catch (e) {
      console.error('[Telegram] Failed to send hot lead alert:', e.message);
    }
  }
}

export async function notifyUnresponded(customerName, elapsedMinutes) {
  const text = `⏰ Unresponded: ${customerName} waiting ${elapsedMinutes} min`;
  
  if (orchestratorRef && config.adminWhatsapp) {
    orchestratorRef.sendToPhone(config.adminWhatsapp, text);
  }
  
  console.log('[Notification] Unresponded:', text);
}

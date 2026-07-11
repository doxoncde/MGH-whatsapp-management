import { WebSocketServer } from 'ws';
import { config } from '../config/index.js';
import { calculateDelay, sleep } from './engines/delay.js';
import { buildTypeCommand } from './engines/typing.js';
import { selectBehavior, getBehaviorCommands } from './engines/idleBehavior.js';
import { pickMenu, pickBrochure, pickVideos, pickBoth, pickInvalid } from './engines/templatePicker.js';
import { logEvent, ensureCustomer } from '../services/eventLogger.js';
import { calculateScore } from '../services/leadScorer.js';
import { notifyNewLead, notifyHotLead } from '../services/notificationService.js';

const phones = new Map();
const pendingAcks = new Map();

export function startOrchestrator(port = 9090) {
  const wss = new WebSocketServer({ port });
  
  wss.on('connection', (ws, req) => {
    // Simple auth: first message must be auth token
    let authenticated = false;
    let phoneId = null;
    
    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (!authenticated) {
          if (msg.type === 'auth' && msg.token === config.phoneAuthToken) {
            authenticated = true;
            phoneId = msg.phoneId || 'phone-1';
            phones.set(phoneId, ws);
            console.log(`[Orchestrator] Phone ${phoneId} connected`);
            ws.send(JSON.stringify({ type: 'auth_ok' }));
          } else {
            ws.close(4001, 'Unauthorized');
          }
          return;
        }
        
        if (msg.type === 'whatsapp_message') {
          await handleIncomingMessage(phoneId, msg.payload, ws);
        }
        
        if (msg.type === 'ack') {
          const resolver = pendingAcks.get(msg.commandId);
          if (resolver) {
            resolver(msg);
            pendingAcks.delete(msg.commandId);
          }
        }
      } catch (e) {
        console.error('[Orchestrator] Error processing message:', e.message);
      }
    });
    
    ws.on('close', () => {
      if (phoneId) {
        phones.delete(phoneId);
        console.log(`[Orchestrator] Phone ${phoneId} disconnected`);
      }
    });
  });
  
  console.log(`[Orchestrator] WebSocket server on port ${port}`);
  return { wss, phones };
}

async function handleIncomingMessage(phoneId, payload, ws) {
  const { sender, message, senderName } = payload;
  
  // Log and ensure customer record
  const customer = ensureCustomer(sender, senderName);
  logEvent({ phone: sender, customerId: customer.id, eventType: 'conversation_started' });
  
  // Check if this is a known customer — if new, notify
  if (!customer.name || customer.first_contact_date === customer.last_contact_date) {
    await notifyNewLead(customer.name || senderName || 'Unknown', customer.phone_hash || '', message);
  }
  
  const state = 'awaiting_choice'; // simplified for MVP — always treat as new interaction
  
  // Idle behavior
  const behavior = selectBehavior();
  if (behavior !== 'normalReply') {
    const commands = getBehaviorCommands(behavior);
    // Simulate idle behavior (simplified — just log it)
    logEvent({ phone: sender, customerId: customer.id, eventType: 'idle_behavior', eventData: { behavior }, actor: 'bot' });
  }
  
  let replyText;
  
  // Match message to action
  const trimmed = (message || '').trim();
  
  if (state === 'awaiting_choice' || !customer.last_contact_date) {
    if (/^[1１]/.test(trimmed) || /brochure/i.test(trimmed)) {
      replyText = pickBrochure();
      logEvent({ phone: sender, customerId: customer.id, eventType: 'brochure_requested' });
      logEvent({ phone: sender, eventType: 'brochure_sent', actor: 'bot' });
    } else if (/^[2２]/.test(trimmed) || /video/i.test(trimmed)) {
      replyText = pickVideos();
      logEvent({ phone: sender, customerId: customer.id, eventType: 'videos_requested' });
      logEvent({ phone: sender, eventType: 'videos_sent', actor: 'bot' });
    } else if (/^[3３]/.test(trimmed) || /both|all/i.test(trimmed)) {
      replyText = pickBoth();
      logEvent({ phone: sender, customerId: customer.id, eventType: 'both_requested' });
      logEvent({ phone: sender, eventType: 'both_sent', actor: 'bot' });
    } else if (/price|rate|cost|₹|rs/i.test(trimmed)) {
      replyText = pickMenu(); // Show menu as fallback for price inquiries
      logEvent({ phone: sender, customerId: customer.id, eventType: 'price_inquiry' });
      await notifyHotLead(customer.name, customer.phone_hash, trimmed);
    } else if (/date|book|check.?in|available/i.test(trimmed)) {
      replyText = pickMenu(); // Show menu
      logEvent({ phone: sender, customerId: customer.id, eventType: 'dates_provided' });
      await notifyHotLead(customer.name, customer.phone_hash, trimmed);
    } else if (!/^[0-9１-３]+$/.test(trimmed) && trimmed.length > 2) {
      replyText = pickMenu(); // Unrecognized query → show menu
      logEvent({ phone: sender, customerId: customer.id, eventType: 'customer_question' });
    } else {
      replyText = pickMenu(); // Default: show menu (new conversation or unrecognized)
      logEvent({ phone: sender, customerId: customer.id, eventType: 'menu_sent' });
    }
  }
  
  // Calculate lead score
  calculateScore(customer.id);
  
  // Calculate delay
  const delay = calculateDelay('short');
  
  // Build command sequence
  const typing = buildTypeCommand(replyText);
  const commandId = `cmd_${Date.now()}`;
  
  const cmd = {
    type: 'command',
    id: commandId,
    payload: { recipient: sender, text: replyText, typingDelayMs: typing.totalDelayMs },
  };
  
  // Send to phone
  if (ws.readyState === 1) {
    await sleep(delay);
    ws.send(JSON.stringify(cmd));
  }
}

export function sendToPhone(recipient, text) {
  // Send notification to admin via any connected phone
  for (const [id, ws] of phones) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'command',
        id: `notif_${Date.now()}`,
        payload: { recipient, text },
      }));
      break;
    }
  }
}

// Run directly
const port = parseInt(process.env.WS_PORT || '9090');
startOrchestrator(port);

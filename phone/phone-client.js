/**
 * MGH Phone Client — Android Termux
 * WebSocket client that connects to VM orchestrator.
 * Reads WhatsApp notifications via termux-notification-list.
 * Executes ADB commands via shizuku shell.
 */

const WebSocket = require('ws');
const { execSync } = require('child_process');

const VM_URL = process.env.VM_URL || 'ws://localhost:9090';
const AUTH_TOKEN = process.env.PHONE_AUTH_TOKEN || 'phone-secret-token';
const RECONNECT_DELAY = 5000;
const POLL_INTERVAL = 2000;

let ws;
let reconnecting = false;

function connect() {
  ws = new WebSocket(VM_URL);

  ws.on('open', () => {
    console.log('[Phone] Connected to VM');
    reconnecting = false;

    // Authenticate
    ws.send(JSON.stringify({
      type: 'auth',
      token: AUTH_TOKEN,
      phoneId: 'phone-1',
    }));
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'auth_ok') {
        console.log('[Phone] Authenticated');
        return;
      }

      if (msg.type === 'command') {
        const result = await executeCommand(msg);
        ws.send(JSON.stringify({
          type: 'ack',
          commandId: msg.id,
          ...result,
        }));
      }
    } catch (e) {
      console.error('[Phone] Error:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('[Phone] Disconnected');
    if (!reconnecting) {
      reconnecting = true;
      setTimeout(connect, RECONNECT_DELAY);
    }
  });

  ws.on('error', (err) => {
    console.error('[Phone] WebSocket error:', err.message);
  });
}

function executeCommand(cmd) {
  try {
    const { recipient, text } = cmd.payload || {};

    switch (cmd.action || 'send_message') {
      case 'tap':
        sh(`input tap ${cmd.payload.x} ${cmd.payload.y}`);
        break;
      case 'swipe':
        sh(`input swipe ${cmd.payload.x1} ${cmd.payload.y1} ${cmd.payload.x2} ${cmd.payload.y2} ${cmd.payload.duration || 300}`);
        break;
      case 'type':
        // Simulate typing
        sh(`input text "${(cmd.payload.text || '').replace(/"/g, '\\"')}"`);
        break;
      case 'keyevent':
        sh(`input keyevent ${cmd.payload.key}`);
        break;
      case 'send_message':
      default:
        // For the MVP, just log — real ADB interaction requires WhatsApp UI coordinates
        console.log(`[Phone] Would send to ${recipient}: "${text}"`);
        break;
    }

    return { status: 'ok' };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

function sh(cmd) {
  try {
    return execSync(`shizuku shell ${cmd}`, { timeout: 5000, encoding: 'utf8' });
  } catch (e) {
    // shizuku not available — log and continue
    console.log(`[Phone] shizuku unavailable, command skipped: ${cmd}`);
    return '';
  }
}

// Notification listener
function startNotificationListener() {
  setInterval(() => {
    try {
      const output = execSync('termux-notification-list', { timeout: 3000, encoding: 'utf8' });
      const notifs = JSON.parse(output || '[]');

      const waNotifs = (notifs || []).filter(n =>
        n.packageName === 'com.whatsapp' && !n.groupKey
      );

      for (const n of waNotifs) {
        const text = n.content || n.title || '';
        const senderMatch = text.match(/from\s+([^:]+)/i) || text.match(/^([^:]+)/);
        const senderName = senderMatch ? senderMatch[1].trim() : 'Unknown';
        const message = text.split(':').slice(1).join(':').trim() || text;

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'whatsapp_message',
            payload: {
              sender: '+919876543210', // placeholder — extract from notification in production
              senderName,
              message: message || text,
              timestamp: Date.now(),
            },
          }));
        }
      }
    } catch (e) {
      // Notification polling failed — non-fatal
    }
  }, POLL_INTERVAL);
}

console.log('[Phone] Starting MGH Phone Client');
console.log('[Phone] VM URL:', VM_URL);
connect();
startNotificationListener();

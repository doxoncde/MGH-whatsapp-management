/**
 * MGH Phone Client — Android Termux (Rooted)
 * WebSocket client that connects to VM orchestrator.
 * Reads WhatsApp notifications via termux-notification-list.
 * Executes commands via root shell (Magisk su).
 * Handles IVR: auto-answer calls, inject greeting audio, hang up.
 */

const WebSocket = require('ws');
const { execSync } = require('child_process');

const VM_URL = process.env.VM_URL || 'ws://localhost:9090';
const AUTH_TOKEN = process.env.PHONE_AUTH_TOKEN || 'phone-secret-token';
const RECONNECT_DELAY = 5000;
const POLL_INTERVAL = 2000;
const CALL_POLL_INTERVAL = 3000;

// Device-calibrated coordinates (update these for your Realme X2 Pro)
const SEND_BUTTON_X = 1000;
const SEND_BUTTON_Y = 2200;
const SPEAKERPHONE_X = 540;
const SPEAKERPHONE_Y = 2100;

let ws;
let reconnecting = false;

// Call state tracking
let lastCallState = 0;
let lastCallNumber = '';
let lastCallTime = 0;
let callInProgress = false;

function connect() {
  ws = new WebSocket(VM_URL);

  ws.on('open', () => {
    console.log('[Phone] Connected to VM');
    reconnecting = false;
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sh(cmd) {
  try {
    // Use root shell (Magisk su) for privileged commands
    console.log(`[Phone] Running: ${cmd}`);
    return execSync(`su -c '${cmd}'`, { timeout: 10000, encoding: 'utf8' });
  } catch (e) {
    console.log(`[Phone] Command failed: ${cmd} — ${e.message}`);
    return '';
  }
}

function shNoRoot(cmd) {
  try {
    return execSync(cmd, { timeout: 5000, encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

async function executeCommand(cmd) {
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
        sh(`input text "${(cmd.payload.text || '').replace(/"/g, '\\"')}"`);
        break;
      case 'keyevent':
        sh(`input keyevent ${cmd.payload.key}`);
        break;

      // --- IVR Commands ---
      case 'answer_call':
        sh('input keyevent 79'); // HEADSETHOOK — answer call
        callInProgress = true;
        console.log('[Phone] Call answered');
        break;

      case 'hangup':
        sh('input keyevent 6'); // ENDCALL
        callInProgress = false;
        console.log('[Phone] Call ended');
        break;

      case 'enable_speakerphone':
        // Tap speakerphone button during call
        sh(`input tap ${SPEAKERPHONE_X} ${SPEAKERPHONE_Y}`);
        console.log('[Phone] Speakerphone toggled');
        break;

      case 'play_audio_uplink':
        // Inject audio file into call uplink via ALSA
        if (!callInProgress) {
          return { status: 'error', error: 'No active call' };
        }
        const filepath = cmd.payload.filepath || '/data/local/tmp/mgh-greeting.wav';
        sh("tinymix 'Incall_Music Audio Mixer MultiMedia1' 1");
        sh(`tinyplay ${filepath}`);
        sh("tinymix 'Incall_Music Audio Mixer MultiMedia1' 0");
        console.log(`[Phone] Audio played to caller: ${filepath}`);
        break;

      case 'ivr_sequence':
        // Full automated IVR: answer → speakerphone → play greeting → hangup
        console.log('[Phone] Starting IVR sequence');
        await executeCommand({ action: 'answer_call' });
        await sleep(1500);
        await executeCommand({ action: 'enable_speakerphone' });
        await sleep(800);
        await executeCommand({ action: 'play_audio_uplink', payload: cmd.payload });
        await sleep(1000);
        await executeCommand({ action: 'hangup' });
        console.log('[Phone] IVR sequence complete');
        break;

      // --- WhatsApp Send (FIXED) ---
      case 'send_message':
      default:
        await sendWhatsAppMessage(recipient, text);
        break;
    }

    return { status: 'ok' };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

async function sendWhatsAppMessage(recipient, text) {
  if (!recipient || !text) {
    console.log('[Phone] Missing recipient or text, skipping send');
    return;
  }

  const cleanRecipient = recipient.replace(/\+/g, '');
  const encodedText = encodeURIComponent(text);

  console.log(`[Phone] Sending WhatsApp to ${recipient}: "${text.substring(0, 50)}..."`);

  // Open WhatsApp chat with pre-filled message
  shNoRoot(`am start -a android.intent.action.VIEW -d "https://wa.me/${cleanRecipient}?text=${encodedText}"`);

  // Wait for WhatsApp to load the chat
  await sleep(3000);

  // Tap the send button (coordinates — calibrate for your device)
  sh(`input tap ${SEND_BUTTON_X} ${SEND_BUTTON_Y}`);

  console.log(`[Phone] Message sent to ${recipient}`);
}

// --- Call Listener (IVR) ---
function startCallListener() {
  setInterval(() => {
    try {
      const output = shNoRoot('dumpsys telephony.registry | grep -E "mCallState|mCallIncomingNumber"');

      if (!output) return;

      const stateMatch = output.match(/mCallState=(\d+)/);
      const numberMatch = output.match(/mCallIncomingNumber=(\+?\d+)/);

      if (!stateMatch) return;

      const callState = parseInt(stateMatch[1]);
      const incomingNumber = numberMatch ? numberMatch[1] : '';

      // Detect state transitions
      if (lastCallState === 0 && callState === 1) {
        // IDLE → RINGING: New incoming call
        if (incomingNumber && !isDuplicate(incomingNumber)) {
          lastCallNumber = incomingNumber;
          lastCallTime = Date.now();
          console.log(`[Phone] Incoming call from: ${incomingNumber}`);

          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'incoming_call',
              payload: {
                number: incomingNumber,
                timestamp: Date.now(),
              },
            }));
          }
        }
      } else if (callState === 2 && !callInProgress) {
        // OFFHOOK — call answered (by user or auto-answer)
        callInProgress = true;
      } else if (callState === 0 && lastCallState !== 0) {
        // IDLE — call ended
        callInProgress = false;
      }

      lastCallState = callState;
    } catch (e) {
      // Non-fatal — dumpsys may fail temporarily
    }
  }, CALL_POLL_INTERVAL);
}

function isDuplicate(number) {
  if (number === lastCallNumber && Date.now() - lastCallTime < 10000) {
    return true;
  }
  return false;
}

// --- WhatsApp Account Check ---
async function checkWhatsApp(number) {
  try {
    const cleanNumber = number.replace(/\+/g, '');
    shNoRoot(`am start -a android.intent.action.VIEW -d "https://wa.me/${cleanNumber}"`);
    await sleep(3000);

    // Check logcat for errors
    const logcat = shNoRoot('logcat -d -t 50 | grep -i "not registered\\|not on whatsapp\\|invalid phone"');

    // Go back to home
    sh('input keyevent 3');

    if (logcat.includes('not registered') || logcat.includes('not on WhatsApp')) {
      return false;
    }
    return true;
  } catch (e) {
    console.log('[Phone] WhatsApp check failed:', e.message);
    return false;
  }
}

// --- WhatsApp Notification Listener ---
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

console.log('[Phone] Starting MGH Phone Client (Rooted)');
console.log('[Phone] VM URL:', VM_URL);
connect();
startNotificationListener();
startCallListener();
console.log('[Phone] Call listener active (polling every 3s)');

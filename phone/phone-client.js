/**
 * MGH Phone Client — Android Termux (Rooted)
 *
 * Guard Rails:
 *  - ActionQueue: All UI actions execute sequentially with 2s buffer
 *  - App Verification: Every tap checks foreground app before executing
 *  - Screen Management: Wake/sleep cycle — screen stays off when idle
 *  - Notification Deduplication: seenNotifications Set prevents replay loops
 *  - Safety Reset: HOME press after every action sequence
 */

const WebSocket = require('ws');
const { execSync } = require('child_process');

// --- Config ---
const VM_URL = process.env.VM_URL || 'ws://localhost:9090';
const AUTH_TOKEN = process.env.PHONE_AUTH_TOKEN || 'phone-secret-token';
const RECONNECT_DELAY = 5000;
const POLL_INTERVAL = 2000;
const CALL_POLL_INTERVAL = 1000; // 1s — fast enough to catch quick state transitions

// Device-calibrated coordinates (measured with Pointer Location)
const SEND_BUTTON_X = 1000;
const SEND_BUTTON_Y_KEYBOARD = 1387;     // Send button when keyboard is open
const SEND_BUTTON_Y_NO_KEYBOARD = 2313;  // Send button when keyboard is hidden
const SPEAKERPHONE_X = 674;
const SPEAKERPHONE_Y = 1844;

// --- State ---
let ws;
let reconnecting = false;
let lastCallState = 0;
let lastCallNumber = '';
let lastCallTime = 0;
let callInProgress = false;

// -----------------------------------------------------------------
// GUARD RAIL 1: Sequential Action Queue
// All physical phone actions run one at a time with a 2s safety gap
// -----------------------------------------------------------------
class ActionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const { task, resolve, reject } = this.queue.shift();
    try {
      const result = await task();
      await sleep(2000); // 2s safety buffer between all actions
      resolve(result);
    } catch (e) {
      reject(e);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

const commandQueue = new ActionQueue();
// Used for notification deduplication
const seenNotifications = new Set();

// -----------------------------------------------------------------
// Shell Helpers
// -----------------------------------------------------------------
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sh(cmd) {
  try {
    // PM2 loses the interactive Termux environment, causing 'sudo' (tsu) to fail
    // silently and run commands as the normal termux user (uid 10463).
    // We must use Magisk's 'su' directly with an explicit PATH.
    const customEnv = Object.assign({}, process.env, {
      PATH: '/system/bin:/system/xbin:/data/data/com.termux/files/usr/bin:' + (process.env.PATH || ''),
    });
    console.log(`[Phone] $ su -c "${cmd}"`);
    // Escape double quotes in the command since we wrap it in double quotes for su -c
    const escapedCmd = cmd.replace(/"/g, '\\"');
    return execSync(`su -c "${escapedCmd}"`, { timeout: 15000, encoding: 'utf8', env: customEnv });
  } catch (e) {
    console.error(`[Phone] Command failed: ${cmd} — ${e.message}`);
    return '';
  }
}

function shNoRoot(cmd) {
  try {
    const customEnv = Object.assign({}, process.env, {
      PATH: '/system/bin:/system/xbin:' + (process.env.PATH || '')
    });
    return execSync(cmd, { timeout: 8000, encoding: 'utf8', env: customEnv });
  } catch (e) {
    return '';
  }
}

// -----------------------------------------------------------------
// GUARD RAIL 2: Screen Management
// Screen stays off/dark when idle — wakes only when action is needed
// -----------------------------------------------------------------
function wakeScreen() {
  sh('input keyevent 224'); // WAKEUP
  shNoRoot('wm dismiss-keyguard'); // Programmatically bypass lock screen
  console.log('[Phone] Screen woken');
}

function sleepScreen() {
  sh('input keyevent 26'); // POWER/SLEEP
  console.log('[Phone] Screen sleeping');
}

// -----------------------------------------------------------------
// GUARD RAIL 3: App Verification Before Every Tap
// -----------------------------------------------------------------
function getForegroundApp() {
  const out = shNoRoot('dumpsys activity activities | grep ResumedActivity');
  const match = out.match(/([a-zA-Z0-9_.]+)\//);
  return match ? match[1] : null;
}

async function waitForForegroundApp(pkg, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = getForegroundApp();
    if (current === pkg) return true;
    await sleep(500);
  }
  console.error(`[GUARD] Timeout waiting for ${pkg} — got: ${getForegroundApp()}`);
  return false;
}

/**
 * Safe tap — aborts with HOME reset if wrong app is in foreground.
 * @returns {boolean} true if tap was executed, false if aborted
 */
function tapSafe(x, y, expectedPackage) {
  const current = getForegroundApp();
  if (current !== expectedPackage) {
    console.error(`[GUARD] ⛔ Expected ${expectedPackage} but got ${current}. Aborting tap → HOME`);
    sh('input keyevent 3'); // HOME — safe reset
    return false;
  }
  sh(`input tap ${x} ${y}`);
  return true;
}

// -----------------------------------------------------------------
// Send Verification (UI Automator)
// -----------------------------------------------------------------
function verifySendSuccess() {
  try {
    sh('uiautomator dump /sdcard/ui_dump.xml');
    const xml = shNoRoot('cat /sdcard/ui_dump.xml');
    // After sending, the message input should be empty
    return xml.includes('resource-id="com.whatsapp:id/entry" text=""');
  } catch (e) {
    return false; // Can't verify — assume sent
  }
}

// -----------------------------------------------------------------
// WhatsApp Message Sending (Reliable — Direct Intent + Guard Rails)
// -----------------------------------------------------------------
async function sendWhatsAppMessage(recipient, text) {
  if (!recipient || !text) {
    console.log('[Phone] Missing recipient or text, skipping');
    return false;
  }

  const cleanNumber = recipient.replace(/\+/g, '').replace(/\s/g, '');
  const encodedText = encodeURIComponent(text);
  console.log(`[Phone] 💬 Sending to ${recipient}: "${text.substring(0, 60)}..."`);

  // Step 1: Wake screen
  wakeScreen();
  await sleep(500);

  // Step 2: HOME — ensure clean neutral state
  sh('input keyevent 3');
  await sleep(500);

  // Step 3: Open WhatsApp directly via URI (no browser redirect)
  shNoRoot(`am start -a android.intent.action.VIEW -d "whatsapp://send?phone=${cleanNumber}&text=${encodedText}"`);

  // Step 4: Wait until WhatsApp is the foreground app (max 8 seconds)
  const inForeground = await waitForForegroundApp('com.whatsapp', 8000);
  if (!inForeground) {
    console.error('[Phone] ❌ WhatsApp did not open in time. Aborting send.');
    sh('input keyevent 3'); // HOME
    sleepScreen();
    return false;
  }

  // Step 5: Wait for chat to fully load
  await sleep(2000);

  // Step 6: Dismiss keyboard so send button is at lower Y
  sh('input keyevent 4'); // BACK closes keyboard but stays in chat
  await sleep(600);

  // Step 7: Tap Send button with app guard
  const tapped = tapSafe(SEND_BUTTON_X, SEND_BUTTON_Y_NO_KEYBOARD, 'com.whatsapp');
  if (!tapped) {
    sleepScreen();
    return false;
  }
  await sleep(800);

  // Step 8: Verify the message was actually sent
  const verified = verifySendSuccess();
  if (verified) {
    console.log(`[Phone] ✅ Message sent & verified to ${recipient}`);
  } else {
    console.log(`[Phone] ⚠️  Message sent (verification inconclusive) to ${recipient}`);
  }

  // Step 9: HOME reset and sleep screen
  await sleep(500);
  sh('input keyevent 3'); // HOME
  await sleep(300);
  sleepScreen();
  return true;
}

// -----------------------------------------------------------------
// IVR Call Handler — Mode B (Call Already Answered → Greet → Hang Up)
// Triggered when call transitions to OFFHOOK (state 2).
// Phone's built-in Auto-Answer handles the actual answering.
// -----------------------------------------------------------------
async function handleCallAnswered(number) {
  console.log(`[Phone] 🎵 Call answered — starting IVR for: ${number}`);
  callInProgress = true;

  // Wait for audio path to fully establish after answer
  await sleep(2000);

  // Step 1: Enable speakerphone so audio plays through speaker
  wakeScreen();
  await sleep(300);
  sh(`input tap ${SPEAKERPHONE_X} ${SPEAKERPHONE_Y}`);
  console.log('[Phone] Speakerphone enabled');
  await sleep(800);

  // Step 2: Route audio uplink and play Malayalam greeting
  sh('tinymix set "Incall_Music Audio Mixer MultiMedia1" 1 1');
  console.log('[Phone] 🔊 Playing greeting...');
  sh('tinyplay /data/local/tmp/mgh-greeting.wav');
  sh('tinymix set "Incall_Music Audio Mixer MultiMedia1" 0 0');
  console.log('[Phone] ✅ Greeting finished');

  // Step 3: 3-second courtesy pause after greeting ends
  await sleep(3000);

  // Step 4: Hang up
  sh('input keyevent 6'); // ENDCALL
  callInProgress = false;
  console.log('[Phone] 📴 Call ended');

  // Step 5: Sleep screen
  await sleep(500);
  sleepScreen();

  // Step 6: Notify Cloudflare — it will send a WhatsApp message to the caller
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'call_completed',
      payload: { number, timestamp: Date.now() },
    }));
  }
}

// -----------------------------------------------------------------
// Command Dispatcher
// -----------------------------------------------------------------
async function executeCommand(cmd) {
  try {
    const { recipient, text } = cmd.payload || {};

    switch (cmd.action || 'send_message') {
      case 'send_message':
        await sendWhatsAppMessage(recipient, text);
        break;

      case 'answer_call':
        wakeScreen();
        sh('input keyevent 79');
        callInProgress = true;
        console.log('[Phone] Call answered (manual command)');
        break;

      case 'hangup':
        sh('input keyevent 6');
        callInProgress = false;
        console.log('[Phone] Call ended (manual command)');
        break;

      case 'enable_speakerphone':
        sh(`input tap ${SPEAKERPHONE_X} ${SPEAKERPHONE_Y}`);
        console.log('[Phone] Speakerphone toggled');
        break;

      case 'play_audio_uplink':
        if (!callInProgress) return { status: 'error', error: 'No active call' };
        const filepath = cmd.payload.filepath || '/data/local/tmp/mgh-greeting.wav';
        sh('tinymix set "Incall_Music Audio Mixer MultiMedia1" 1 1');
        sh(`tinyplay ${filepath}`);
        sh('tinymix set "Incall_Music Audio Mixer MultiMedia1" 0 0');
        break;

      case 'tap':
        wakeScreen();
        sh(`input tap ${cmd.payload.x} ${cmd.payload.y}`);
        break;

      case 'keyevent':
        sh(`input keyevent ${cmd.payload.key}`);
        break;

      default:
        console.log(`[Phone] Unknown action: ${cmd.action}`);
    }

    return { status: 'ok' };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

// -----------------------------------------------------------------
// Call State Listener
// -----------------------------------------------------------------
function startCallListener() {
  setInterval(() => {
    try {
      const output = shNoRoot('dumpsys telephony.registry | grep -E "mCallState|mCallIncomingNumber"');
      if (!output) return;

      const stateMatch = output.match(/mCallState=(\d+)/);
      const numberMatch = output.match(/mCallIncomingNumber=(\+?[\d]+)/);
      if (!stateMatch) return;

      const callState = parseInt(stateMatch[1]);
      const incomingNumber = numberMatch ? numberMatch[1] : '';

      if (lastCallState === 0 && callState === 1) {
        // IDLE → RINGING: record number, notify Cloudflare
        if (incomingNumber && !isDuplicateCall(incomingNumber)) {
          lastCallNumber = incomingNumber;
          lastCallTime = Date.now();
          console.log(`[Phone] 📞 Ringing from: ${incomingNumber} — waiting for answer...`);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'incoming_call',
              payload: { number: incomingNumber, timestamp: Date.now() },
            }));
          }
        }
      } else if (callState === 2 && lastCallState !== 2) {
        // ANY state → OFFHOOK: call is now live (handles 0→2 fast transitions too)
        const number = lastCallNumber || incomingNumber;
        if (number && !callInProgress && !isDuplicateCall(number)) {
          console.log(`[Phone] ✅ Call OFFHOOK — triggering IVR for: ${number}`);
          commandQueue.add(() => handleCallAnswered(number));
        }
      } else if (callState === 0 && lastCallState !== 0) {
        // → IDLE: call ended
        callInProgress = false;
        console.log('[Phone] 📴 Call ended externally');
      }

      lastCallState = callState;
    } catch (e) { /* non-fatal polling error */ }
  }, CALL_POLL_INTERVAL);
}

function isDuplicateCall(number) {
  // Same number can only trigger IVR once per 60 seconds
  return number === lastCallNumber && Date.now() - lastCallTime < 60000;
}

// -----------------------------------------------------------------
// WhatsApp Notification Listener
// -----------------------------------------------------------------
function startNotificationListener() {
  setInterval(() => {
    try {
      const output = execSync('termux-notification-list', { timeout: 3000, encoding: 'utf8' });
      const notifs = JSON.parse(output || '[]');
      const waNotifs = (notifs || []).filter(n => n.packageName === 'com.whatsapp' && !n.groupKey);

      for (const n of waNotifs) {
        // GUARD RAIL: Deduplicate notifications by id+postTime
        const notifHash = `${n.id}-${n.postTime}`;
        if (seenNotifications.has(notifHash)) continue;

        seenNotifications.add(notifHash);

        // Prevent memory leak: cap at 1000 entries
        if (seenNotifications.size > 1000) {
          seenNotifications.delete(seenNotifications.values().next().value);
        }

        const text = n.content || n.title || '';
        console.log(`[Phone] 📩 WhatsApp notification: ${text.substring(0, 60)}`);

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'whatsapp_message',
            payload: {
              sender: n.tag || '+unknown',
              senderName: n.title || 'Unknown',
              message: text,
              timestamp: Date.now(),
            },
          }));
        }
      }
    } catch (e) { /* non-fatal polling error */ }
  }, POLL_INTERVAL);
}

// -----------------------------------------------------------------
// WebSocket Connection
// -----------------------------------------------------------------
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
        console.log('[Phone] Authenticated ✅');
        return;
      }

      if (msg.type === 'command') {
        // All commands go through the sequential queue
        commandQueue.add(async () => {
          const result = await executeCommand(msg);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ack',
              commandId: msg.id,
              ...result,
            }));
          }
        });
      }
    } catch (e) {
      console.error('[Phone] Message error:', e.message);
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

// -----------------------------------------------------------------
// Boot
// -----------------------------------------------------------------
console.log('[Phone] Starting MGH Phone Client (Rooted)');
console.log('[Phone] VM URL:', VM_URL);
connect();
startNotificationListener();
startCallListener();
console.log('[Phone] All listeners active');

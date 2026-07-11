# WhatsApp Automation Architecture: Phone + VM Hybrid

## Overview

A cheap Android phone handles WhatsApp UI automation. A free Oracle Cloud VM runs the orchestrator (decision logic, templates, timing engines). The phone acts as a thin client — it only executes UI commands (tap, type, swipe) when instructed by the VM. This keeps the phone's RAM/CPU usage minimal while the heavy processing runs on enterprise cloud hardware.

```
┌────────────────────────────────────┐        ┌─────────────────────────────────┐
│        ORACLE CLOUD VM (FREE)     │        │    CHEAP ANDROID PHONE           │
│        4 OCPU, 24GB RAM           |◄──────►│    2-4GB RAM                      │
│                                    │  WS    │                                  │
│  ┌──────────────────────────────┐ │        │  ┌────────────────────────────┐  │
│  │     ORCHESTRATOR (Node.js)   │ │        │  │   NOTIFICATION LISTENER    │  │
│  │                              │ │        │  │   (termux-notification-list)│  │
│  │  ┌────────┐  ┌────────────┐  │ │        │  │                            │  │
│  │  │ Delay  │  │  Typing    │  │ │        │  │   Reads WhatsApp messages   │  │
│  │  │ Engine │  │  Engine    │  │ │        │  │   Forwards to VM via WS     │  │
│  │  └───┬────┘  └─────┬──────┘  │ │        │  └─────────────┬──────────────┘  │
│  │      │              │        │ │        │                │                 │
│  │  ┌───▼──────────────▼─────┐  │ │        │  ┌─────────────▼──────────────┐  │
│  │  │    Message Processor    │  │ │        │  │     ADB EXECUTOR          │  │
│  │  │                        │  │ │        │  │    (shizuku shell)         │  │
│  │  │  - State machine        │  │ │        │  │                            │  │
│  │  │  - Template picker      │  │ │        │  │   Receives commands from    │  │
│  │  │  - Media sender         │  │ │        │  │   VM, executes on device:   │  │
│  │  └───────────┬─────────────┘  │ │        │  │   - input tap x y          │  │
│  │              │                │ │        │  │   - input text "message"   │  │
│  │  ┌───────────▼─────────────┐  │ │        │  │   - input swipe x1 y1...   │  │
│  │  │   Idle Behavior Gen     │  │ │        │  │   - keyevent (back/home)   │  │
│  │  └───────────┬─────────────┘  │ │        │  └────────────────────────────┘  │
│  │              │                │ │        │                                  │
│  │  ┌───────────▼─────────────┐  │ │        │  ┌────────────────────────────┐  │
│  │  │   Lifecycle Scheduler   │  │ │        │  │   WhatsApp Official App     │  │
│  │  └─────────────────────────┘  │ │        │  │   (Foreground, screen ON)   │  │
│  │                               │ │        │  └────────────────────────────┘  │
│  │  ┌─────────────────────────┐  │ │        │                                  │
│  │  │   WebSocket Server      │  │ │   WS   │  ┌────────────────────────────┐  │
│  │  │   (ws://0.0.0.0:9090)   │◄─┼─┼────────┼──┤   WebSocket Client         │  │
│  │  └─────────────────────────┘  │ │        │  │   (Termux Node.js)          │  │
│  │                               │ │        │  └────────────────────────────┘  │
│  │  ┌─────────────────────────┐  │ │        │                                  │
│  │  │   Admin Dashboard        │  │ │        │  Shizuku (ADB bridge, no root)  │
│  │  │   (optional web UI)      │  │ │        │  WhatsApp (official, Play Store)│
│  │  └─────────────────────────┘  │ │        │                                  │
│  └──────────────────────────────┘ │        └──────────────────────────────────┘
│                                    │
│  Tailscale IP: 100.74.x.x  │
│  Ubuntu 22.04 LTS                  │
└────────────────────────────────────┘
```

---

## Why This Architecture?

| Constraint | Solution |
|---|---|
| Phone too cheap for Node.js orchestrator | VM runs the heavy Node.js process |
| Phone battery/overheating if always-on | Phone idles; VM pings it only when needed |
| ADB over internet (remote) unreliable | ADB runs locally on phone (Shizuku), VM sends commands via WebSocket |
| Need public endpoint for webhooks | VM has public IP, can expose dashboard/API |
| Free tier exists | Oracle Cloud Always Free: 4 OCPU, 24GB RAM, 200GB storage, 10TB bandwidth |

---

## Network Security (Recommended: Tailscale)

The phone and VM should communicate over an encrypted tunnel with **zero open ports** to the internet. Tailscale creates a private WireGuard mesh — both devices get a `100.x.x.x` IP and talk as if on the same LAN. No ports exposed, no certs, no domain needed.

### Install Tailscale on Both Devices

```bash
# On Oracle VM:
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# On Android phone:
# Install Tailscale from Play Store -> sign in -> connect
```

After setup, the VM gets a Tailscale IP like `100.74.xxx.xxx`. The phone connects to that IP — not the public Oracle IP.

```env
# Phone .env:
VM_URL=ws://100.74.xxx.xxx:9090
```

**No firewall rules needed.** The Oracle security list stays closed to the internet. Only devices on your Tailscale network can reach the orchestrator.

### Comparison: Network Approaches

| Option | Cost | Encryption | Open Ports | Attack Surface |
|---|---|---|---|---|
| Raw IP + WS | 0 | None | Port 9090 open | Anyone can connect, token sniffable |
| Self-signed cert + WSS | 0 | TLS | Port 9090 open | Encrypted but port scannable |
| **Tailscale (recommended)** | **0** | **WireGuard** | **None** | **Zero — physically unreachable from internet** |
| Subdomain + Let's Encrypt | 0 (subdomain) | TLS | Port 443 open | Encrypted, public endpoint |

---

### Alternative: Subdomain + Let's Encrypt (if you prefer public endpoint)

If you already own a domain for your resort website, add a free DNS A record for `wa.yourdomain.com` pointing to the Oracle VM's public IP. Then:

```bash
# Install certbot + nginx
sudo apt-get install -y certbot nginx
sudo certbot certonly --standalone -d wa.yourdomain.com

# Nginx reverse proxy for WSS:
# server {
#     listen 443 ssl;
#     server_name wa.yourdomain.com;
#     ssl_certificate /etc/letsencrypt/live/wa.yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/wa.yourdomain.com/privkey.pem;
#     location / {
#         proxy_pass http://localhost:9090;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#     }
# }
sudo ufw allow 443/tcp
```

Phone connects to `wss://wa.yourdomain.com/phone`. Encrypted, but port 443 is open to the internet (DDoS risk, though Oracle provides basic protection and Cloudflare free tier can shield it).

---

## Communication Protocol

### Phone -> VM (WhatsApp notification arrived)

```json
{
  "type": "whatsapp_message",
  "payload": {
    "sender": "919876543210",
    "senderName": "Rahul Sharma",
    "message": "Hi",
    "timestamp": 1720700000000,
    "isGroup": false
  }
}
```

### VM -> Phone (automation command)

```json
{
  "type": "command",
  "id": "cmd_001",
  "action": "tap",
  "payload": { "x": 540, "y": 1800 }
}
```

```json
{
  "type": "command",
  "id": "cmd_002",
  "action": "type",
  "payload": {
    "text": "🌴 Welcome to MGH Resort!",
    "charDelay": { "min": 150, "max": 350 },
    "burstSize": { "min": 5, "max": 12 },
    "pauseBetweenBurst": { "min": 500, "max": 2000 },
    "backspaceChance": 0.10
  }
}
```

```json
{
  "type": "command",
  "id": "cmd_003",
  "action": "swipe",
  "payload": { "x1": 540, "y1": 1500, "x2": 540, "y2": 500, "duration": 300 }
}
```

```json
{
  "type": "command",
  "id": "cmd_004",
  "action": "send_media",
  "payload": {
    "filePath": "/sdcard/bot-media/brochure.pdf",
    "chatX": 540, "chatY": 2000
  }
}
```

```json
{
  "type": "command",
  "id": "cmd_005",
  "action": "keyevent",
  "payload": { "key": "BACK" }
}
```

### Phone -> VM (command executed)

```json
{
  "type": "ack",
  "commandId": "cmd_001",
  "status": "ok",
  "timestamp": 1720700001500
}
```

```json
{
  "type": "ack",
  "commandId": "cmd_002",
  "status": "error",
  "error": "WhatsApp not in foreground",
  "timestamp": 1720700002000
}
```

---

## Phone Component (Thin Client)

Runs on the Android phone via Termux. Minimal resource usage.

```js
// phone-client.js — runs on Android in Termux
const WebSocket = require('ws');
const { execSync } = require('child_process');

const VM_URL = 'ws://<TAILSCALE_VM_IP>:9090';
const AUTH_TOKEN = process.env.PHONE_AUTH_TOKEN;

let ws;

function connect() {
  ws = new WebSocket(VM_URL, {
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
  });

  ws.on('open', () => console.log('[Phone] Connected to VM'));

  ws.on('message', async (data) => {
    const cmd = JSON.parse(data);
    if (cmd.type === 'command') {
      const result = await executeCommand(cmd);
      ws.send(JSON.stringify({
        type: 'ack',
        commandId: cmd.id,
        ...result
      }));
    }
  });

  ws.on('close', () => {
    console.log('[Phone] Disconnected. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });
}

function executeCommand(cmd) {
  try {
    switch (cmd.action) {
      case 'tap':
        sh(`input tap ${cmd.payload.x} ${cmd.payload.y}`);
        break;
      case 'swipe':
        sh(`input swipe ${cmd.payload.x1} ${cmd.payload.y1} ${cmd.payload.x2} ${cmd.payload.y2} ${cmd.payload.duration}`);
        break;
      case 'type':
        typeWithHumanCadence(cmd.payload);
        break;
      case 'keyevent':
        sh(`input keyevent ${keyCode(cmd.payload.key)}`);
        break;
      case 'send_media':
        sendMedia(cmd.payload);
        break;
    }
    return { status: 'ok' };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

function sh(cmd) {
  return execSync(`shizuku shell ${cmd}`, { timeout: 5000 }).toString();
}

// Notification listener — runs as separate thread
function startNotificationListener() {
  setInterval(() => {
    try {
      const notifs = JSON.parse(
        execSync('termux-notification-list').toString()
      );
      const waNotifs = notifs.filter(n => 
        n.packageName === 'com.whatsapp' && !n.groupKey
      );
      for (const n of waNotifs) {
        const parsed = parseWhatsAppNotification(n);
        if (parsed && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'whatsapp_message',
            payload: parsed
          }));
        }
      }
    } catch (e) {
      // Notification listener failed — non-fatal
    }
  }, 2000);
}

const keyCodes = {
  BACK: 4, HOME: 3, POWER: 26, 
  ENTER: 66, DEL: 67, MENU: 82
};

function keyCode(name) { return keyCodes[name] || name; }

connect();
startNotificationListener();
```

---

## VM Component (Orchestrator)

Runs on Oracle Cloud VM. Full Node.js orchestrator.

```js
// orchestrator.js — runs on Oracle VM
const WebSocket = require('ws');
const http = require('http');
const { delayEngine } = require('./engines/delay');
const { typingEngine } = require('./engines/typing');
const { idleBehavior } = require('./engines/idleBehavior');
const { templatePicker } = require('./engines/templatePicker');
const { lifecycle } = require('./engines/lifecycle');
const { stateStore } = require('./state/conversationStore');

const PHONES = new Map(); // phoneId -> WebSocket

// WebSocket server for phone connections
const wss = new WebSocket.Server({ port: 9090 });

wss.on('connection', (ws, req) => {
  const phoneId = authenticate(req);
  if (!phoneId) {
    ws.close(4001, 'Unauthorized');
    return;
  }
  
  PHONES.set(phoneId, ws);
  console.log(`[VM] Phone ${phoneId} connected`);

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);
    
    if (msg.type === 'whatsapp_message') {
      await handleIncomingMessage(phoneId, msg.payload, ws);
    }
    
    if (msg.type === 'ack') {
      handleAck(phoneId, msg);
    }
  });

  ws.on('close', () => {
    PHONES.delete(phoneId);
    console.log(`[VM] Phone ${phoneId} disconnected`);
  });
});

async function handleIncomingMessage(phoneId, payload, ws) {
  const { sender, message } = payload;
  const state = stateStore.get(sender);

  // 1. Decide idle behavior (may add delay before replying)
  const idleAction = idleBehavior.select();
  if (idleAction !== 'normalReply') {
    await executeIdleBehavior(ws, idleAction);
  }

  // 2. Pick response template
  const response = templatePicker.pick(state?.step, message);

  // 3. Calculate human delay
  const delay = delayEngine.calculate('short');

  // 4. Build command sequence
  const commands = [
    { action: 'tap', payload: { x: 540, y: 2200 } },
    { 
      action: 'type', 
      payload: typingEngine.buildTypeCommand(response.text),
      delayBefore: delay
    },
    { action: 'keyevent', payload: { key: 'ENTER' } }
  ];

  // 5. Send commands to phone sequentially with delays
  for (const cmd of commands) {
    if (cmd.delayBefore) await sleep(cmd.delayBefore);
    
    const cmdMsg = {
      type: 'command',
      id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...cmd
    };
    
    ws.send(JSON.stringify(cmdMsg));
    await waitForAck(cmdMsg.id, 10000);
  }

  // 6. Send media if needed
  if (response.media) {
    for (const media of response.media) {
      ws.send(JSON.stringify({
        type: 'command',
        id: `media_${Date.now()}`,
        action: 'send_media',
        payload: { filePath: media.path, ...media.coordinates }
      }));
      await waitForAck(cmdMsg.id, 15000);
    }
  }

  // 7. Update conversation state
  stateStore.set(sender, { step: 'awaiting_choice', timestamp: Date.now() });
}

// Admin dashboard (HTTP)
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      connectedPhones: PHONES.size,
      activeConversations: stateStore.count(),
      uptime: process.uptime()
    }));
  }
}).listen(3000);

console.log('[VM] Orchestrator running on :3000 (HTTP) + :9090 (WS)');
```

---

## Oracle Cloud Free Tier Setup

```bash
# 1. Create Oracle Cloud Always Free account
#    Choose: VM.Standard.A1.Flex (ARM, 4 OCPU, 24GB RAM)

# 2. SSH into VM
ssh ubuntu@<oracle-public-ip>

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Clone orchestrator code
git clone https://github.com/your-repo/mgh-bot-vm.git
cd mgh-bot-vm

# 5. Install dependencies + setup
npm install
cp .env.example .env
# Edit .env: PHONE_AUTH_TOKEN (32+ random chars)

# 6. Setup Tailscale (recommended — zero open ports)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
# Note the VM's Tailscale IP (100.74.x.x)
# Phone connects via ws://<tailscale-ip>:9090

# 7. Run orchestrator
npm install -g pm2
pm2 start orchestrator.js --name mgh-orchestrator
pm2 save
pm2 startup
```

**No firewall ports need to be opened.** With Tailscale, the VM and phone communicate through the encrypted WireGuard tunnel. The public internet cannot reach port 9090 at all.

---

## Phone Setup (Minimal)

```bash
# On the cheap Android phone:

# 1. Install Termux, Termux:Boot, Termux:API from F-Droid
# 2. Install Shizuku
# 3. Install Tailscale from Play Store -> sign in

# 4. In Termux:
pkg update && pkg upgrade
pkg install nodejs termux-api

# 5. Clone phone-client code
cd /data/data/com.termux/files/home
git clone https://github.com/your-repo/mgh-bot-phone.git
cd mgh-bot-phone
npm install

# 6. Configure
echo 'PHONE_AUTH_TOKEN=your-secret-token' > .env
echo 'VM_URL=ws://<TAILSCALE_VM_IP>:9090' >> .env

# 7. Start phone client (keeps reconnecting if VM restarts)
node phone-client.js

# 8. Setup Termux:Boot to auto-start on phone reboot
#    Create ~/.termux/boot/start-bot:
#    #!/data/data/com.termux/files/usr/bin/sh
#    termux-wake-lock
#    cd /data/data/com.termux/files/home/mgh-bot-phone
#    node phone-client.js &

# 9. Disable battery optimization for Termux (Android Settings)
# 10. Keep phone plugged into AC charger
```

---

## Message Flow (End-to-End)

```
1. Customer sends "Hi" on WhatsApp
   |
2. Phone notification listener detects it (2s poll)
   |
3. Phone sends { type: "whatsapp_message", payload: {...} } to VM via WS (over Tailscale encrypted tunnel)
   |
4. VM orchestrator receives it
   |-- 4a. Idle behavior dice roll -> 30% chance: "scroll chat"
   |       -> VM sends { action: "swipe", ... } -> phone scrolls
   |-- 4b. Delay engine -> 3.4 seconds
   |-- 4c. Template picker -> "Welcome to MGH Resort! ..." (variant 3)
   |-- 4d. Typing engine -> 21 chars, 3 bursts, 2 pauses, 0.8s total
   |       -> VM sends { action: "tap" } -> phone taps text field
   |       -> VM sends { action: "type", payload: { text: "...", charDelay: {...} } }
   |       -> Phone types character-by-character via shizuku shell
   |       -> VM sends { action: "keyevent", payload: { key: "ENTER" } }
   |       -> Phone sends reply
   |
5. Customer receives menu message on WhatsApp
```

---

## Phone Resource Usage

| Component | RAM | CPU |
|---|---|---|
| Termux + Node.js (phone-client.js) | ~60-80 MB | <1% idle, 3-5% active |
| Shizuku service | ~15 MB | <1% |
| Tailscale | ~30 MB | <1% |
| WhatsApp (foreground) | ~200-300 MB | <5% |
| **Total** | **~350 MB** | **~5-10%** |

Works on any phone with 2GB+ RAM. The phone never runs heavy computation — just notification polling (light) and ADB command execution via Shizuku (light). All decision-making, template picking, and timing calculations happen on the VM.

---

## Failure Recovery

| Failure | Recovery |
|---|---|
| Phone-VM WebSocket drops | Phone auto-reconnects every 5 seconds |
| Tailscale tunnel drops | Tailscale auto-reconnects. WebSocket client retries |
| VM crashes | PM2 restarts orchestrator instantly |
| VM reboots (maintenance) | Phone reconnects when VM comes back up. Missed messages: WhatsApp notifications accumulate on phone, polled when reconnected |
| Phone battery dies | Bot goes offline. Customer doesn't get reply. Manual intervention needed. (Mitigation: AC charger + Tasker alert on low battery) |
| WhatsApp updates, UI coordinates change | Update stored coordinates in orchestrator config |
| Shizuku crashes | Phone client detects failed `shizuku shell` commands, auto-restarts Shizuku |

---

## File Structure

```
VM (Oracle Cloud):
/home/ubuntu/mgh-bot-vm/
|-- orchestrator.js              # Main WebSocket server + message processor
|-- engines/
|   |-- delay.js                 # Random delay calculator (Gaussian)
|   |-- typing.js                # Fake typing burst generator
|   |-- idleBehavior.js          # Scroll/tap/swipe randomizer
|   |-- templatePicker.js        # Variant selection with weights
|   +-- lifecycle.js             # Active hours schedule
|-- state/
|   +-- conversationStore.js     # Per-customer state (in-memory)
|-- templates/
|   |-- menu.js                  # 5 welcome variants
|   |-- brochure.js              # 4 confirmation variants
|   |-- videos.js                # 4 confirmation variants
|   |-- both.js                  # 3 confirmation variants
|   +-- invalid.js               # 3 retry variants
|-- config/
|   |-- timing.js                # Delay ranges, typing speeds, probabilities
|   |-- behavior.js              # Idle behavior weights
|   +-- coordinates.js           # UI element positions (adjustable)
|-- .env
|-- .env.example
+-- package.json

Phone (Android - Termux):
/data/data/com.termux/files/home/mgh-bot-phone/
|-- phone-client.js              # WebSocket client + ADB executor + notification listener
|-- .env                         # PHONE_AUTH_TOKEN, VM_URL
+-- package.json
```

---

## Monthly Cost

| Item | Cost |
|---|---|
| Oracle Cloud VM (4 OCPU, 24GB RAM, 200GB) | **0** |
| Android phone (already owned) | **0** |
| WhatsApp (free app) | **0** |
| Tailscale (free tier) | **0** |
| **Total** | **0/month** |

---

## Comparison: All Three Approaches

| | Cloud API Bot | Phone-Only Bot | Phone + VM Hybrid |
|---|---|---|---|
| Monthly cost | 0 Meta + 500 hosting | 0 | 0 |
| Ban risk | None | Moderate | Moderate |
| Setup time | 2 days | 2 weeks | 2-3 weeks |
| Phone required | No | Yes (good phone) | Yes (any phone) |
| Always-on | VM only | Phone 24/7 | Both (VM always, phone mostly idle) |
| Reliability | High | Moderate | High (VM orchestrator is stable) |
| Maintenance | Low | High | Medium |
| Scaling | Easy (add webhooks) | Hard (1 phone = 1 number) | Hard (1 phone = 1 number) |
| Security | API keys in env, HTTPS | ADB over USB local only | Tailscale encrypted tunnel, zero open ports |

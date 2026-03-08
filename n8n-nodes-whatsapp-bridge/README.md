# WhatsApp Bridge n8n Node Package

[![npm version](https://badge.fury.io/js/n8n-nodes-whatsapp-bridge-xyz.svg)](https://www.npmjs.com/package/n8n-nodes-whatsapp-bridge-xyz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A professional n8n community node package for integrating WhatsApp messaging capabilities directly into your n8n workflows.

## 🚀 Quick Start

### Prerequisites

**Before installing this package, you MUST have the WhatsApp Bridge service running:**

The package requires a backend service running locally or remotely. You have two options:

#### Option 1: Docker (Recommended)
Download and run the Docker container:

```bash
git clone https://github.com/jonathanicq/whatsapp-n8n-bridge.git
cd whatsapp-n8n-bridge
docker compose up -d
```

**Docker Details:**
- Service runs on `http://localhost:4000`
- Includes MySQL, Redis, and Node.js services
- Requires: 512MB RAM, 1 core CPU (1GB/2 cores recommended)
- Chromium/Puppeteer included for WhatsApp automation

**GitHub Repository:** https://github.com/jonathanicq/whatsapp-n8n-bridge

#### Option 2: Local Installation
```bash
npm install
npm run dev  # Starts on http://localhost:4000
```

---

### Installing the n8n Node Package

#### Method 1: Via n8n UI (Recommended)

1. Open n8n: `http://192.168.0.116:5678`
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Search for `n8n-nodes-whatsapp-bridge-xyz`
5. Click **Install**
6. n8n will restart automatically

#### Method 2: Via npm

```bash
cd /path/to/your/n8n
npm install n8n-nodes-whatsapp-bridge-xyz
```

#### Method 3: Docker Mount

```bash
docker run -v ~/.n8n:/home/node/.n8n \
  -e NODE_PATH=/home/node/.n8n/node_modules \
  n8n/n8n
```

Then inside the container:
```bash
npm install n8n-nodes-whatsapp-bridge-xyz
```

---

## 🔧 Configuration

### Step 1: Create Credentials

1. Open any n8n workflow
2. Add a **WhatsApp Bridge** node
3. Click **Create Credentials** → **WhatsApp Bridge API**
4. Fill in the fields:

   | Field | Value | Example |
   |-------|-------|---------|
   | **Base URL** | Your Bridge service URL | `http://localhost:4000` |
   | **API Key** | (Optional) API key if configured | Leave empty if not required |

5. Save credentials

### Step 2: Use in Workflows

Now you can use the WhatsApp Bridge nodes in your workflows!

---

## 📋 Available Nodes

### 1. WhatsApp Bridge (Action Node)

Perform operations on the WhatsApp service.

**Operations:**

#### Send Message
Send an immediate WhatsApp message.
- **To**: Phone number in E.164 format (e.g., `+351910270614`)
- **Text**: Message content

```json
{
  "to": "+351910270614",
  "text": "Hello there!"
}
```

#### Queue Message
Queue a message for reliable delivery with automatic retries.
- **To**: Phone number
- **Text**: Message content

#### Get Status
Check the WhatsApp connection status.

**Response:**
```json
{
  "connected": true,
  "authenticated": true,
  "phoneNumber": "351910270614"
}
```

#### Get Webhooks
List all registered webhooks.

### 2. WhatsApp Bridge Trigger (Webhook Node)

Trigger workflows when WhatsApp messages are received.

**How it works:**
1. Activate the trigger
2. Service automatically registers webhook
3. When message arrives, workflow is triggered
4. Deactivate to unregister webhook

**Received Message Format:**
```json
{
  "id": "msg-123456",
  "from": "+351910270614",
  "text": "Hello from WhatsApp",
  "timestamp": "2026-03-08T12:00:00Z",
  "type": "text"
}
```

---

## 💡 Workflow Examples

### Example 1: Send a Message on Demand

```
Manual Trigger
  ↓
WhatsApp Bridge (Send Message)
  - To: +351910270614
  - Text: "Hello There"
  ↓
Notification Node (Success)
```

### Example 2: Auto-Reply to Messages

```
WhatsApp Bridge Trigger (Webhook)
  ↓
Extract Sender: {{ $json.from }}
  ↓
WhatsApp Bridge (Send Message)
  - To: {{ $json.from }}
  - Text: "Thanks for your message! We'll respond soon."
```

### Example 3: Forward to External API

```
WhatsApp Bridge Trigger
  ↓
HTTP Request (POST to your API)
  ↓
Process Response
  ↓
WhatsApp Bridge (Send Message - Reply)
```

---

## ⚠️ Troubleshooting

### "Connection refused"
**Problem:** Can't connect to Bridge service
**Solution:**
- Verify Bridge is running: `curl http://localhost:4000/health`
- Check firewall settings
- Ensure correct Base URL in credentials

### "Credentials not found"
**Problem:** Node says credentials missing
**Solution:**
- Create new credentials (Settings → Community Nodes → Manage)
- Verify credentials are selected in the node
- Test connection by clicking node settings

### "Phone number format error"
**Problem:** Message failed to send
**Solution:**
- Use E.164 format: `+[country-code][number]`
- Example: `+351910270614` (Portugal)
- Remove spaces or dashes

### "Webhook registration failed"
**Problem:** Trigger won't activate
**Solution:**
- Check Bridge service logs
- Verify n8n instance is reachable
- Ensure API Key (if required) is correct
- Check network connectivity

### "Message says queued but not sent"
**Problem:** Messages not being delivered
**Solution:**
- Check WhatsApp authentication: Use "Get Status" operation
- Verify phone number format
- Check Bridge service logs for errors
- Ensure message text is not empty

---

## 🐛 Getting Help & Reporting Issues

### Found a Bug?

Create an issue on GitHub:

**Steps:**
1. Go to: https://github.com/jonathanicq/whatsapp-n8n-bridge/issues
2. Click **New Issue**
3. Provide:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (n8n version, OS, Docker version)
   - Error logs (if available)

### Feature Requests

Open a GitHub Discussion or Issue with:
- Use case
- Expected behavior
- Why it would be useful

### Need Help?

1. **Check existing issues:** https://github.com/jonathanicq/whatsapp-n8n-bridge/issues
2. **Read the documentation:** https://github.com/jonathanicq/whatsapp-n8n-bridge#documentation
3. **Create an issue** with the `[help]` tag for guidance

---

## 🔐 Security

- ✅ API credentials stored securely in n8n
- ✅ Webhook signatures verified with HMAC-SHA256
- ✅ No sensitive data logged
- ✅ HTTPS support in production
- ✅ Secrets never exposed in logs

---

## 📦 What's Included

- **WhatsApp Bridge Node** - Action node for sending messages
- **WhatsApp Bridge Trigger** - Webhook trigger for incoming messages
- **WhatsApp Bridge API Credentials** - Secure credential management
- **Full TypeScript support** - Type definitions included
- **Complete documentation** - Inline help and examples

---

## 📋 Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| n8n | 1.0+ | Works with n8n 1.0 and later |
| Node.js | 20+ | For bridge service |
| Docker | Latest | For running bridge service |
| RAM | 512MB | Minimum (1GB recommended) |
| Storage | 500MB | For dependencies and session |

---

## 📄 License

MIT License - See LICENSE for details

---

## 🔗 Useful Links

- **Bridge Service Repository:** https://github.com/jonathanicq/whatsapp-n8n-bridge
- **Issue Tracker:** https://github.com/jonathanicq/whatsapp-n8n-bridge/issues
- **n8n Documentation:** https://docs.n8n.io
- **n8n Nodes Guide:** https://docs.n8n.io/integrations/creating-nodes/

---

## 💬 Questions?

- 📍 **Issues & Bugs:** GitHub Issues
- 📚 **Documentation:** Repository README
- 🆘 **Help:** Create an issue with `[help]` tag

---

**Made with ❤️ for the n8n community**

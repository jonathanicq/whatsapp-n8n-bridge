# n8n-nodes-whatsapp-bridge

A custom n8n community node package for interacting with the WhatsApp Bridge service directly from n8n workflows.

## Installation

### Option 1: Via n8n Community Nodes UI (Recommended)
1. Open n8n at `http://192.168.0.116:5678`
2. Click **Settings** → **Community Nodes**
3. Click **Install** and search for `n8n-nodes-whatsapp-bridge`
4. Click **Install**
5. n8n will restart and load the nodes automatically

### Option 2: Manual Installation
Copy the `dist/` folder contents to your n8n custom nodes directory:

```bash
cp -r dist/* ~/.n8n/custom/
# or in Docker:
docker cp dist/* <n8n-container>:/home/node/.n8n/custom/
docker exec <n8n-container> npm restart
```

## Nodes

### WhatsApp Bridge (Action Node)

Send WhatsApp messages, queue messages for delivery, check connection status, or list registered webhooks.

**Operations:**
- **Send Message** - Send a message immediately
  - Phone Number (E.164 format, e.g., `+1234567890`)
  - Message Text

- **Queue Message** - Queue a message for reliable delivery with retries
  - Phone Number
  - Message Text

- **Get Status** - Check WhatsApp connection status
  - Returns: `connected`, `sessionId`, `qrRequired`

- **Get Webhooks** - List all registered webhooks
  - Returns: array of webhook objects with id, name, url

**Example Workflow:**
```
Input → WhatsApp Bridge (sendMessage) → Output
```

### WhatsApp Bridge Trigger

Webhook trigger that fires when a WhatsApp message is received. Automatically registers and deregisters webhooks with the Bridge service.

**Trigger Activation:**
- Registers a webhook URL with the Bridge service
- Stores webhook ID for later cleanup
- Verifies incoming messages with HMAC-SHA256 signature

**Incoming Message Data:**
```json
{
  "messageId": "msg-12345",
  "sender": "+1234567890",
  "text": "Hello from WhatsApp",
  "type": "text",
  "timestamp": "2026-03-07T12:00:00Z"
}
```

**Example Workflow:**
```
WhatsApp Bridge Trigger → Log Message → Send Reply (via WhatsApp Bridge node)
```

## Configuration

### Credentials: WhatsApp Bridge API

Required fields:
- **Base URL** - WhatsApp Bridge service URL (e.g., `http://192.168.0.116:3000`)
- **API Key** - API key for authentication

Store credentials in n8n:
1. Open any workflow
2. Click on any WhatsApp Bridge node
3. Select "Create New" under Credentials
4. Fill in Base URL and API Key
5. Click "Create"

## Usage Examples

### Send a Message

1. Create a workflow
2. Add a **Trigger** node (e.g., Manual or Webhook)
3. Add **WhatsApp Bridge** node
4. Select operation: **Send Message**
5. Configure credentials
6. Set Phone Number: `+1234567890`
7. Set Message Text: `Hello!`
8. Click Execute

### Receive Messages and Reply

1. Create a workflow
2. Add **WhatsApp Bridge Trigger** node
3. Configure credentials
4. Click **Activate** (workflow will register webhook)
5. Add **WhatsApp Bridge** node (Send Message operation)
6. Set Phone Number: `{{ $json.sender }}`
7. Set Message Text: `Thanks for your message!`
8. Click Execute
9. Send a WhatsApp message to the connected number
10. Workflow triggers and sends reply

### Check Connection Status

1. Add **WhatsApp Bridge** node
2. Select operation: **Get Status**
3. Configure credentials
4. Click Execute
5. Output shows connection status

## API Response Examples

### Send Message Response
```json
{
  "messageId": "msg-abc123",
  "status": "sent",
  "timestamp": "2026-03-07T12:00:00Z"
}
```

### Queue Message Response
```json
{
  "messageId": "msg-xyz789",
  "status": "queued",
  "queuedAt": "2026-03-07T12:00:00Z",
  "attempts": 0
}
```

### Get Status Response
```json
{
  "connected": true,
  "sessionId": "session-abc123",
  "qrRequired": false
}
```

## Troubleshooting

### "Credentials not found"
- Ensure you've created and selected WhatsApp Bridge API credentials in the node
- Verify Base URL and API Key are correct

### "Message failed to send"
- Check that the phone number is in E.164 format (e.g., `+1234567890`)
- Verify the WhatsApp Bridge service is running and accessible
- Check Bridge logs for connection errors

### "Webhook registration failed"
- Ensure n8n instance is publicly accessible (for external webhooks)
- Check that the Base URL points to the correct Bridge service
- Verify API Key is valid

### "Trigger not firing"
- Activate the workflow (click the toggle in the top-right)
- Check that webhook is registered: call `GET /webhooks` on Bridge service
- Verify webhook URL is correct (should match n8n webhook URL)
- Send a test WhatsApp message to the connected number

## File Structure

```
n8n-nodes-whatsapp-bridge/
├── credentials/
│   └── WhatsAppBridgeApi.credentials.ts
├── nodes/
│   └── WhatsAppBridge/
│       ├── WhatsAppBridge.node.ts          # Action node
│       ├── WhatsAppBridgeTrigger.node.ts   # Trigger node
│       ├── GenericFunctions.ts             # Shared HTTP helper
│       └── whatsapp.svg                    # Node icon
├── tests/
│   └── basic.test.ts                       # Smoke tests
├── index.ts                                # Entry point
├── package.json                            # Package metadata
├── tsconfig.json                           # TypeScript config
└── README.md                               # This file
```

## Development

### Build from source
```bash
npm install
npm run build
npm test
```

### Testing
```bash
npm test                  # Run smoke tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Security

- API keys are stored securely in n8n credentials
- Webhook signatures are verified with HMAC-SHA256
- No sensitive data is logged
- All communication uses HTTPS (in production)

## License

MIT

## Support

For issues or questions:
1. Check the Bridge service logs: `/opt/aiDeveloper/projects/whatsapp-n8n-bridge/`
2. Verify credentials and network connectivity
3. Check n8n execution logs in the workflow UI

## Related

- [WhatsApp Bridge Project](https://github.com/jonathanicq/whatsapp-n8n-bridge)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Nodes](https://n8n.io/docs/integrations/creating-nodes/)

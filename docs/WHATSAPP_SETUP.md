# WhatsApp Integration Setup Guide

## Overview

This guide explains how to set up and use the WhatsApp integration in the WhatsApp-n8n Bridge service. The integration uses the Baileys library to connect to WhatsApp Web and expose REST APIs for message handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsApp Web (Browser)                        │
│                   (Via Baileys Library)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  WhatsAppService                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Initialize connection via Baileys                        │ │
│  │ • Manage QR code generation                               │ │
│  │ • Handle authentication state                             │ │
│  │ • Listen for incoming messages                            │ │
│  │ • Manage reconnection with exponential backoff            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼────────┐
│ SessionMgr   │  │  MessageParser  │  │  RedisCache  │
│ • Load/Save  │  │  • Parse msgs   │  │  • Sessions  │
│ • Auth state │  │  • Type detect  │  │  • QR codes  │
└──────────────┘  └─────────────────┘  └──────────────┘
        │
┌───────▼──────────────────────────────────────────────┐
│              REST API Endpoints                       │
│  • GET  /whatsapp/qr     - Get QR code             │
│  • GET  /whatsapp/status - Get connection status    │
│  • POST /whatsapp/logout - Logout from WhatsApp    │
└───────────────────────────────────────────────────────┘
```

## Getting Started

### 1. Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Redis instance running
- MySQL instance running

### 2. Installation

The WhatsApp integration is already included in the service. Dependencies are installed via:

```bash
npm install baileys qrcode uuid
```

### 3. Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Configuration
WHATSAPP_SESSION_NAME=whatsapp-bridge
WHATSAPP_LOG_LEVEL=info

# Database (for session storage)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=whatsapp_db

# Redis (for session caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## API Reference

### GET /whatsapp/qr

Retrieve the current QR code for WhatsApp authentication.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "qr": "data:image/png;base64,...",
    "qrText": "2@ABCD1234...",
    "expiresIn": 60
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "NO_QR_CODE",
    "message": "QR code not available. Service may already be authenticated."
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Use Case:**
- Display QR code to user for WhatsApp authentication
- User scans with their WhatsApp mobile app
- Session is authenticated automatically

### GET /whatsapp/status

Get the current WhatsApp connection and authentication status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "authenticated": true,
    "phoneNumber": "1234567890",
    "reconnectAttempts": 0
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Status Fields:**
- `connected`: Socket is connected to WhatsApp
- `authenticated`: User has successfully authenticated (QR scanned)
- `phoneNumber`: The authenticated phone number
- `reconnectAttempts`: Number of failed reconnection attempts

### POST /whatsapp/logout

Logout from WhatsApp and clear the session.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": {
    "code": "LOGOUT_ERROR",
    "message": "Failed to logout"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Session Management

### How Sessions Work

1. **Session Storage**: User sessions are stored in Redis with a 7-day TTL
2. **Authentication State**: Stores Baileys authentication credentials
3. **Auto-Reconnection**: Failed connections retry with exponential backoff:
   - 1st attempt: 1 second
   - 2nd attempt: 2 seconds
   - 3rd attempt: 5 seconds
   - 4th attempt: 10 seconds
   - 5th attempt: 30 seconds (max)

### Session Data Structure

```typescript
interface WhatsAppSession {
  sessionName: string;           // Unique session identifier
  phoneNumber?: string;          // Authenticated phone number
  isConnected: boolean;          // Current connection status
  isAuthenticated: boolean;      // Authentication status
  createdAt: number;             // Session creation timestamp
  lastConnected?: number;        // Last successful connection
  authState?: Record<string, unknown>; // Baileys auth credentials
}
```

## Message Handling

### Supported Message Types

- **Text**: Regular text messages and extended text
- **Image**: Images with optional captions
- **Audio**: Voice messages and audio files
- **Video**: Video messages
- **Document**: Files and documents
- **Sticker**: Sticker messages

### Message Processing Flow

```
WhatsApp Message
        ↓
    Baileys Event
        ↓
   parseMessage()
        ↓
 toWhatsAppMessage()
        ↓
  Emit 'message' Event
        ↓
  n8n Integration (Future)
```

### Message Data Structure

```typescript
interface WhatsAppMessage {
  messageId: string;      // Unique message identifier
  sender: string;         // Sender's phone number
  timestamp: number;      // Message timestamp (ms)
  type: MessageType;      // text, image, audio, video, document, sticker
  text?: string;          // Message text content
  caption?: string;       // Image/video caption
  mediaUrl?: string;      // Media file URL
  mediaType?: string;     // MIME type
  isGroup: boolean;       // Is this a group message
  groupId?: string;       // Group identifier (if group message)
  fromMe: boolean;        // Is this our own message
  status: string;         // received, sent, read
}
```

## Development & Testing

### Running Tests

```bash
# Run all WhatsApp tests
npm test -- tests/unit/services/session-manager.unit.test.ts \
            tests/unit/utils/message-parser.unit.test.ts \
            tests/integration/whatsapp.integration.test.ts

# Run specific test file
npm test -- tests/integration/whatsapp.integration.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Coverage

- **Session Manager**: Create, load, update, and delete sessions
- **Message Parser**: Parse various message types, extract content
- **API Endpoints**: QR code retrieval, status checks, logout

### Debugging

Enable debug logging by setting environment variables:

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

Logs include:
- WhatsApp connection events
- QR code generation
- Message receipts
- Session state changes
- Reconnection attempts

## Integration with n8n

### Future Workflow Integration

The WhatsApp service emits events that can be consumed by n8n:

```javascript
whatsAppService.on('message', (message) => {
  // Trigger n8n webhook
  // Process message through workflow
  // Send reply if needed
});

whatsAppService.on('connected', () => {
  // Update status in n8n
});

whatsAppService.on('logout', () => {
  // Clean up in n8n
});
```

## Common Issues & Solutions

### Issue: "QR code not available"
**Cause**: Session is already authenticated
**Solution**: Use `POST /whatsapp/logout` to clear session, then `GET /whatsapp/qr` for new QR

### Issue: Service keeps disconnecting
**Cause**: Network issues or WhatsApp Web update
**Solution**:
- Check internet connection
- Monitor `reconnectAttempts` in status
- Max 5 attempts before service stops (manually restart required)

### Issue: Messages not being received
**Cause**: Session may have been logged out
**Solution**:
- Check status with `GET /whatsapp/status`
- Verify `authenticated: true`
- Rescan QR code if needed

## Performance Considerations

### Resource Usage
- **Memory**: ~100-200MB per active session
- **Redis**: ~1-2MB per session storage
- **CPU**: Minimal, event-driven

### Scaling
- Single instance supports multiple sessions
- Each session is independent
- Sessions persist across server restarts (stored in Redis)

## Security Notes

⚠️ **Important**:
- Never log auth state or credentials
- QR codes expire after 60 seconds
- Sessions stored in Redis should have encrypted values
- Phone numbers are sensitive data - handle carefully

## Architecture Patterns

### Event-Driven Design

```typescript
whatsAppService extends EventEmitter

Events:
- 'qr': QR code generated
- 'connected': Connection established
- 'authenticated': Authentication successful
- 'message': New message received
- 'logout': User logged out
- 'reconnect_failed': Max reconnection attempts reached
```

### Error Handling

```
Connection Error
  ↓
Automatic Reconnect (with backoff)
  ↓
Max Attempts Reached?
  ├─ Yes: Emit 'reconnect_failed'
  └─ No: Schedule next attempt
```

## References

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Web API](https://web.whatsapp.com)
- [QR Code Library](https://github.com/davidshimjs/qrcodejs)

## Next Steps

1. Implement send message endpoint
2. Add webhook callbacks for received messages
3. Integrate with n8n automation workflows
4. Add database persistence layer
5. Implement rate limiting and quotas

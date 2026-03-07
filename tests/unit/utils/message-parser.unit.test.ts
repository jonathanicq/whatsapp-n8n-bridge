/**
 * Message parser unit tests
 */

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}));

import { parseMessage, toWhatsAppMessage } from "../../../src/utils/message-parser";

jest.mock("../../../src/config/logger");

describe("Message Parser", () => {
  describe("parseMessage", () => {
    it("should parse text message correctly", () => {
      const baileyMsg = {
        key: {
          remoteJid: "1234567890@s.whatsapp.net",
          id: "msg-123",
          fromMe: false,
        },
        message: {
          conversation: "Hello World",
        },
        messageTimestamp: 1234567890,
      };

      const parsed = parseMessage(baileyMsg);

      expect(parsed).toBeTruthy();
      expect(parsed?.sender).toBe("1234567890");
      expect(parsed?.messageId).toBe("msg-123");
      expect(parsed?.type).toBe("text");
      expect(parsed?.content.text).toBe("Hello World");
      expect(parsed?.metadata.isGroup).toBe(false);
      expect(parsed?.metadata.fromMe).toBe(false);
    });

    it("should parse group message correctly", () => {
      const baileyMsg = {
        key: {
          remoteJid: "120363000000000000@g.us",
          id: "msg-456",
          fromMe: false,
        },
        message: {
          conversation: "Group message",
        },
        messageTimestamp: 1234567890,
      };

      const parsed = parseMessage(baileyMsg);

      expect(parsed).toBeTruthy();
      expect(parsed?.metadata.isGroup).toBe(true);
    });

    it("should parse extended text message", () => {
      const baileyMsg = {
        key: {
          remoteJid: "1234567890@s.whatsapp.net",
          id: "msg-789",
          fromMe: false,
        },
        message: {
          extendedTextMessage: {
            text: "Extended text",
          },
        },
        messageTimestamp: 1234567890,
      };

      const parsed = parseMessage(baileyMsg);

      expect(parsed?.type).toBe("text");
      expect(parsed?.content.text).toBe("Extended text");
    });

    it("should parse image message", () => {
      const baileyMsg = {
        key: {
          remoteJid: "1234567890@s.whatsapp.net",
          id: "msg-img",
          fromMe: false,
        },
        message: {
          imageMessage: {
            caption: "Nice image",
            mimetype: "image/jpeg",
          },
        },
        messageTimestamp: 1234567890,
      };

      const parsed = parseMessage(baileyMsg);

      expect(parsed?.type).toBe("image");
      expect(parsed?.content.caption).toBe("Nice image");
      expect(parsed?.content.media?.mimeType).toBe("image/jpeg");
    });

    it("should parse audio message", () => {
      const baileyMsg = {
        key: {
          remoteJid: "1234567890@s.whatsapp.net",
          id: "msg-audio",
          fromMe: false,
        },
        message: {
          audioMessage: {
            mimetype: "audio/ogg",
          },
        },
        messageTimestamp: 1234567890,
      };

      const parsed = parseMessage(baileyMsg);

      expect(parsed?.type).toBe("audio");
      expect(parsed?.content.media?.mimeType).toBe("audio/ogg");
    });

    it("should return null for invalid message", () => {
      const baileyMsg = {
        key: null,
        message: null,
      };

      const parsed = parseMessage(baileyMsg);

      expect(parsed).toBeNull();
    });

    it("should return null for messages with missing key or message", () => {
      const baileyMsg1 = {
        key: { remoteJid: "123" },
        message: null,
      };

      expect(parseMessage(baileyMsg1)).toBeNull();

      const baileyMsg2 = {
        key: null,
        message: { conversation: "text" },
      };

      expect(parseMessage(baileyMsg2)).toBeNull();
    });
  });

  describe("toWhatsAppMessage", () => {
    it("should convert parsed message to WhatsApp message format", () => {
      const baileyMsg = {
        key: {
          remoteJid: "1234567890@s.whatsapp.net",
          id: "msg-123",
          fromMe: false,
        },
        message: {
          conversation: "Test message",
        },
        messageTimestamp: 1234567890,
      };

      const parsed = parseMessage(baileyMsg);
      expect(parsed).toBeTruthy();

      const whatsAppMsg = toWhatsAppMessage(parsed!);

      expect(whatsAppMsg.messageId).toBe("msg-123");
      expect(whatsAppMsg.sender).toBe("1234567890");
      expect(whatsAppMsg.text).toBe("Test message");
      expect(whatsAppMsg.type).toBe("text");
      expect(whatsAppMsg.status).toBe("received");
      expect(whatsAppMsg.isGroup).toBe(false);
      expect(whatsAppMsg.fromMe).toBe(false);
    });
  });
});

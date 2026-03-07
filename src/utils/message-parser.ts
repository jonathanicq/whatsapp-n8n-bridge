/**
 * Parse Baileys message objects into standard format
 */

import { v4 as uuidv4 } from "uuid";
import { MessageType, ParsedMessage, WhatsAppMessage } from "../models/whatsapp-message";
import { logDebug } from "../config/logger";

/**
 * Parse Baileys message into standard format
 */
export function parseMessage(baileysMesage: Record<string, unknown>): ParsedMessage | null {
  try {
    const key = baileysMesage.key as Record<string, unknown>;
    const message = baileysMesage.message as Record<string, unknown>;

    if (!key || !message) {
      return null;
    }

    const sender = (key.remoteJid as string)?.split("@")[0] || "unknown";
    const messageId = (key.id as string) || uuidv4();
    const timestamp = (baileysMesage.messageTimestamp as number) || Date.now();
    const isGroup = (key.remoteJid as string)?.endsWith("@g.us") || false;
    const fromMe = (key.fromMe as boolean) || false;

    // Determine message type and extract content
    const type = getMessageType(message);
    const content = extractMessageContent(message, type);

    const parsed: ParsedMessage = {
      messageId,
      sender,
      timestamp,
      type,
      content,
      metadata: {
        isGroup,
        fromMe,
      },
    };

    logDebug("Message parsed", {
      messageId,
      type,
      sender,
      isGroup,
    });

    return parsed;
  } catch (error) {
    logDebug("Failed to parse message", { error });
    return null;
  }
}

/**
 * Determine message type
 */
function getMessageType(message: Record<string, unknown>): MessageType {
  if (message.conversation) return "text";
  if (message.extendedTextMessage) return "text";
  if (message.imageMessage) return "image";
  if (message.audioMessage) return "audio";
  if (message.videoMessage) return "video";
  if (message.documentMessage) return "document";
  if (message.stickerMessage) return "sticker";

  return "unknown";
}

/**
 * Extract message content based on type
 */
function extractMessageContent(
  message: Record<string, unknown>,
  type: MessageType,
): ParsedMessage["content"] {
  const content: ParsedMessage["content"] = {
    media: {
      type: type,
    },
  };

  switch (type) {
  case "text": {
    const text =
        (message.conversation as string) ||
        ((message.extendedTextMessage as Record<string, unknown>)?.text as string) ||
        "";
    content.text = text;
    break;
  }

  case "image": {
    const imageMsg = message.imageMessage as Record<string, unknown>;
    if (imageMsg) {
      content.caption = imageMsg.caption as string;
        content.media!.mimeType = imageMsg.mimetype as string;
    }
    break;
  }

  case "audio": {
    const audioMsg = message.audioMessage as Record<string, unknown>;
    if (audioMsg) {
        content.media!.mimeType = audioMsg.mimetype as string;
    }
    break;
  }

  case "document": {
    const docMsg = message.documentMessage as Record<string, unknown>;
    if (docMsg) {
        content.media!.mimeType = docMsg.mimetype as string;
        content.media!.url = docMsg.url as string;
    }
    break;
  }

  default:
    break;
  }

  return content;
}

/**
 * Convert ParsedMessage to WhatsAppMessage format
 */
export function toWhatsAppMessage(parsed: ParsedMessage): WhatsAppMessage {
  return {
    messageId: parsed.messageId,
    sender: parsed.sender,
    timestamp: parsed.timestamp,
    type: parsed.type,
    text: parsed.content.text,
    caption: parsed.content.caption,
    mediaUrl: parsed.content.media?.url,
    mediaType: parsed.content.media?.type,
    isGroup: parsed.metadata.isGroup,
    groupId: parsed.metadata.groupId,
    fromMe: parsed.metadata.fromMe,
    status: "received",
  };
}

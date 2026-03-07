/**
 * WhatsApp message types and interfaces
 */

export type MessageType = "text" | "image" | "audio" | "video" | "document" | "sticker" | "unknown";

export interface WhatsAppMessage {
  messageId: string;
  sender: string;
  timestamp: number;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  fileName?: string;
  caption?: string;
  isGroup: boolean;
  groupId?: string;
  groupName?: string;
  fromMe: boolean;
  quotedMessageId?: string;
  status: "received" | "sent" | "read";
  rawMessage?: unknown; // Raw Baileys message object
}

export interface MessageMetadata {
  id: string;
  timestamp: number;
  sender: string;
  isGroup: boolean;
}

export interface ParsedMessage {
  messageId: string;
  sender: string;
  senderName?: string;
  timestamp: number;
  type: MessageType;
  content: {
    text?: string;
    media?: {
      url?: string;
      type: string;
      mimeType?: string;
    };
    caption?: string;
  };
  metadata: {
    isGroup: boolean;
    groupId?: string;
    groupName?: string;
    fromMe: boolean;
  };
}

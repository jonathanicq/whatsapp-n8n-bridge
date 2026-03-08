/**
 * MessageQueue - Manages received WhatsApp messages
 *
 * Stores messages in memory with timestamp-based retrieval
 * Maintains message ordering and enforces size limits
 */

export interface StoredMessage {
  id: string;
  from: string;
  fromName: string;
  body: string;
  timestamp: number;
  isFromMe: boolean;
}

export class MessageQueue {
  private messages: StoredMessage[] = [];
  private readonly MAX_MESSAGES = 1000;

  /**
   * Add a message to the queue
   */
  addMessage(message: StoredMessage): void {
    this.messages.push(message);

    // Enforce maximum message limit (FIFO - remove oldest)
    if (this.messages.length > this.MAX_MESSAGES) {
      this.messages.shift();
    }

    console.log(`[QUEUE] Message added from ${message.from}. Queue size: ${this.messages.length}`);
  }

  /**
   * Get all messages since a given timestamp
   * @param since - Unix timestamp in milliseconds
   * @returns Array of messages with timestamps greater than 'since'
   */
  getNewMessages(since: number): StoredMessage[] {
    if (since <= 0) {
      // If since is 0 or invalid, return all messages
      return [...this.messages];
    }

    const newMessages = this.messages.filter((msg) => msg.timestamp > since);
    return newMessages;
  }

  /**
   * Get message history with pagination
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip from the beginning
   * @returns Paginated messages
   */
  getMessageHistory(limit: number = 50, offset: number = 0) {
    const start = Math.max(0, this.messages.length - offset - limit);
    const end = Math.max(0, this.messages.length - offset);

    return {
      total: this.messages.length,
      messages: this.messages.slice(start, end),
      limit,
      offset,
    };
  }

  /**
   * Get the latest message timestamp (for cursor-based pagination)
   * @returns Latest timestamp or 0 if queue is empty
   */
  getLatestTimestamp(): number {
    if (this.messages.length === 0) {
      return 0;
    }

    return this.messages[this.messages.length - 1].timestamp;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      totalMessages: this.messages.length,
      maxCapacity: this.MAX_MESSAGES,
      utilizationPercent: Math.round((this.messages.length / this.MAX_MESSAGES) * 100),
      oldestMessage: this.messages.length > 0 ? this.messages[0].timestamp : null,
      newestMessage: this.getLatestTimestamp(),
    };
  }

  /**
   * Clear all messages from queue
   */
  clear(): void {
    this.messages = [];
    console.log("[QUEUE] Message queue cleared");
  }

  /**
   * Get all messages (for debugging)
   */
  getAllMessages(): StoredMessage[] {
    return [...this.messages];
  }
}

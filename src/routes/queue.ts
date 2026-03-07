/**
 * Queue routes for message queuing API
 */

import { Router } from "express";
import {
  queueSendMessage,
  getMessageStatus,
  getPendingMessages,
  cancelMessage,
} from "../controllers/queue-controller";

const router = Router();

/**
 * POST /queue/send - Queue a new message for sending
 */
router.post("/send", queueSendMessage);

/**
 * GET /queue/status/:messageId - Get message status and attempt history
 */
router.get("/status/:messageId", getMessageStatus);

/**
 * GET /queue/pending - Get all pending messages
 */
router.get("/pending", getPendingMessages);

/**
 * DELETE /queue/:messageId - Cancel a pending message
 */
router.delete("/:messageId", cancelMessage);

export default router;

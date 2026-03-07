/**
 * WhatsApp routes
 */

import { Router } from "express";
import { getQRCode, getStatus, sendMessage, logout } from "../controllers/whatsapp-controller";

const router = Router();

/**
 * GET /whatsapp/qr - Get current QR code
 */
router.get("/qr", getQRCode);

/**
 * GET /whatsapp/status - Get WhatsApp connection status
 */
router.get("/status", getStatus);

/**
 * POST /whatsapp/send - Send a message
 */
router.post("/send", sendMessage);

/**
 * POST /whatsapp/logout - Logout from WhatsApp
 */
router.post("/logout", logout);

export default router;

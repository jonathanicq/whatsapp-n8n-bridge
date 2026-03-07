/**
 * WhatsApp routes
 */

import { Router } from "express";
import { getQRCode, getStatus, logout } from "../controllers/whatsapp-controller";

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
 * POST /whatsapp/logout - Logout from WhatsApp
 */
router.post("/logout", logout);

export default router;

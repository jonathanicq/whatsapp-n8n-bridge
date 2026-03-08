/**
 * WhatsApp controller - handle API endpoints
 * Uses direct whatsapp-web.js integration via WhatsAppService
 */

import { Request, Response } from "express";
import QRCode from "qrcode";
import { getConfig } from "../config/environment";
import { getWhatsAppService } from "../services/whatsapp-service";
import { logInfo, logError } from "../config/logger";
import { ApiResponse, SendMessageRequest, SendMessageResponse } from "../utils/types";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";
import { validateSendMessageRequest } from "../utils/validators";

/**
 * GET /api/whatsapp/qr - Get current QR code
 */
export async function getQRCode(
  _req: Request,
  res: Response<ApiResponse<unknown>>,
): Promise<void> {
  try {
    const config = getConfig();
    const service = getWhatsAppService(config.wa.sessionName, config.wa.headless);

    const qr = service.getQRCode();

    if (!qr) {
      logInfo("QR code requested but not available (may be authenticated)");
      res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          code: "NO_QR_CODE",
          message: "QR code not available. Service may already be authenticated.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Generate QR code as data URI
    const qrDataUrl = await QRCode.toDataURL(qr, {
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    logInfo("QR code retrieved");

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        qr: qrDataUrl,
        qrText: qr,
        expiresIn: 60, // seconds
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to get QR code", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: API_ERRORS.QR_CODE_ERROR,
        message: "Failed to get QR code",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/whatsapp/status - Get WhatsApp status
 */
export async function getStatus(
  _req: Request,
  res: Response<ApiResponse<unknown>>,
): Promise<void> {
  try {
    const config = getConfig();
    const service = getWhatsAppService(config.wa.sessionName, config.wa.headless);

    const status = service.getStatus();

    logInfo("WhatsApp status retrieved", {
      connected: status.connected,
      authenticated: status.authenticated,
    });

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to get WhatsApp status", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: API_ERRORS.STATUS_ERROR,
        message: "Failed to get WhatsApp status",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/whatsapp/logout - Logout from WhatsApp
 */
export async function logout(
  _req: Request,
  res: Response<ApiResponse<unknown>>,
): Promise<void> {
  try {
    const config = getConfig();
    const service = getWhatsAppService(config.wa.sessionName, config.wa.headless);

    await service.logout();

    logInfo("WhatsApp session logged out");

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: { message: "Logged out successfully" },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to logout from WhatsApp", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: API_ERRORS.LOGOUT_ERROR,
        message: "Failed to logout",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/whatsapp/send - Send a message
 */
export async function sendMessage(
  req: Request<unknown, unknown, SendMessageRequest>,
  res: Response<ApiResponse<SendMessageResponse>>,
): Promise<void> {
  try {
    // Validate request
    const validation = validateSendMessageRequest(req.body);
    if (!validation.valid && validation.error) {
      logInfo("Message validation failed", {
        code: validation.error.code,
        message: validation.error.message,
      });

      res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          code: validation.error.code,
          message: validation.error.message,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { to, text } = req.body;
    const config = getConfig();
    const service = getWhatsAppService(config.wa.sessionName, config.wa.headless);

    // Check status
    const status = service.getStatus();
    if (!status.authenticated) {
      res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          code: API_ERRORS.PROVIDER_NOT_AUTHENTICATED,
          message: "WhatsApp is not authenticated",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Send message
    const messageId = await service.sendMessage(to, text);

    logInfo("Message sent successfully", {
      to,
      messageId,
      textLength: text.length,
    });

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        messageId,
        to,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to send message", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: API_ERRORS.SEND_FAILED,
        message: "Failed to send message",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

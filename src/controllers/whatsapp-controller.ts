/**
 * WhatsApp controller - handle API endpoints
 */

import { Request, Response } from "express";
import QRCode from "qrcode";
import { getWhatsAppService } from "../services/whatsapp-service";
import { logInfo, logError } from "../config/logger";
import { ApiResponse, SendMessageRequest, SendMessageResponse } from "../utils/types";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";
import { validateSendMessageRequest } from "../utils/validators";

/**
 * GET /whatsapp/qr - Get current QR code
 */
export async function getQRCode(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const service = getWhatsAppService();
    const qr = service.getQRCode();

    if (!qr) {
      logInfo("QR code requested but not available");
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
        qrText: qr, // Raw QR text for terminal scanning
        expiresIn: 60, // seconds
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to generate QR code", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "QR_CODE_ERROR",
        message: "Failed to generate QR code",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /whatsapp/status - Get WhatsApp status
 */
export async function getStatus(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const service = getWhatsAppService();
    const status = service.getStatus();

    logInfo("WhatsApp status retrieved", status);

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
        code: "STATUS_ERROR",
        message: "Failed to get WhatsApp status",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /whatsapp/logout - Logout WhatsApp
 */
export async function logout(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const service = getWhatsAppService();
    await service.logout();

    logInfo("WhatsApp logout initiated");

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: { message: "Logged out successfully" },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to logout", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "LOGOUT_ERROR",
        message: "Failed to logout",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /whatsapp/send - Send a message
 */
export async function sendMessage(
  req: Request<unknown, unknown, SendMessageRequest>,
  res: Response<ApiResponse<SendMessageResponse>>,
): Promise<void> {
  try {
    // Validate request
    const validation = validateSendMessageRequest(req.body);
    if (!validation.valid && validation.error) {
      const statusCode =
        validation.error.code === API_ERRORS.MESSAGE_TOO_LONG
          ? HTTP_CODES.BAD_REQUEST
          : HTTP_CODES.BAD_REQUEST;

      logInfo("Message validation failed", {
        code: validation.error.code,
        message: validation.error.message,
      });

      res.status(statusCode).json({
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
    const service = getWhatsAppService();

    // Check connection status
    const status = service.getStatus();
    if (!status.connected) {
      logInfo("Send message failed: provider not connected");

      res.status(HTTP_CODES.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: API_ERRORS.PROVIDER_NOT_CONNECTED,
          message: "WhatsApp provider is not connected",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!status.authenticated) {
      logInfo("Send message failed: provider not authenticated");

      res.status(HTTP_CODES.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: API_ERRORS.PROVIDER_NOT_AUTHENTICATED,
          message: "WhatsApp provider is not authenticated. Please scan QR code first.",
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

/**
 * WhatsApp controller - handle API endpoints
 * Uses WAHA (WhatsApp HTTP API) for all WhatsApp operations
 */

import { Request, Response } from "express";
import QRCode from "qrcode";
import { getConfig } from "../config/environment";
import { WAHAClient } from "../services/waha-client";
import { logInfo, logError } from "../config/logger";
import { ApiResponse, SendMessageRequest, SendMessageResponse } from "../utils/types";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";
import { validateSendMessageRequest } from "../utils/validators";

// Initialize WAHA client
let wahaClient: WAHAClient | null = null;

function getWAHAClient(): WAHAClient {
  if (!wahaClient) {
    const config = getConfig();
    wahaClient = new WAHAClient(config.waha.host, config.waha.port, config.waha.apiKey);
  }
  return wahaClient;
}

/**
 * GET /whatsapp/qr - Get current QR code from WAHA
 */
export async function getQRCode(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const waha = getWAHAClient();
    const qr = await waha.getQRCode();

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

    logInfo("QR code retrieved from WAHA");

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
    logError("Failed to get QR code from WAHA", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "QR_CODE_ERROR",
        message: "Failed to get QR code",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /whatsapp/status - Get WhatsApp status from WAHA
 */
export async function getStatus(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const waha = getWAHAClient();
    const status = await waha.getStatus();

    logInfo("WhatsApp status retrieved from WAHA", {
      connected: status.connected,
      authenticated: status.authenticated,
    });

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to get WAHA status", error);

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
 * POST /whatsapp/logout - Logout from WhatsApp via WAHA
 */
export async function logout(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const waha = getWAHAClient();
    await waha.stopSession();

    logInfo("WAHA session stopped (logged out)");

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: { message: "Logged out successfully" },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to logout from WAHA", error);

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
 * POST /whatsapp/send - Send a message via WAHA
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
    const waha = getWAHAClient();

    // Check connection status
    const status = await waha.getStatus();
    if (!status.connected) {
      logInfo("Send message failed: WAHA not connected");

      res.status(HTTP_CODES.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: API_ERRORS.PROVIDER_NOT_CONNECTED,
          message: "WhatsApp is not connected. Please try again.",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!status.authenticated) {
      logInfo("Send message failed: WAHA not authenticated");

      res.status(HTTP_CODES.SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: API_ERRORS.PROVIDER_NOT_AUTHENTICATED,
          message: "WhatsApp is not authenticated. Please scan QR code at /whatsapp/qr",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Send message via WAHA
    const messageId = await waha.sendMessage(to, text);

    logInfo("Message sent via WAHA successfully", {
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
    logError("Failed to send message via WAHA", error);

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

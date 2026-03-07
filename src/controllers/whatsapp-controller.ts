/**
 * WhatsApp controller - handle API endpoints
 */

import { Request, Response } from "express";
import QRCode from "qrcode";
import { getWhatsAppService } from "../services/whatsapp-service";
import { logInfo, logError } from "../config/logger";
import { ApiResponse } from "../utils/types";
import { HTTP_CODES } from "../utils/constants";

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

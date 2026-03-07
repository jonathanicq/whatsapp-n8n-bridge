/**
 * Message validation utilities
 */

import { MESSAGE_VALIDATION, API_ERRORS } from "./constants";

export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Validate phone number format
 * Accepts E.164 format: +[1-9]{1}[0-9]{1,14}
 * Also accepts without + prefix
 */
export function validatePhoneNumber(phoneNumber: unknown): ValidationResult {
  // Type check
  if (typeof phoneNumber !== "string") {
    return {
      valid: false,
      error: {
        code: API_ERRORS.INVALID_PHONE_NUMBER,
        message: "Phone number must be a string",
      },
    };
  }

  // Empty check
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: {
        code: API_ERRORS.INVALID_PHONE_NUMBER,
        message: "Phone number is required. Use E.164 format: +5511999999999 or 5511999999999",
      },
    };
  }

  // Format validation
  if (!MESSAGE_VALIDATION.PHONE_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error: {
        code: API_ERRORS.INVALID_PHONE_NUMBER,
        message:
          "Invalid phone number format. Use E.164 format: +[country code][number] or [country code][number]",
      },
    };
  }

  return { valid: true };
}

/**
 * Validate message text
 */
export function validateMessageText(text: unknown): ValidationResult {
  // Type check
  if (typeof text !== "string") {
    return {
      valid: false,
      error: {
        code: API_ERRORS.EMPTY_MESSAGE,
        message: "Message text must be a string",
      },
    };
  }

  // Empty check (including whitespace-only)
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: {
        code: API_ERRORS.EMPTY_MESSAGE,
        message: "Message text cannot be empty",
      },
    };
  }

  // Length check
  if (text.length > MESSAGE_VALIDATION.MAX_LENGTH) {
    return {
      valid: false,
      error: {
        code: API_ERRORS.MESSAGE_TOO_LONG,
        message: `Message text exceeds maximum length of ${MESSAGE_VALIDATION.MAX_LENGTH} characters`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate send message request
 */
export function validateSendMessageRequest(payload: unknown): ValidationResult {
  // Payload type check
  if (typeof payload !== "object" || payload === null) {
    return {
      valid: false,
      error: {
        code: API_ERRORS.INVALID_PHONE_NUMBER,
        message: "Invalid request payload",
      },
    };
  }

  const req = payload as Record<string, unknown>;

  // Validate phone number
  const phoneValidation = validatePhoneNumber(req.to);
  if (!phoneValidation.valid) {
    return phoneValidation;
  }

  // Validate message text
  const textValidation = validateMessageText(req.text);
  if (!textValidation.valid) {
    return textValidation;
  }

  return { valid: true };
}

/**
 * Message validators unit tests
 */

import {
  validatePhoneNumber,
  validateMessageText,
  validateSendMessageRequest,
} from "../../../src/utils/validators";

describe("Message Validators", () => {
  describe("validatePhoneNumber", () => {
    it("should accept valid phone numbers with +", () => {
      const result = validatePhoneNumber("+5511999999999");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept valid phone numbers without +", () => {
      const result = validatePhoneNumber("5511999999999");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept minimum valid phone length", () => {
      const result = validatePhoneNumber("12");
      expect(result.valid).toBe(true);
    });

    it("should accept maximum valid phone length (15 digits)", () => {
      const result = validatePhoneNumber("123456789012345");
      expect(result.valid).toBe(true);
    });

    it("should reject empty phone number", () => {
      const result = validatePhoneNumber("");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject whitespace-only phone number", () => {
      const result = validatePhoneNumber("   ");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject phone number with letters", () => {
      const result = validatePhoneNumber("123abc456");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject phone number starting with 0", () => {
      const result = validatePhoneNumber("01234567890");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject phone number too long (>15 digits)", () => {
      const result = validatePhoneNumber("1234567890123456");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject non-string phone number", () => {
      const result = validatePhoneNumber(123456789);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject null phone number", () => {
      const result = validatePhoneNumber(null);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject phone number with special characters", () => {
      const result = validatePhoneNumber("123-456-7890");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });
  });

  describe("validateMessageText", () => {
    it("should accept valid message text", () => {
      const result = validateMessageText("Hello World");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept message with unicode characters", () => {
      const result = validateMessageText("Olá Mundo! 👋");
      expect(result.valid).toBe(true);
    });

    it("should accept maximum valid message length (4096)", () => {
      const maxText = "a".repeat(4096);
      const result = validateMessageText(maxText);
      expect(result.valid).toBe(true);
    });

    it("should accept message with newlines", () => {
      const result = validateMessageText("Line 1\nLine 2");
      expect(result.valid).toBe(true);
    });

    it("should reject empty string", () => {
      const result = validateMessageText("");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject whitespace-only string", () => {
      const result = validateMessageText("   ");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject newline-only string", () => {
      const result = validateMessageText("\n\n");
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject message exceeding max length (4097 chars)", () => {
      const tooLongText = "a".repeat(4097);
      const result = validateMessageText(tooLongText);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("MESSAGE_TOO_LONG");
    });

    it("should reject non-string message", () => {
      const result = validateMessageText(12345);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject null message", () => {
      const result = validateMessageText(null);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("EMPTY_MESSAGE");
    });
  });

  describe("validateSendMessageRequest", () => {
    it("should validate correct request", () => {
      const request = {
        to: "5511999999999",
        text: "Hello World",
      };
      const result = validateSendMessageRequest(request);
      expect(result.valid).toBe(true);
    });

    it("should reject request with invalid phone", () => {
      const request = {
        to: "invalid",
        text: "Hello",
      };
      const result = validateSendMessageRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject request with empty message", () => {
      const request = {
        to: "5511999999999",
        text: "",
      };
      const result = validateSendMessageRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject request with non-object payload", () => {
      const result = validateSendMessageRequest("not an object");
      expect(result.valid).toBe(false);
    });

    it("should reject null payload", () => {
      const result = validateSendMessageRequest(null);
      expect(result.valid).toBe(false);
    });

    it("should reject request with message too long", () => {
      const request = {
        to: "5511999999999",
        text: "a".repeat(4097),
      };
      const result = validateSendMessageRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe("MESSAGE_TOO_LONG");
    });

    it("should accept request with + prefix phone", () => {
      const request = {
        to: "+5511999999999",
        text: "Hello",
      };
      const result = validateSendMessageRequest(request);
      expect(result.valid).toBe(true);
    });

    it("should accept request at max message length", () => {
      const request = {
        to: "5511999999999",
        text: "a".repeat(4096),
      };
      const result = validateSendMessageRequest(request);
      expect(result.valid).toBe(true);
    });
  });
});

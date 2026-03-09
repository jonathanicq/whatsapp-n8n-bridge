/**
 * WhatsApp JID to Phone Number Converter
 * Converts JID format (212244549910628@lid or @g.us) to readable phone numbers (+212244549910628)
 */

/**
 * Convert WhatsApp JID to international phone number format
 * @param jid - The JID string (e.g., "212244549910628@lid" or "212244549910628")
 * @returns The phone number with + prefix (e.g., "+212244549910628")
 */
export function convertJIDToPhoneNumber(jid: string | null | undefined): string {
  if (!jid) {
    return "unknown";
  }

  // If already a phone number with +, return as-is
  if (jid.startsWith("+")) {
    return jid;
  }

  // Extract phone number from JID (before @ if present)
  const phoneNumber = jid.includes("@") ? jid.split("@")[0] : jid;

  // Return with + prefix
  return `+${phoneNumber}`;
}

/**
 * Convert array of message objects, transforming the 'from' field
 * @param items - Array of message objects with 'from' field in JID format
 * @returns Array with converted 'from' fields
 */
export function convertJIDArrayToPhoneNumbers(items: any[]): any[] {
  if (!Array.isArray(items)) {
    return items;
  }

  return items.map((item) => ({
    ...item,
    from: convertJIDToPhoneNumber(item.from),
    fromJID: item.from, // Store original JID for reference
  }));
}

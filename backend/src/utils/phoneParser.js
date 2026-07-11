/**
 * Phone number normalization utility.
 * Handles Indian default, international numbers, sanitization.
 */

export function normalizePhone(raw, defaultCountry = '91') {
  // Strip trigger words (SD, send details)
  let cleaned = raw.replace(/^(sd|send\s*details?)\s*/i, '');

  // Strip all spaces, dashes, brackets, dots
  cleaned = cleaned.replace(/[\s\-\(\)\.\+]/g, '');

  // Remove leading zeros from local number
  cleaned = cleaned.replace(/^0+/, '');

  // Remove + prefix that was already stripped
  // Re-add + based on number length
  if (cleaned.length < 7) {
    return { valid: false, normalized: null, isIndian: false, error: 'Phone number too short' };
  }

  // India: 10 digits = local number
  if (cleaned.length === 10) {
    return { valid: true, normalized: `+${defaultCountry}${cleaned}`, isIndian: defaultCountry === '91' };
  }

  // India with 91 prefix: 12 digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return { valid: true, normalized: `+${cleaned}`, isIndian: true };
  }

  // Any other length with country code
  if (cleaned.length >= 11) {
    return { valid: true, normalized: `+${cleaned}`, isIndian: cleaned.startsWith('91') };
  }

  return { valid: false, normalized: null, isIndian: false, error: 'Unknown phone format' };
}

export function isAdminCommand(message) {
  if (!message) return null;
  const trimmed = message.trim().toLowerCase();

  // SD / send details
  const sdMatch = trimmed.match(/^(sd|send\s*details?)\s+(.+)/i);
  if (sdMatch) {
    return { command: 'send_details', phoneRaw: sdMatch[2].trim() };
  }

  // Status check
  if (/^(status|health|stats)$/i.test(trimmed)) {
    return { command: 'status' };
  }

  return null;
}

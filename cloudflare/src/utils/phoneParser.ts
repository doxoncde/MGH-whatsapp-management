// Phone number normalization utility
// Ported from backend/src/utils/phoneParser.js

export function normalizePhone(raw: string, defaultCountry = '91'): {
  valid: boolean;
  normalized: string | null;
  isIndian: boolean;
  error?: string;
} {
  let cleaned = raw.replace(/^(sd|send\s*details?)\s*/i, '');
  cleaned = cleaned.replace(/[\s\-\(\)\.\+]/g, '');
  cleaned = cleaned.replace(/^0+/, '');

  if (cleaned.length < 7) {
    return { valid: false, normalized: null, isIndian: false, error: 'Phone number too short' };
  }

  if (cleaned.length === 10) {
    return { valid: true, normalized: `+${defaultCountry}${cleaned}`, isIndian: defaultCountry === '91' };
  }

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return { valid: true, normalized: `+${cleaned}`, isIndian: true };
  }

  if (cleaned.length >= 11) {
    return { valid: true, normalized: `+${cleaned}`, isIndian: cleaned.startsWith('91') };
  }

  return { valid: false, normalized: null, isIndian: false, error: 'Unknown phone format' };
}

export interface AdminCommand {
  command: 'send_details' | 'status';
  phoneRaw?: string;
}

export function isAdminCommand(message: string): AdminCommand | null {
  if (!message) return null;
  const trimmed = message.trim().toLowerCase();

  const sdMatch = trimmed.match(/^(sd|send\s*details?)\s+(.+)/i);
  if (sdMatch) {
    return { command: 'send_details', phoneRaw: sdMatch[2].trim() };
  }

  if (/^(status|health|stats)$/i.test(trimmed)) {
    return { command: 'status' };
  }

  return null;
}

export function getConfig(key: string, fallback: string): string {
  return (globalThis as any)[key] || fallback;
}

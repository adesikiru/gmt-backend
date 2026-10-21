/**
 * Normalizes and validates Nigerian phone numbers.
 * Supports:
 * - Local 11-digit numbers starting with 0: e.g. 08012345678, 07012345678, 09012345678, 08112345678, 09112345678
 * - International format with +234: e.g. +2348012345678, +234 801 234 5678
 * - Format with 234 (without +): e.g. 2348012345678
 * - Spaces, dashes, parentheses and dots are stripped.
 *
 * Normalizes to standard canonical local 11-digit format: "08012345678"
 */
export function normalizePhoneNumber(rawPhone?: string | null): {
  isValid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Strip all whitespace, hyphens, parentheses, and dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '').trim();

  // Handle +234 prefix: +2348012345678 -> 08012345678
  if (cleaned.startsWith('+234')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('234') && cleaned.length === 13) {
    // 2348012345678 -> 08012345678
    cleaned = '0' + cleaned.slice(3);
  }

  // A valid Nigerian mobile number has 11 digits:
  // Starts with 0, followed by 7, 8, or 9, followed by 0 or 1, followed by 8 digits
  const nigerianRegex = /^0[789][01]\d{8}$/;
  if (!nigerianRegex.test(cleaned)) {
    return {
      isValid: false,
      error:
        'Invalid phone number. Must be a valid 11-digit Nigerian phone number (e.g. 08012345678 or +2348012345678)',
    };
  }

  return {
    isValid: true,
    normalized: cleaned,
  };
}

/**
 * Normalizes email address to lowercase and trimmed.
 */
export function normalizeEmail(rawEmail?: string | null): string | null {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  const cleaned = rawEmail.trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

import crypto from 'crypto';

/**
 * Direct-booking confirmation codes — `BOOK-XXXXXX`.
 *
 * Server-mint only (NEVER client-side Math.random — that was the live-forgery
 * vuln the BOBR-EARLY P-1 fix closed). One code per inquiry, used as the
 * human-readable matchback handle when a guest pays via Venmo/PayPal/Google Pay
 * and pastes the receipt note back into the confirm-deposit form.
 *
 * Namespace-separated from karma-market's `BOBR-XXXX` (4-char donation receipt)
 * and the game's `BOBR-EARLY-XXXXXX` (Airbnb discount). Co-existing safely.
 */

// Same alphabet as discountCodesDb — excludes 0/O, 1/I/L for read-aloud safety
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const SUFFIX_LEN = 6;          // 31^6 ≈ 887M code space
const PREFIX = 'BOOK';
const FULL_RE = /^BOOK-[2-9A-HJKMNPQ-Z]{6}$/;

export function mintBookingCode(): string {
  const bytes = crypto.randomBytes(SUFFIX_LEN);
  let suffix = '';
  for (let i = 0; i < SUFFIX_LEN; i++) {
    suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `${PREFIX}-${suffix}`;
}

export function isBookingCodeFormatValid(raw: string): boolean {
  return typeof raw === 'string' && FULL_RE.test(raw.trim().toUpperCase());
}

export function normalizeBookingCode(raw: string): string {
  return raw.trim().toUpperCase();
}

import { NextRequest, NextResponse } from 'next/server';
import {
  createBookingVerificationSession,
  findAllowlistedBooking,
  getBookingVerificationSession,
} from '@/lib/bookingAllowlist';
import {
  detectBookingPlatform,
  isBookingCodeFormatValid,
  normalizeBookingCode,
} from '@/lib/bookingCodeFormat';
import type { BookingPlatform } from '@/lib/bookingCodeFormat';

export const runtime = 'nodejs';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const COOKIE_NAME = 'bobr_booking_verification';
const rateEntries = new Map<string, { count: number; resetAt: number }>();

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateEntries.get(ip);

  if (!entry || now > entry.resetAt) {
    rateEntries.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function isBookingPlatform(value: unknown): value is BookingPlatform {
  return value === 'bobr_direct' || value === 'hipcamp' || value === 'hostaway';
}

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ verified: false });
  }

  const session = getBookingVerificationSession(sessionId);
  if (!session) {
    const response = NextResponse.json({ verified: false });
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  return NextResponse.json({
    verified: true,
    expiresAt: session.expires_at,
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ verified: false }, { status: 429 });
  }

  let body: { code?: string; platform?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  if (typeof body.code !== 'string' || !isBookingPlatform(body.platform)) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const code = normalizeBookingCode(body.code);
  const platform = body.platform;
  const detectedPlatform = detectBookingPlatform(code);

  if (detectedPlatform !== platform || !isBookingCodeFormatValid(code, platform)) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const entry = findAllowlistedBooking(code, platform);
  if (!entry) {
    return NextResponse.json({ verified: false });
  }

  const session = createBookingVerificationSession(entry);
  const response = NextResponse.json({
    verified: true,
    expiresAt: session.expires_at,
  });
  response.cookies.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(session.expires_at),
  });
  return response;
}

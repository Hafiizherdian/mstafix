// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

/**
 * Health check endpoint to verify if API routes are being registered correctly.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}

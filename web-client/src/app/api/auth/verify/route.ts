import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';

export async function GET(request: Request) {
  try {
    console.log('=== DEBUG: Token Verification ===');
    
    // Get token from cookies
    const cookie = request.headers.get('cookie');
    const token = cookie?.split('; ').find(c => c.startsWith('authToken='))?.split('=')[1];

    console.log('Token from cookie present:', token ? 'Yes' : 'No');

    if (!token) {
      console.error('Auth token not found in cookies');
      return NextResponse.json(
        { authenticated: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }
    
    if (!token) {
      console.error('Empty token in Authorization header');
      return NextResponse.json(
        { authenticated: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }

    try {
      // Try to verify token with API
      console.log('Sending verification request to:', `${API_GATEWAY_URL}/api/v1/auth/verify`);
      const verifyResponse = await fetch(`${API_GATEWAY_URL}/api/v1/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      console.log('Verification response status:', verifyResponse.status);

      // If server responds with success, token is valid
      if (verifyResponse.ok) {
        console.log('Token verified successfully');
        return NextResponse.json({ authenticated: true });
      }
      
      // If 404 Not Found, endpoint not implemented yet
      if (verifyResponse.status === 404) {
        console.log('Endpoint /api/v1/auth/verify not found, assuming token is valid');
        return NextResponse.json({ authenticated: true });
      }

      // Try to read response body for debugging
      let responseBody;
      try {
        responseBody = await verifyResponse.text();
        console.error('Token validation failed:', verifyResponse.status, responseBody);
      } catch (e) {
        console.error('Token validation failed:', verifyResponse.status, 'Could not read response body');
      }
      
      return NextResponse.json(
        { authenticated: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    } catch (fetchError) {
      console.error('Auth verification fetch error:', fetchError);
      
      // If fetch error occurs, assume API gateway is down
      // So we still assume token is valid for now
      console.log('Assuming token is valid due to connection error');
      return NextResponse.json({ 
        authenticated: true,
        warning: 'Connection to auth service failed, assuming valid token'
      });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Gagal memverifikasi autentikasi' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Login attempt for:', body.email || 'unknown user');
    
    // Forward the login request to auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    console.log('Forwarding login request to:', `${authServiceUrl}/api/auth/login`);
    
    const response = await fetch(`${authServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Login successful for user:', data.user?.email || 'unknown');
    
    if (!data.accessToken) {
      console.error('No access token returned from auth service');
      return NextResponse.json(
        { error: 'Authentication failed: No token provided' },
        { status: 500 }
      )
    }

    // Log token info (masked)
    console.log('Returning auth token (masked):', `${data.accessToken.substring(0, 10)}...`);
    
    // Return token in the response
    return NextResponse.json({ 
      user: data.user,
      token: data.accessToken,        // standar untuk client
      accessToken: data.accessToken,  // format dari auth service
      expiresIn: data.expiresIn,
      message: 'Login successful',
      success: true
    });
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
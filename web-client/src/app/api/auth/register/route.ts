import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Forward the registration request to the API Gateway
    const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';
    const targetUrl = `${apiGatewayUrl}/api/v1/auth/register`;
    console.log('Forwarding registration request to API Gateway:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Registration failed' },
        { status: response.status }
      )
    }

    // Set the auth token in an HTTP-only cookie
    cookies().set('token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    // Return user data without the token (since it's in the cookie)
    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
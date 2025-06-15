import { NextRequest, NextResponse } from 'next/server'

const API_GATEWAY = process.env.API_GATEWAY_URL || 'http://api-gateway:3000'

export async function POST(request: NextRequest) {
  try {
    // Get the route (login/register)
    const route = request.url.split('/api/auth/')[1]
    
    // Forward the request to auth service
    const response = await fetch(`${API_GATEWAY}/api/v1/auth/${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json())
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Authentication failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
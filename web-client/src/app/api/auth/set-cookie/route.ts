import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    console.log('Menyimpan token di cookie. Token (masked):', 
      token ? `${token.substring(0, 10)}...` : 'missing');
    
    if (!token) {
      console.error('Token kosong saat menyimpan di cookie');
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Set the auth token in a cookie - non-httpOnly for debugging
    cookies().set('authToken', token, {
      httpOnly: false, // set to false temporarily for debugging
<<<<<<< HEAD
      secure: process.env.NODE_ENV === 'production',
=======
      secure: false, // WARNING: Not for real production. Set up HTTPS and change this to true.
>>>>>>> b410d8f (clean)
      sameSite: 'lax', // Change to 'lax' for better compatibility
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    console.log('Token berhasil disimpan di cookie');

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error menyimpan token di cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set authentication token' },
      { status: 500 }
    )
  }
}
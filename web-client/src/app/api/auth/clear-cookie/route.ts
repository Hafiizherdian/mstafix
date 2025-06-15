import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('Clearing auth cookie...');
    
    // Get current token for logging
    const currentToken = cookies().get('authToken');
    console.log('Current token exists:', currentToken ? 'Yes' : 'No');
    
<<<<<<< HEAD
    // Clear the auth token cookie
    cookies().delete('authToken');
=======
    // Clear the auth token cookie by overwriting it with an expired one
    cookies().set('authToken', '', {
      httpOnly: false,
      secure: false, // WARNING: Not for real production. Set up HTTPS and change this to true.
      maxAge: -1, // Expire immediately
      path: '/',
    });
>>>>>>> b410d8f (clean)
    
    // Double check if cookie was deleted
    const tokenAfterDeletion = cookies().get('authToken');
    console.log('Token after deletion exists:', tokenAfterDeletion ? 'Yes' : 'No');
    
    console.log('Auth cookie cleared successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Authentication token cleared' 
    });
  } catch (error) {
    console.error('Error clearing cookie:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear authentication token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
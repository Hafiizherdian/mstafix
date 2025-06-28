// API Route: /api/admin/users
// Forwards requests to the user-service to fetch all users.

import { NextResponse } from 'next/server';
import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://127.0.0.1:3001/api/v1/users/all';

export async function GET(request: Request) {
  // For presentation purposes, we use a hardcoded token.
  // In a real-world scenario, this should be handled by a proper auth utility or middleware.
  const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

  try {
    console.log(`[UsersRoute] Forwarding GET request to ${USER_SERVICE_URL}`);

    const response = await axios.get(USER_SERVICE_URL, {
      headers: {
        Authorization: `Bearer ${hardcodedToken}`,
      },
    });

    // The user-service is expected to return an object like { users: [...] }
    return NextResponse.json(response.data);

  } catch (error) {
    console.error('[UsersRoute] Error forwarding request to user-service:', error);
    // Return a structured error response that the frontend can handle
    return NextResponse.json(
      {
        message: 'Failed to fetch users from the user service.',
        error: error instanceof Error ? error.message : 'An unknown error occurred.',
      },
      { status: 502 } // 502 Bad Gateway is appropriate for upstream errors
    );
  }
}

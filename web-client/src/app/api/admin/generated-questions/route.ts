// API Route: /api/admin/generated-questions
// This route forwards requests to the generate-soal-service.

import { NextResponse } from 'next/server';
import axios from 'axios';

// The URL for the backend service, using 127.0.0.1 to ensure IPv4 connection.
const GENERATE_SOAL_SERVICE_URL = process.env.GENERATE_SOAL_SERVICE_URL || 'http://127.0.0.1:3002/api/v1/generate/all';

export async function GET(request: Request) {
  // For presentation purposes, we use a hardcoded token.
  // In a real-world scenario, this would be handled by a proper auth system.
  const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

  try {
    console.log(`[GeneratedQuestionsRoute] Forwarding GET request to ${GENERATE_SOAL_SERVICE_URL}`);

    const response = await axios.get(GENERATE_SOAL_SERVICE_URL, {
      headers: {
        Authorization: `Bearer ${hardcodedToken}`,
      },
    });

    // The service is expected to return data in the shape { generatedQuestions: [...] }
    // We forward this directly.
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('[GeneratedQuestionsRoute] Error fetching data:', error.message);

    // Provide a more informative error response
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch data from the generation service.';
    const details = error.code || 'UNKNOWN_ERROR';

    return NextResponse.json(
      { 
        message,
        error: details,
      }, 
      { status }
    );
  }
}

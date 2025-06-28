// API Route: /api/admin/questions
// Forwards requests to the manage-soal-service to fetch all questions.

import { NextResponse } from 'next/server';
import axios from 'axios';

const QUESTION_SERVICE_URL = process.env.MANAGE_SOAL_SERVICE_URL || 'http://127.0.0.1:3003/api/v1/questions/all';

export async function GET(request: Request) {
  // For presentation purposes, we use a hardcoded token.
  const hardcodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZDU5Y2U2My1jY2YxLTQzMmEtYmM1Yi0zODVjM2YxYjYxYmIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3MTk1MzI4NzcsImV4cCI6MTcxOTUzMzA1N30.Y_2jH-gROBv5OC3t2s_2l52n-5aE0u2Hwz_ub3v-cK0';

  try {
    console.log(`[QuestionsRoute] Forwarding GET request to ${QUESTION_SERVICE_URL}`);

    const response = await axios.get(QUESTION_SERVICE_URL, {
      headers: {
        Authorization: `Bearer ${hardcodedToken}`,
      },
    });

    // The question-service is expected to return an object like { questions: [...] }
    return NextResponse.json(response.data);

  } catch (error) {
    console.error('[QuestionsRoute] Error forwarding request to question-service:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch questions from the question service.',
        error: error instanceof Error ? error.message : 'An unknown error occurred.',
      },
      { status: 502 } // 502 Bad Gateway for upstream errors
    );
  }
}

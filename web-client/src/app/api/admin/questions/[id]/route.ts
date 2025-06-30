import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
async function forwardRequest(req: NextRequest, questionId: string) {
  // The BFF should only ever talk to the API Gateway's public-facing routes.
  // The Gateway is responsible for rewriting the path and forwarding to the correct service.
  const url = `${API_GATEWAY_URL}/api/admin/questions/${questionId}`;
  const token = req.headers.get('Authorization');

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const options: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    // Duplex is required for streaming request bodies
    ...(req.method !== 'GET' && req.method !== 'HEAD' && { body: await req.text(), duplex: 'half' as 'half' }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) { 
    console.error(`[BFF] Error forwarding to ${url}:`, error);
    return NextResponse.json(
      { message: 'Error forwarding request to the backend service' },
      { status: 502 } // Bad Gateway
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardRequest(req, params.id);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardRequest(req, params.id);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardRequest(req, params.id);
}

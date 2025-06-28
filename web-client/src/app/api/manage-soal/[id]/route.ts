import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://api-gateway:3000";

// Helper functions
function handleUnauthorized() {
  cookies().set("authToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: -1,
    path: "/",
    sameSite: "strict",
  });
  return NextResponse.json(
    { error: "Session expired. Please login again." },
    { status: 401 },
  );
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
) {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (retryCount === maxRetries) throw error;

      const waitTime = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      retryCount++;
    }
  }

  throw new Error("Max retries exceeded");
}

// GET handler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const isBatch = request.nextUrl.searchParams.get("batch") === "true";
    const category = request.nextUrl.searchParams.get("category");
    const batchTime = request.nextUrl.searchParams.get("batchTime");

    // Authentication
    const authToken =
      cookies().get("authToken")?.value ||
      request.headers.get("authorization")?.split(" ")[1];
    if (!authToken) return handleUnauthorized();

    // API URL construction
    let apiUrl = `${API_GATEWAY_URL}/api/v1/manage-soal/questions`;
    if (isBatch && category && batchTime) {
      apiUrl += `/batch?category=${category}&batchTime=${batchTime}`;
    } else {
      apiUrl += `/${id}`;
    }

    // Fetch data
    const response = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to fetch data");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[ERROR] GET /api/manage-soal/[id]:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch question" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 },
    );
  }
}

// PUT handler
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();
    const authToken = cookies().get("authToken")?.value;

    if (!authToken) return handleUnauthorized();
    if (!body) throw new Error("Request body is required");

    const response = await fetchWithRetry(
      `${API_GATEWAY_URL}/api/v1/manage-soal/questions/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[ERROR] PUT /api/manage-soal/[id]:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to update question" },
      { status: 500 },
    );
  }
}

// DELETE handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const authToken = cookies().get("authToken")?.value;

    if (!authToken) return handleUnauthorized();

    const response = await fetchWithRetry(
      `${API_GATEWAY_URL}/api/v1/manage-soal/questions/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`[ERROR] DELETE /api/manage-soal/[id]:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to delete question" },
      { status: 500 },
    );
  }
}

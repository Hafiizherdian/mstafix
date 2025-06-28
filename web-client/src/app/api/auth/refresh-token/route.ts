import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get current token from cookies
    const cookieStore = cookies();
    const currentToken = cookieStore.get("authToken")?.value;

    if (!currentToken) {
      return NextResponse.json(
        { error: "No token to refresh" },
        { status: 401 },
      );
    }

    // Forward the refresh request to auth service
    const gateway = process.env.API_GATEWAY_URL || "http://api-gateway:3000";
    const response = await fetch(`${gateway}/api/v1/auth/refresh-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Token refresh failed" },
        { status: response.status },
      );
    }

    // Set the new auth token cookie with security best practices
    cookieStore.set("authToken", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 },
    );
  }
}

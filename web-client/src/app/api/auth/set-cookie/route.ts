import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    console.log("Setting cookie with token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Simple cookie settings for development
    cookies().set("authToken", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Backup cookie
    cookies().set("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    console.log("Cookie set successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting cookie:", error);
    return NextResponse.json(
      { error: "Failed to set authentication token" },
      { status: 500 },
    );
  }
}

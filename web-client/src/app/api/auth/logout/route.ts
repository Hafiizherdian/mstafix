import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Remove the auth token cookie by overwriting it with an expired one
    cookies().set("authToken", "", {
      httpOnly: false,
      secure: false, // WARNING: Not for real production. Set up HTTPS and change this to true
      maxAge: -1, // Expire immediately
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

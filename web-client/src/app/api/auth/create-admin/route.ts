import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Secret key untuk membuat admin pertama - seharusnya disimpan di environment variable
const ADMIN_CREATION_KEY =
  process.env.ADMIN_CREATION_KEY || "rahasia-admin-msta-2024";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, adminSecretKey } = body;

    // Verifikasi secret key
    if (adminSecretKey !== ADMIN_CREATION_KEY) {
      return NextResponse.json(
        { error: "Kunci keamanan tidak valid" },
        { status: 403 },
      );
    }

    // Validasi input dasar
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Data tidak lengkap. Email, password, dan nama diperlukan" },
        { status: 400 },
      );
    }

    // Buat akun admin langsung dengan secret key
    const registerResponse = await fetch(
      `${AUTH_SERVICE_URL}/create-admin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          adminSecretKey: adminSecretKey,
        }),
      },
    );

    const rawText = await registerResponse.text();

    // Log response mentah dari auth-service
    console.log("Response from auth-service:", rawText);

    let registerData;
    try {
      registerData = JSON.parse(rawText);
    } catch (e) {
      console.error("Gagal parse JSON dari auth-service:", e);
      return NextResponse.json(
        {
          error: "Invalid response dari auth-service (bukan JSON)",
          raw: rawText,
        },
        { status: 502 },
      );
    }

    if (!registerResponse.ok) {
      return NextResponse.json(
        { error: registerData.error || "Gagal membuat akun admin" },
        { status: registerResponse.status },
      );
    }

    // Set the auth token in an HTTP-only cookie
    if (registerData.accessToken) {
      cookies().set("token", registerData.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 2, // 2 hours
        path: "/",
      });
    }

    // Berhasil membuat akun admin
    return NextResponse.json({
      message: "Akun admin berhasil dibuat",
      user: registerData.user,
    });
  } catch (error) {
    console.error("Error creating admin account:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat membuat akun admin",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

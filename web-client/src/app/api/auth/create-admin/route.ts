import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Secret key untuk membuat admin pertama - seharusnya disimpan di environment variable
// Tapi untuk demonstrasi kita gunakan nilai tetap
const ADMIN_CREATION_KEY =
  process.env.ADMIN_CREATION_KEY || "rahasia-admin-msta-2024";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, secretKey } = body;

    // Verifikasi secret key
    if (secretKey !== ADMIN_CREATION_KEY) {
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
      `${AUTH_SERVICE_URL}/api/auth/create-admin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          adminSecretKey: secretKey,
        }),
      },
    );

    const registerData = await registerResponse.json();

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
      { error: "Terjadi kesalahan saat membuat akun admin" },
      { status: 500 },
    );
  }
}

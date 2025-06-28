import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const MANAGE_SOAL_SERVICE_URL =
  process.env.MANAGE_SOAL_SERVICE_URL || "http://manage-soal-service:3003";
const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL || "http://api-gateway:3000";

// Tipe data soal
interface Question {
  id: string;
  question: string;
  answer?: string;
  options?: Record<string, string>;
  explanation?: string;
  difficulty?: string;
  category: string;
  status?: string;
  type?: string;
  createdAt: string;
  [key: string]: any;
}

// GET: Ambil daftar soal
export async function GET(request: Request) {
  try {
    console.log("[DEBUG] GET /api/manage-soal/questions");

    const cookieStore = cookies();
    const authToken =
      cookieStore.get("authToken")?.value || cookieStore.get("token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    for (const key of [
      "category",
      "batchTime",
      "difficulty",
      "type",
      "status",
    ]) {
      const value = searchParams.get(key);
      if (value) params.append(key, value);
    }

    // Tambahkan cache buster
    params.append("_t", Date.now().toString());

    const apiGatewayUrl =
      process.env.NEXT_PUBLIC_API_GATEWAY_URL || API_GATEWAY_URL;
    const url = `${apiGatewayUrl}/api/v1/manage-soal/questions?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (response.status === 401) {
      return NextResponse.json(
        { error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ERROR] Fetch failed:", errorText);
      return NextResponse.json(
        { error: "Gagal mengambil daftar soal" },
        { status: response.status },
      );
    }

    const text = await response.text();
    if (!text) {
      return NextResponse.json(
        { error: "Respons API kosong" },
        { status: 500 },
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return NextResponse.json(
        { error: "Format respons API tidak valid" },
        { status: 500 },
      );
    }

    const items = Array.isArray(data) ? data : data.items || [];
    const seen = new Set<string>();
    const uniqueItems: Question[] = [];

    for (const item of items) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueItems.push(item);
      }
    }

    const result = {
      success: true,
      items: uniqueItems,
      total: uniqueItems.length,
    };

    return NextResponse.json(
      Array.isArray(data) ? result : { ...data, ...result },
    );
  } catch (error) {
    console.error("[ERROR] Unexpected:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil daftar soal",
      },
      { status: 500 },
    );
  }
}

// POST: Simpan batch soal
export async function POST(request: Request) {
  try {
    console.log("[DEBUG] POST /api/manage-soal/questions");

    const cookieStore = cookies();
    const authToken = cookieStore.get("authToken")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Daftar soal tidak boleh kosong" },
        { status: 400 },
      );
    }

    const apiGatewayUrl =
      process.env.NEXT_PUBLIC_API_GATEWAY_URL || API_GATEWAY_URL;
    const url = `${apiGatewayUrl}/api/v1/manage-soal/questions/batch`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questions }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[ERROR] Gagal menyimpan soal:", data);
      return NextResponse.json(
        { error: data.error || "Gagal menyimpan soal" },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[ERROR] Unexpected:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menyimpan soal",
      },
      { status: 500 },
    );
  }
}

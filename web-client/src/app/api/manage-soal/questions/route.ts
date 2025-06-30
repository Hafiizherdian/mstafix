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
    console.log("[DEBUG] Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      API_GATEWAY_URL: process.env.API_GATEWAY_URL,
      NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
      MANAGE_SOAL_SERVICE_URL: process.env.MANAGE_SOAL_SERVICE_URL
    });

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

    // Gunakan API_GATEWAY_URL untuk server-side calls
    const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';
    const url = `${apiGatewayUrl}/api/v1/manage-soal/questions?${params.toString()}`;
    
    console.log('[DEBUG] Request URL:', url);

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
      console.error("[ERROR] Fetch failed:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error: errorText
      });
      return NextResponse.json(
        { 
          error: `Gagal mengambil daftar soal (${response.status} ${response.statusText})`,
          details: process.env.NODE_ENV === 'development' ? errorText : undefined
        },
        { status: response.status },
      );
    }

    let data;
      const text = await response.text();
      console.log('[DEBUG] Raw response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      
      if (!text) {
        console.error('[ERROR] Empty response body');
        return NextResponse.json(
          { error: "Respons API kosong" },
          { status: 500 },
        );
      }

      try {
        data = JSON.parse(text);
        console.log('[DEBUG] Parsed response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      } catch (parseError) {
        console.error('[ERROR] Failed to parse JSON:', parseError);
        return NextResponse.json(
          { 
            error: "Format respons API tidak valid",
            details: process.env.NODE_ENV === 'development' ? text : undefined
          },
          { status: 500 },
        );
      }

      // Handle both array and object responses
      let items: any[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.items)) {
          items = data.items;
        } else if (data.data && Array.isArray(data.data)) {
          items = data.data;
        } else if (data.questions && Array.isArray(data.questions)) {
          items = data.questions;
        } else {
          // If no array found, try to use the object itself if it has an id
          items = [data].filter(Boolean);
        }
      }

    console.log(`[DEBUG] Processed ${items.length} items from response`);
    
    // Deduplicate items by ID
    const seen = new Set<string>();
    const uniqueItems: Question[] = [];

    for (const item of items) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueItems.push(item);
      } else if (item?.id) {
        console.log(`[DEBUG] Duplicate item ID skipped: ${item.id}`);
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

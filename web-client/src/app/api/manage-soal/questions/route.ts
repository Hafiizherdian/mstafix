import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const MANAGE_SOAL_SERVICE_URL = process.env.MANAGE_SOAL_SERVICE_URL || 'http://manage-soal-service:3003';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';

// Definisikan tipe untuk Question
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
  [key: string]: any; // Untuk parameter tambahan lainnya
}

export async function GET(request: Request) {
  try {
    console.log('[DEBUG] Starting GET /api/manage-soal/questions...');
    
    // Get authentication token from cookies
    const cookieStore = cookies();
<<<<<<< HEAD
    const authToken = cookieStore.get('authToken')?.value || cookieStore.get('token')?.value;
=======
    const authToken = cookieStore.get('authToken')?.value;
>>>>>>> b410d8f (clean)

    console.log('Auth token for batch (masked):', authToken ? `${authToken.substring(0, 5)}...` : 'missing');

    if (!authToken) {
      console.error('[ERROR] API: Auth token missing for GET /api/manage-soal/questions');
      return NextResponse.json(
        { error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }

    // Get URL search params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const batchTime = searchParams.get('batchTime');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    console.log('[DEBUG] Query params:', { category, batchTime, difficulty, type, status });

    // Build query string
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (batchTime) params.append('batchTime', batchTime);
    if (difficulty) params.append('difficulty', difficulty);
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    
    // Tambahkan timestamp untuk cache busting
    const timestamp = Date.now();
    params.append('_t', timestamp.toString());

    const queryString = params.toString();
    
    // Use NEXT_PUBLIC_API_GATEWAY_URL if available, fall back to API_GATEWAY_URL
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || API_GATEWAY_URL;
    const url = `${apiGatewayUrl}/api/v1/manage-soal/questions${queryString ? `?${queryString}` : ''}`;

    console.log('[DEBUG] Fetching questions with URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    console.log('[DEBUG] Batch questions response status:', response.status);

    // Handle authentication errors
    if (response.status === 401) {
      console.error('[ERROR] Authentication failed with 401 in batch request');
      // Remove invalid cookie
<<<<<<< HEAD
      cookieStore.delete('authToken');
=======
      cookieStore.set('authToken', '', {
        httpOnly: false,
        secure: false, // WARNING: Not for real production. Set up HTTPS and change this to true.
        maxAge: -1, // Expire immediately
        path: '/',
      });
>>>>>>> b410d8f (clean)
      return NextResponse.json(
        { error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR] Error fetching batch questions:', errorText);
      return NextResponse.json(
        { error: 'Gagal mengambil daftar soal' },
        { status: response.status }
      );
    }

    // Get response text first to handle parsing errors safely
    let responseText;
    try {
      responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.error('[ERROR] Empty response received from API');
        return NextResponse.json(
          { error: 'Respons API kosong' },
          { status: 500 }
        );
      }
    } catch (textError) {
      console.error('[ERROR] Error reading response text:', textError);
      return NextResponse.json(
        { error: 'Gagal membaca respons dari API' },
        { status: 500 }
      );
    }
    
    // Parse JSON safely
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[ERROR] Error parsing questions JSON:', parseError);
      return NextResponse.json(
        { error: 'Format respons API tidak valid' },
        { status: 500 }
      );
    }
    
    console.log('[DEBUG] Batch questions fetched successfully, raw count:', 
      Array.isArray(data) ? data.length : (data.items?.length || 0));
    
    // Normalize the data structure (handle both array and {items: []})
    const items = Array.isArray(data) ? data : (data.items || []);
    
    // Deduplikasi berdasarkan ID soal
    const seen = new Set<string>();
    const uniqueItems: Question[] = [];
    
    items.forEach((item: any) => {
      // Basic validation
      if (!item || !item.id) {
        console.warn('[WARN] Skipping invalid item without ID');
        return;
      }
      
      // Cek duplikasi
      if (seen.has(item.id)) {
        console.warn(`[WARN] Skipping duplicate item with ID: ${item.id}`);
        return;
      }
      
      // Tambahkan ID ke Set untuk mencegah duplikasi berikutnya
      seen.add(item.id);
      uniqueItems.push(item);
    });
    
    console.log(`[DEBUG] Deduplicated items: ${uniqueItems.length} (removed ${items.length - uniqueItems.length} duplicates)`);
    
    // Return the deduplicated data in the same format as the original response
    if (Array.isArray(data)) {
      return NextResponse.json({
        success: true,
        items: uniqueItems,
        total: uniqueItems.length
      });
    } else {
      // Preserve original structure with items array
      return NextResponse.json({
        ...data,
        success: true,
        items: uniqueItems,
        total: uniqueItems.length
      });
    }
  } catch (error) {
    console.error('[ERROR] Error fetching questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mengambil daftar soal' },
      { status: 500 }
    );
<<<<<<< HEAD
=======
  }
}

export async function POST(request: Request) {
  try {
    console.log('[DEBUG] Starting POST /api/manage-soal/questions...');
    
    // Get authentication token from cookies
    const cookieStore = cookies();
    const authToken = cookieStore.get('authToken')?.value;

    if (!authToken) {
      console.error('[ERROR] API: Auth token missing for POST /api/manage-soal/questions');
      return NextResponse.json(
        { error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { questions } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }

    console.log(`[DEBUG] Saving ${questions.length} questions...`);

    // Use NEXT_PUBLIC_API_GATEWAY_URL if available, fall back to API_GATEWAY_URL
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || API_GATEWAY_URL;
    const url = `${apiGatewayUrl}/api/v1/manage-soal/questions/batch`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ questions }),
    });

    console.log('[DEBUG] Save questions response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('[ERROR] Error saving questions:', data);
      return NextResponse.json(
        { error: data.error || 'Gagal menyimpan soal' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('[ERROR] Error saving questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan soal' },
      { status: 500 }
    );
>>>>>>> b410d8f (clean)
  }
}
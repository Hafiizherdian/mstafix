import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
<<<<<<< HEAD

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[DEBUG] Fetching question with ID: ${params.id}`);
    
    if (!params.id) {
      console.log("[ERROR] Question ID missing in params");
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }
    
    // Cek jika id adalah ID batch
    const url = new URL(request.url);
    console.log(`[DEBUG] Request URL: ${url.toString()}`);
    const isBatch = url.searchParams.get('batch') === 'true';
    const category = url.searchParams.get('category');
    const batchTime = url.searchParams.get('batchTime');
    
    // Cek apakah ada auth header
    console.log(`[DEBUG] Auth header present: ${request.headers.has('authorization') ? 'Yes' : 'No'}`);
    
    // Ambil token dari header atau cookies
    let token = '';
    if (request.headers.has('authorization')) {
      const authHeader = request.headers.get('authorization') || '';
      token = authHeader.split(' ')[1];
      console.log(`[DEBUG] Token from header: ${token ? 'Present (masked)' : 'Missing'}`);
    } else {
      // Jika tidak ada di header, coba dari cookies
      const cookieStore = cookies();
      token = cookieStore.get('token')?.value || '';
      console.log(`[DEBUG] Token from cookie: ${token ? 'Present (masked)' : 'Missing'}`);
    }
    
    if (!token) {
      console.log("[ERROR] No token found for authentication");
      return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
    }
    
    // Base URL for API Gateway
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    
    // Jika batch request
    if (isBatch && category && batchTime) {
      console.log(`[DEBUG] Fetching batch of questions for category: ${category}, batchTime: ${batchTime}`);
      
      // Menggunakan endpoint yang tepat untuk batch
      const apiUrl = `${apiGatewayUrl}/api/v1/manage-soal/questions/batch?category=${category}&batchTime=${batchTime}`;
      console.log(`[DEBUG] Calling API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      console.log(`[DEBUG] Batch response status: ${response.status}`);
      
      if (response.status === 401) {
        return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
      }
      
      if (response.status === 404) {
        return NextResponse.json({ error: "Questions not found" }, { status: 404 });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[ERROR] Error fetching batch: ${errorText}`);
        return NextResponse.json({ error: `Failed to fetch questions: ${errorText}` }, { status: response.status });
      }
      
      const data = await response.json();
      console.log(`[DEBUG] Batch data received with ${data?.questions?.length || 0} questions`);
      
      if (!data || !data.questions || data.questions.length === 0) {
        console.log("[ERROR] No questions found in batch data");
        return NextResponse.json({ error: "No questions found" }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, ...data });
    } 
    // Single question request
    else {
      console.log(`[DEBUG] Fetching single question with ID: ${params.id}`);
      
      // Ensure the URL is correctly formatted with /questions/ path
      const apiUrl = `${apiGatewayUrl}/api/v1/manage-soal/questions/${params.id}`;
      console.log(`[DEBUG] Calling API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });
      
      console.log(`[DEBUG] Single question response status: ${response.status}`);
      
      if (response.status === 401) {
        return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
      }
      
      if (response.status === 404) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[ERROR] Error fetching question: ${errorText}`);
        return NextResponse.json({ error: `Failed to fetch question: ${errorText}` }, { status: response.status });
      }
      
      const data = await response.json();
      console.log(`[DEBUG] Question data received: ${data ? 'Yes' : 'No'}`);
      
      if (!data || !data.question) {
        console.log("[ERROR] No question data found in response");
        return NextResponse.json({ error: "Question not found or empty response" }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, question: data.question });
    }
  } catch (error: any) {
    console.error(`[ERROR] Error in GET /api/manage-soal/[id]:`, error);
    return NextResponse.json({ error: error.message || "Failed to fetch question" }, { status: 500 });
  }
}

export async function PUT(
=======

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://api-gateway:3000';

// Helper to handle unauthorized responses
function handleUnauthorized() {
  const cookieStore = cookies();
  cookieStore.set('authToken', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production', // Secure in production
    maxAge: -1, // Expire immediately
    path: '/',
    sameSite: 'lax',
  });
  return NextResponse.json({ error: "Sesi Anda telah berakhir. Silakan login kembali." }, { status: 401 });
}

// Centralized fetch logic
async function fetchFromApi(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    console.error(`[ERROR] 401 Unauthorized for ${options.method} ${url}`);
    return handleUnauthorized();
  }

  return response;
}

// GET handler for fetching a single question
export async function GET(
>>>>>>> b410d8f (clean)
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
<<<<<<< HEAD
    console.log(`[DEBUG] Updating question with ID: ${params.id}`);
    
    if (!params.id) {
      console.log("[ERROR] Question ID missing in params");
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }
    
    // Ambil token dari header atau cookies
    let token = '';
    if (request.headers.has('authorization')) {
      const authHeader = request.headers.get('authorization') || '';
      token = authHeader.split(' ')[1];
      console.log(`[DEBUG] Token from header: ${token ? 'Present (masked)' : 'Missing'}`);
    } else {
      // Jika tidak ada di header, coba dari cookies
      const cookieStore = cookies();
      token = cookieStore.get('token')?.value || '';
      console.log(`[DEBUG] Token from cookie: ${token ? 'Present (masked)' : 'Missing'}`);
    }
    
    if (!token) {
      console.log("[ERROR] No token found for authentication");
      return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
    }
    
    const body = await request.json();
    if (!body) {
      console.log("[ERROR] No question data provided in request body");
      return NextResponse.json({ error: "Question data is required" }, { status: 400 });
=======
    const { id } = params;
    console.log(`[DEBUG] GET /api/manage-soal/questions/${id}`);

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const authToken = cookies().get('authToken')?.value;
    if (!authToken) {
      return handleUnauthorized();
    }

    const url = `${API_GATEWAY_URL}/api/v1/manage-soal/questions/${id}`;
    const response = await fetchFromApi(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Failed to fetch question ${id}: ${errorText}`);
      return NextResponse.json({ error: `Gagal mengambil soal: ${errorText}` }, { status: response.status });
>>>>>>> b410d8f (clean)
    }
    
    // Base URL for API Gateway
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    const apiUrl = `${apiGatewayUrl}/api/v1/manage-soal/questions/${params.id}`;
    console.log(`[DEBUG] Calling PUT API: ${apiUrl}`);
    
    // Tambahkan timeout yang lebih lama dan retry logic untuk mengatasi ECONNRESET
    const maxRetries = 2;
    let retryCount = 0;
    let response;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`[DEBUG] PUT attempt ${retryCount + 1} of ${maxRetries + 1}`);
        
        // AbortController untuk mengatur timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
        
        response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Jika berhasil, keluar dari loop
        break;
      } catch (error: any) {
        console.log(`[ERROR] PUT attempt ${retryCount + 1} failed:`, error.message);
        
        // Jika ini adalah percobaan terakhir, lempar error
        if (retryCount === maxRetries) {
          throw error;
        }
        
        // Tunggu sebelum mencoba lagi (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`[DEBUG] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        retryCount++;
      }
    }
    
    if (!response) {
      throw new Error("Failed to connect to API after multiple attempts");
    }
    
    console.log(`[DEBUG] Update response status: ${response.status}`);
    
    if (response.status === 401) {
      return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[ERROR] Error updating question: ${errorText}`);
      return NextResponse.json({ error: `Failed to update question: ${errorText}` }, { status: response.status });
    }
    
    const data = await response.json();
<<<<<<< HEAD
    console.log(`[DEBUG] Update successful:`, data);
    
    return NextResponse.json({ success: true, question: data.question || data });
  } catch (error: any) {
    console.error(`[ERROR] Error in PUT /api/manage-soal/[id]:`, error);
    
    // Periksa jika error adalah ECONNRESET atau network-related
    if (error.message?.includes('ECONNRESET') || 
        error.message?.includes('network') || 
        error.message?.includes('abort')) {
      console.log('[ERROR] Network error detected, possibly ECONNRESET');
      return NextResponse.json({ 
        error: "Koneksi ke server terputus. Silakan coba lagi.", 
        details: error.message,
        code: 'NETWORK_ERROR'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to update question",
      details: error.stack
    }, { status: 500 });
  }
}

=======
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[ERROR] in GET /api/manage-soal/questions/[id]:`, error);
    return NextResponse.json({ error: error.message || "Gagal mengambil soal" }, { status: 500 });
  }
}

// PUT handler for updating a question
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`[DEBUG] PUT /api/manage-soal/questions/${id}`);

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const authToken = cookies().get('authToken')?.value;
    if (!authToken) {
      return handleUnauthorized();
    }

    const body = await request.json();
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const url = `${API_GATEWAY_URL}/api/v1/manage-soal/questions/${id}`;
    const response = await fetchFromApi(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[ERROR] Failed to update question ${id}:`, data);
      return NextResponse.json({ error: data.error || "Gagal memperbarui soal" }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[ERROR] in PUT /api/manage-soal/questions/[id]:`, error);
    return NextResponse.json({ error: error.message || "Gagal memperbarui soal" }, { status: 500 });
  }
}

// DELETE handler for deleting a question
>>>>>>> b410d8f (clean)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
<<<<<<< HEAD
    console.log(`[DEBUG] Deleting question with ID: ${params.id}`);
    
    if (!params.id) {
      console.log("[ERROR] Question ID missing in params");
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }
    
    // Ambil token dari header atau cookies
    let token = '';
    if (request.headers.has('authorization')) {
      const authHeader = request.headers.get('authorization') || '';
      token = authHeader.split(' ')[1];
      console.log(`[DEBUG] Token from header: ${token ? 'Present (masked)' : 'Missing'}`);
    } else {
      // Jika tidak ada di header, coba dari cookies
      const cookieStore = cookies();
      token = cookieStore.get('token')?.value || cookieStore.get('authToken')?.value || '';
      console.log(`[DEBUG] Token from cookie: ${token ? 'Present (masked)' : 'Missing'}`);
    }
    
    if (!token) {
      console.log("[ERROR] No token found for authentication");
      return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
    }
    
    // Base URL for API Gateway - pastikan gunakan NEXT_PUBLIC_API_GATEWAY_URL jika tersedia
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    
    // Pastikan URL memiliki format yang benar dengan menggunakan /questions/ di path
    const apiUrl = `${apiGatewayUrl}/api/v1/manage-soal/questions/${params.id}`;
    console.log(`[DEBUG] Calling DELETE API: ${apiUrl}`);
    
    // Tambahkan timeout yang lebih lama dan retry logic untuk mengatasi ECONNRESET
    const maxRetries = 2;
    let retryCount = 0;
    let response;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`[DEBUG] DELETE attempt ${retryCount + 1} of ${maxRetries + 1}`);
        
        // AbortController untuk mengatur timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
        
        response = await fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Jika berhasil, keluar dari loop
        break;
      } catch (error: any) {
        console.log(`[ERROR] DELETE attempt ${retryCount + 1} failed:`, error.message);
        
        // Jika ini adalah percobaan terakhir, lempar error
        if (retryCount === maxRetries) {
          throw error;
        }
        
        // Tunggu sebelum mencoba lagi (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`[DEBUG] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        retryCount++;
      }
    }
    
    if (!response) {
      throw new Error("Failed to connect to API after multiple attempts");
    }
    
    console.log(`[DEBUG] Delete response status: ${response.status}`);
    
    if (response.status === 401) {
      return NextResponse.json({ error: "Unauthorized. Session has expired." }, { status: 401 });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[ERROR] Error deleting question: ${errorText}`);
      return NextResponse.json({ error: `Failed to delete question: ${errorText}` }, { status: response.status });
    }
    
    return NextResponse.json({ success: true, message: "Question successfully deleted" });
  } catch (error: any) {
    console.error(`[ERROR] Error in DELETE /api/manage-soal/[id]:`, error);
    
    // Periksa jika error adalah ECONNRESET atau network-related
    if (error.message?.includes('ECONNRESET') || 
        error.message?.includes('network') || 
        error.message?.includes('abort')) {
      console.log('[ERROR] Network error detected, possibly ECONNRESET');
      return NextResponse.json({ 
        error: "Koneksi ke server terputus. Silakan coba lagi.", 
        details: error.message,
        code: 'NETWORK_ERROR'
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: error.message || "Failed to delete question",
      details: error.stack
    }, { status: 500 });
=======
    const { id } = params;
    console.log(`[DEBUG] DELETE /api/manage-soal/questions/${id}`);

    if (!id) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    const authToken = cookies().get('authToken')?.value;
    if (!authToken) {
      return handleUnauthorized();
    }

    const url = `${API_GATEWAY_URL}/api/v1/manage-soal/questions/${id}`;
    const response = await fetchFromApi(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
        // Handle cases where DELETE returns a body with an error message
        if (response.headers.get('content-type')?.includes('application/json')) {
            const data = await response.json();
            console.error(`[ERROR] Failed to delete question ${id}:`, data);
            return NextResponse.json({ error: data.error || "Gagal menghapus soal" }, { status: response.status });
        }
        // Handle non-JSON errors
        const errorText = await response.text();
        console.error(`[ERROR] Failed to delete question ${id}: ${errorText}`);
        return NextResponse.json({ error: errorText || "Gagal menghapus soal" }, { status: response.status });
    }
    
    return new NextResponse(null, { status: 204 }); // No Content

  } catch (error: any) {
    console.error(`[ERROR] in DELETE /api/manage-soal/questions/[id]:`, error);
    return NextResponse.json({ error: error.message || "Gagal menghapus soal" }, { status: 500 });
>>>>>>> b410d8f (clean)
  }
}
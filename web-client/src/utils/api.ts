import { getToken, redirectToLogin, clearAuth, getUser } from './auth';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export async function fetchApi(url: string, options: FetchOptions = {}) {
  const { skipAuth = false, ...fetchOptions } = options
  
  // Default headers
  const headers = new Headers(fetchOptions.headers)
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Ambil token langsung dari localStorage dengan fungsi auth
  if (!skipAuth) {
    try {
      // Get auth token menggunakan fungsi getToken()
      const token = getToken();
      
      console.log(`API Request to ${url} - Token exists:`, token ? 'Yes' : 'No');
      
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      } else {
        console.warn(`No auth token found in localStorage for request: ${url}`);
        
        // Jika ini request yang memerlukan autentikasi, coba cek apakah user masih ada
        const user = getUser();
        if (user && !url.includes('/api/auth/')) {
          console.error('User exists but token missing, redirecting to login');
          redirectToLogin(true); // redirect dengan expired=true
          throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
        }
      }
    } catch (storageError) {
      console.error('Error accessing auth:', storageError);
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers
    })

    // Handle 401 Unauthorized
    if (response.status === 401 && !url.includes('/api/auth/login') && !skipAuth) {
      // Clear auth data dan redirect ke login
      redirectToLogin(true);
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.')
    }

    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Refresh token function
async function refreshToken() {
  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

// Helper methods
export const api = {
  get: (url: string, options: FetchOptions = {}) => 
    fetchApi(url, { ...options, method: 'GET' }),
    
  post: (url: string, data?: any, options: FetchOptions = {}) =>
    fetchApi(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),
    
  put: (url: string, data?: any, options: FetchOptions = {}) =>
    fetchApi(url, {
      ...options,
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined
    }),
    
  delete: (url: string, options: FetchOptions = {}) =>
    fetchApi(url, { ...options, method: 'DELETE' })
}
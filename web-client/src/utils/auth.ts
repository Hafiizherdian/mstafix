/**
 * Utilitas untuk mengelola autentikasi dan localStorage
 */

// Key untuk localStorage
const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

// Simpan token ke localStorage
export const storeToken = (token: string): boolean => {
  try {
    if (!token) {
      console.error('Attempting to store empty token');
      return false;
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    
    // Verify it was stored correctly
    const stored = localStorage.getItem(TOKEN_KEY);
    return !!stored;
  } catch (error) {
    console.error('Error storing token in localStorage:', error);
    return false;
  }
};

// Ambil token dari localStorage
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token from localStorage:', error);
    return null;
  }
};

// Simpan data user ke localStorage
export const storeUser = (user: any): boolean => {
  try {
    if (!user) {
      console.error('Attempting to store empty user');
      return false;
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error storing user in localStorage:', error);
    return false;
  }
};

// Ambil data user dari localStorage
export const getUser = (): any | null => {
  try {
    const userString = localStorage.getItem(USER_KEY);
    if (!userString) return null;
    
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error retrieving user from localStorage:', error);
    return null;
  }
};

// Hapus data autentikasi dari localStorage
export const clearAuth = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth from localStorage:', error);
  }
};

// Cek apakah user terautentikasi
export const isAuthenticated = (): boolean => {
  try {
    return !!getToken();
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// Redirect ke halaman login atau halaman lain
export const redirectToLogin = (expired: boolean = false, redirectPath: string = '/login'): void => {
  clearAuth();
  
  // Add delay to ensure state updates complete
  setTimeout(() => {
    window.location.href = `${redirectPath}${expired ? '?expired=true' : ''}`;
  }, 100);
}; 
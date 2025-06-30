import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Mengarahkan semua request ke Next.js BFF (Backend-for-Frontend)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token otentikasi secara otomatis
apiClient.interceptors.request.use(
  (config) => {
    // Memastikan kode ini hanya berjalan di sisi client (browser)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

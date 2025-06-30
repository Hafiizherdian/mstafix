import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types';

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem('authToken') || null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }

  private clearAuthToken(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        // Hapus juga dari sessionStorage untuk memastikan
        sessionStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Tambahkan timestamp untuk menghindari cache
      const timestamp = new Date().getTime();
      const separator = url.includes('?') ? '&' : '?';
      const urlWithTimestamp = `${url}${separator}_t=${timestamp}`;
      
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.get(
        urlWithTimestamp, 
        config
      );
      
      return response.data;
      
    } catch (error: any) {
      console.error(`GET ${url} failed:`, error);
      return this.handleError(error);
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.put(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.delete(url, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<never> {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with a status code outside 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        this.clearAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
        return { 
          success: false, 
          error: 'Sesi telah berakhir, silakan login kembali',
          code: 'UNAUTHORIZED'
        };
      }
      
      return {
        success: false,
        error: data?.error || 'Terjadi kesalahan pada server',
        message: data?.message || `Error ${status}`,
        code: data?.code || `HTTP_${status}`
      };
      
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Tidak ada respon dari server. Silakan periksa koneksi internet Anda.',
        code: 'NETWORK_ERROR'
      };
      
    } else {
      // Something happened in setting up the request
      return {
        success: false,
        error: 'Terjadi kesalahan saat mengirim permintaan',
      };
    }
  }
}

export const api = ApiService.getInstance();

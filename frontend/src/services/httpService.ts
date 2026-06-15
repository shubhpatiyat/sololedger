import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAccessTokenFromMemory, setAccessTokenInMemory } from '@/lib/secureTokenManager';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

interface ApiResponse<T = unknown> {
  ok?: boolean;
  status?: number;
  message?: string;
  error?: string;
  data?: T;
}

class HttpService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor(baseURL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1') {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add access token to Authorization header if available
        const accessToken = getAccessTokenFromMemory();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 404 errors
        if (error.response?.status === 404 && !originalRequest?.url?.includes('/refresh')) {
          window.location.href = '/404';
          return Promise.reject(error);
        }

        // Handle 401 errors for authenticated endpoints
        if (error.response?.status === 401 && !originalRequest?.url?.includes('/login') && !originalRequest?.url?.includes('/refresh') && !(originalRequest as ExtendedAxiosRequestConfig)._retry) {
          (originalRequest as ExtendedAxiosRequestConfig)._retry = true;
          
          // If we're already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.axiosInstance(originalRequest!);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          this.isRefreshing = true;

          try {
            // Attempt to refresh the token
            const refreshResponse = await this.axiosInstance.post('/auth/token/refresh', {});
            
            if (refreshResponse.data.success) {
              // Store the new access token
              if (refreshResponse.data.access_token) {
                setAccessTokenInMemory(refreshResponse.data.access_token);
                // Update the original request with new token
                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
              }
              
              // Token refresh successful, process queued requests
              this.processQueue(null);
              
              // Retry the original request
              return this.axiosInstance(originalRequest!);
            } else {
              // Refresh failed, logout user
              this.handleAuthFailure();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            this.handleAuthFailure();
            this.processQueue(refreshError);
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, config);
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return response;
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  private handleError<T>(error: unknown): AxiosResponse<T> {
    console.error('HTTP request failed:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: AxiosResponse<T> };
      if (axiosError.response) {
        return axiosError.response;
      }
    }
    
    // Create a mock AxiosResponse for network errors
    return {
      data: {
        ok: false,
        status: 500,
        error: 'Network error',
        message: 'An unexpected error occurred'
      } as T,
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as AxiosRequestConfig,
      request: {}
    } as AxiosResponse<T>;
  }

  // Method to update base URL if needed
  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  // Method to get the axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Process queued requests after token refresh
  private processQueue(error: unknown): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
    
    this.failedQueue = [];
  }

  // Handle authentication failure
  private handleAuthFailure(): void {
    console.warn('Authentication failed - redirecting to login');
    
    localStorage.removeItem('ozoo_logged_in');
    localStorage.removeItem('ozoo_user_email');
    localStorage.removeItem('ozoo_access_token');
    
    // Redirect to login page
    window.location.href = '/login';
  }

  // Refresh token API
  async refreshToken(): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.post('/auth/token/refresh', {});
      return response;
    } catch (error) {
      // If refresh token fails, logout user
      this.handleAuthFailure();
      // throw error;
    }
  }
}

// Create and export a singleton instance
export const httpService = new HttpService();

export default HttpService;

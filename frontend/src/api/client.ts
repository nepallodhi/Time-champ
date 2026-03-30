import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout to prevent hanging requests
})

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message === 'timeout of 10000ms exceeded') {
      console.error('Request timeout:', error.config?.url)
      return Promise.reject({
        ...error,
        message: 'Request timed out. Please try again.',
        isTimeout: true,
      })
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error('Network error:', error.config?.url)
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      })
    }

    // Handle 500/503 server errors
    if (error.response?.status === 500 || error.response?.status === 503) {
      console.error('Server error:', error.config?.url, error.response?.status)
      return Promise.reject({
        ...error,
        message: 'Server error. Please try again later.',
        isServerError: true,
      })
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default apiClient

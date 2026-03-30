import apiClient from './client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  user: {
    email: string
    password: string
    name: string
    role: 'admin' | 'manager' | 'employee'
  }
  organization_name: string
}

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'employee'
  organization_id: number
  is_owner?: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },
}

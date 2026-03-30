import apiClient from './client'
import { User } from './auth'

export interface UserWithStatus extends User {
  status?: 'offline' | 'online' | 'idle'
  work_time?: number
  active_percentage?: number
  last_seen?: string
  created_at?: string
  manager_id?: number
  team_members?: UserWithStatus[]
  is_owner?: boolean
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'admin' | 'manager' | 'employee'
  organization_name?: string
  manager_id?: number
  functional_unit?: string
  is_owner?: boolean
}

export const usersApi = {
  list: async (): Promise<UserWithStatus[]> => {
    const response = await apiClient.get<UserWithStatus[]>('/users')
    return response.data
  },

  get: async (id: number): Promise<UserWithStatus> => {
    const response = await apiClient.get<UserWithStatus>(`/users/${id}`)
    return response.data
  },

  create: async (data: CreateUserData): Promise<UserWithStatus> => {
    // Use /users endpoint to create new users
    const response = await apiClient.post<UserWithStatus>('/users', {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      manager_id: data.manager_id,
      functional_unit: data.functional_unit,
      is_owner: data.is_owner,
      organisation_id: data.organization_name,
    })
    return response.data
  },

  update: async (id: number, data: Partial<User>): Promise<UserWithStatus> => {
    const response = await apiClient.put<UserWithStatus>(`/users/${id}`, { user: data })
    return response.data
  },

  assignManager: async (employeeId: number, managerId: number): Promise<UserWithStatus> => {
    // This would need a backend endpoint - for now using update
    return usersApi.update(employeeId, { manager_id: managerId } as any)
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}

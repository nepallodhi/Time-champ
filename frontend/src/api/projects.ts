import apiClient from './client'

export interface AssignedUser {
  id: number
  name: string
  email: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  organization_id: number
  created_by: number | null
  created_at: string
  updated_at: string
  assigned_users?: AssignedUser[]
}

export interface CreateProjectData {
  name: string
  description?: string
}

export interface AssignProjectData {
  project_id: number
  user_ids: number[]
}

export interface AvailableEmployee {
  id: number
  name: string
  email: string
  role: string
  manager_id: number | null
}

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects')
    return response.data
  },

  get: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`)
    return response.data
  },

  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateProjectData>): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },

  assignUserToProject: async (projectId: number, userId: number): Promise<Project> => {
    const response = await apiClient.post<Project>(`/projects/${projectId}/assign_user`, { user_id: userId })
    return response.data
  },

  assignUsersToProject: async (projectId: number, userIds: number[]): Promise<Project> => {
    const response = await apiClient.post<Project>(`/projects/${projectId}/assign_user`, { user_ids: userIds })
    return response.data
  },

  unassignUserFromProject: async (projectId: number, userId: number): Promise<Project> => {
    const response = await apiClient.delete<Project>(`/projects/${projectId}/unassign_user`, { 
      params: { user_id: userId } 
    })
    return response.data
  },

  getAvailableEmployees: async (): Promise<AvailableEmployee[]> => {
    const response = await apiClient.get<AvailableEmployee[]>('/projects/available_employees')
    return response.data
  },
}

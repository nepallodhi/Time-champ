import apiClient from './client'

export interface Alert {
  id: number
  user_id: number
  alert_type: 'idle' | 'overtime' | 'inactivity'
  message: string
  resolved: boolean
  created_at: string
  resolved_at: string | null
}

export const alertsApi = {
  list: async (): Promise<Alert[]> => {
    const response = await apiClient.get<Alert[]>('/alerts')
    return response.data
  },

  get: async (id: number): Promise<Alert> => {
    const response = await apiClient.get<Alert>(`/alerts/${id}`)
    return response.data
  },

  resolve: async (id: number): Promise<Alert> => {
    const response = await apiClient.post<Alert>(`/alerts/${id}/resolve`)
    return response.data
  },
}

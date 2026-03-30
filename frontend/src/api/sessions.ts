import apiClient from './client'

export interface WorkSession {
  id: number
  user_id: number
  project_id: number | null
  project_name?: string
  start_time: string
  end_time: string | null
  last_activity_at: string
  total_active_seconds: number
  total_idle_seconds: number
  status: 'active' | 'idle' | 'stopped'
}

export interface StartSessionData {
  project_id?: number
}

export const sessionsApi = {
  start: async (data?: StartSessionData): Promise<{ session: WorkSession }> => {
    const response = await apiClient.post<{ session: WorkSession }>('/sessions/start', data || {})
    return response.data
  },

  stop: async (sessionId: number): Promise<{ session: WorkSession }> => {
    const response = await apiClient.post<{ session: WorkSession }>(`/sessions/${sessionId}/stop`)
    return response.data
  },

  getActive: async (): Promise<{ session: WorkSession | null }> => {
    try {
      const response = await apiClient.get<{ session: WorkSession | null }>('/sessions/active')
      return response.data
    } catch (error: any) {
      // If 404, return null session (no active session)
      if (error.response?.status === 404) {
        return { session: null }
      }
      throw error
    }
  },

  list: async (): Promise<{ sessions: WorkSession[] }> => {
    const response = await apiClient.get<{ sessions: WorkSession[] }>('/sessions')
    return response.data
  },
}

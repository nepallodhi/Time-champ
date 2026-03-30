import apiClient from './client'

export interface DailySummary {
  id: number
  user_id: number
  date: string
  total_active_seconds: number
  total_idle_seconds: number
  productivity_percentage: number
  work_sessions_count: number
}

export interface ProjectBreakdown {
  project_id: number
  project_name: string
  total_active_seconds: number
  total_idle_seconds: number
  total_seconds: number
  total_active_hours: number
  total_idle_hours: number
  productivity_percentage: number
  sessions_count: number
}

export interface ProjectProductivity {
  total_project_hours: number
  average_productivity: number
  has_project_sessions: boolean
}

export interface UserReport {
  user: { id: number; name: string; email: string }
  daily_summaries: DailySummary[]
  total_active_hours: number
  total_idle_hours: number
  average_productivity: number
  project_breakdown?: ProjectBreakdown[]
  project_productivity?: ProjectProductivity
}

export const reportsApi = {
  getDaily: async (params?: { start_date?: string; end_date?: string }): Promise<DailySummary[]> => {
    const response = await apiClient.get<DailySummary[]>('/reports/daily', { params })
    return response.data
  },

  getUserReport: async (userId: number, params?: { start_date?: string; end_date?: string }): Promise<UserReport> => {
    const response = await apiClient.get<UserReport>(`/reports/user/${userId}`, { params })
    return response.data
  },
}

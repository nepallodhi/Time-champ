import apiClient from './client'

export interface DashboardStatistics {
  employees_count: number
  team_productivity: number
  project_count: number
  active_projects: number
}

export const dashboardApi = {
  getStatistics: async (): Promise<DashboardStatistics> => {
    const response = await apiClient.get<DashboardStatistics>('/dashboard/statistics')
    return response.data
  },
}

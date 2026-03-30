import apiClient from './client'
import { UserWithStatus } from './users'

export interface Team {
  manager_id: number
  manager_name: string
  employees: UserWithStatus[]
  total_members: number
}

export const teamsApi = {
  addEmployeeToTeam: async (managerId: number, employeeId: number): Promise<UserWithStatus> => {
    const response = await apiClient.post<UserWithStatus>(`/managers/${managerId}/add_employee`, { employee_id: employeeId })
    return response.data
  },

  removeEmployeeFromTeam: async (managerId: number, employeeId: number): Promise<void> => {
    await apiClient.delete(`/managers/${managerId}/employees/${employeeId}`)
  },

  getTeamMembers: async (managerId?: number): Promise<UserWithStatus[]> => {
    const allUsers = await apiClient.get<UserWithStatus[]>('/users')
    if (managerId) {
      // Filter employees by manager
      return allUsers.data.filter(user => 
        user.role === 'employee' && user.manager_id === managerId
      )
    }
    return allUsers.data.filter(user => user.role === 'employee')
  },

  getManagerTeams: async (): Promise<Team[]> => {
    const allUsers = await apiClient.get<UserWithStatus[]>('/users')
    const managers = allUsers.data.filter(u => u.role === 'manager')
    
    return managers.map(manager => ({
      manager_id: manager.id,
      manager_name: manager.name,
      employees: allUsers.data.filter(e => 
        e.role === 'employee' && e.manager_id === manager.id
      ),
      total_members: allUsers.data.filter(e => 
        e.role === 'employee' && e.manager_id === manager.id
      ).length,
    }))
  },
}

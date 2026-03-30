import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { usersApi } from '../../api/users'
import { teamsApi } from '../../api/teams'
import { useAuth } from '../../auth/useAuth'
import Button from '../../components/ui/Button'
import { UserPlus, Users, X } from 'lucide-react'

const ManagerTeamManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const employees = allUsers?.filter(u => u.role === 'employee') || []
  const myTeam = employees.filter(e => {
    const managerId = e.manager_id
    return managerId !== null && managerId !== undefined && Number(managerId) === Number(user?.id)
  })
  const unassignedEmployees = employees.filter(e => {
    const managerId = e.manager_id
    return managerId === null || managerId === undefined
  })

  const assignManagerMutation = useMutation({
    mutationFn: ({ employeeId, managerId }: { employeeId: number; managerId: number }) =>
      teamsApi.addEmployeeToTeam(managerId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // WebSocket will update presence automatically
      alert('Employee added to team successfully!')
    },
    onError: (error: any) => {
      console.error('Failed to assign manager:', error)
      const errorMsg = error.response?.data?.error || error.response?.data?.errors?.[0] || 'Failed to add employee to team.'
      alert(errorMsg)
    },
  })

  const removeFromTeamMutation = useMutation({
    mutationFn: ({ employeeId, managerId }: { employeeId: number; managerId: number }) =>
      teamsApi.removeEmployeeFromTeam(managerId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // WebSocket will update presence automatically
    },
    onError: (error: any) => {
      console.error('Failed to remove from team:', error)
      alert(error.response?.data?.error || 'Failed to remove employee from team')
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Management</h2>

      {/* My Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>My Team ({myTeam.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myTeam.length > 0 ? (
            <div className="space-y-3">
              {myTeam.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFromTeamMutation.mutate({
                      employeeId: member.id,
                      managerId: user?.id || 0
                    })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No team members yet</p>
          )}
        </CardContent>
      </Card>

      {/* Available Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Available Employees</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedEmployees.length > 0 ? (
            <div className="space-y-3">
              {unassignedEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => assignManagerMutation.mutate({
                      employeeId: employee.id,
                      managerId: user?.id || 0,
                    })}
                    disabled={assignManagerMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add to Team
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No unassigned employees</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ManagerTeamManagement

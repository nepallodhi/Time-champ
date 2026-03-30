import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/redux'
import { useOrganizationWebSocket } from '../../hooks/useWebSocket'
import { usersApi } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Users } from 'lucide-react'

const EmployeeTeamView = () => {
  const { user } = useAuth()
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  // Fetch current user's full details to get manager_id
  const { data: currentUserDetails } = useQuery({
    queryKey: ['users', user?.id],
    queryFn: () => usersApi.get(user?.id || 0),
    enabled: !!user?.id,
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  // Get manager_id from current user details or from allUsers
  const managerId = currentUserDetails?.manager_id ?? 
                    allUsers?.find(u => u.id === user?.id)?.manager_id

  // Find my manager
  const myManager = managerId ? allUsers?.find(m => 
    m.role === 'manager' && Number(m.id) === Number(managerId)
  ) : null

  // Find team members (employees with same manager)
  const teamMembers = managerId ? allUsers?.filter(member => {
    const memberManagerId = member.manager_id
    return member.role === 'employee' && 
           memberManagerId !== null && 
           memberManagerId !== undefined && 
           Number(memberManagerId) === Number(managerId) &&
           member.id !== user?.id
  }) || [] : []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Team</h2>

      {/* Manager Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>My Manager</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myManager ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{myManager.name}</p>
                <p className="text-sm text-gray-500">{myManager.email}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                MANAGER
              </span>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No manager assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Members ({teamMembers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const memberPresence = presence[member.id]
                const status = memberPresence?.status || member.status || 'offline'
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'online' ? 'bg-green-500' :
                        status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-sm capitalize text-gray-600">{status}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No team members</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeTeamView

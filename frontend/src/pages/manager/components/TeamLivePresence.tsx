import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../../hooks/redux'
import { useOrganizationWebSocket } from '../../../hooks/useWebSocket'
import { usersApi } from '../../../api/users'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

const TeamLivePresence = () => {
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  const { data: teamMembers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Active'
      case 'idle':
        return 'Idle'
      default:
        return 'Offline'
    }
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Filter to show only employees and managers (not admins)
  const team = teamMembers?.filter(member => 
    member.role === 'employee' || member.role === 'manager'
  ) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Live Presence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Work Time</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const memberPresence = presence[member.id]
                const status = memberPresence?.status || member.status || 'offline'
                return (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                        <span className="text-sm">{getStatusText(status)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{formatTime(member.work_time)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {team.length === 0 && (
            <p className="text-center py-8 text-gray-500">No team members found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TeamLivePresence

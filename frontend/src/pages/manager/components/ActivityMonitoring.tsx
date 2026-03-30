import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../../hooks/redux'
import { useOrganizationWebSocket } from '../../../hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { usersApi } from '../../../api/users'
import { reportsApi } from '../../../api/reports'
import { format } from 'date-fns'

const ActivityMonitoring = () => {
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  const { data: teamMembers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const team = teamMembers?.filter(member => 
    member.role === 'employee' || member.role === 'manager'
  ) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {team.map((member) => (
            <MemberActivityCard key={member.id} userId={member.id} member={member} />
          ))}
          {team.length === 0 && (
            <p className="text-center py-8 text-gray-500">No team members found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const MemberActivityCard = ({ userId, member }: { userId: number; member: any }) => {
  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', userId],
    queryFn: () => reportsApi.getUserReport(userId, {
      start_date: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    refetchInterval: 60000, // Refetch every minute as fallback
  })
  
  // WebSocket SESSION_UPDATE events will trigger query invalidation

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold">{member.name}</p>
          <p className="text-sm text-gray-500">{member.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Productivity</p>
          <p className="text-lg font-bold text-blue-600">
            {userReport?.average_productivity?.toFixed(1) || 0}%
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600">Active %</p>
          <p className="text-sm font-semibold text-green-600">
            {userReport?.average_productivity?.toFixed(1) || 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Idle %</p>
          <p className="text-sm font-semibold text-yellow-600">
            {userReport ? (100 - userReport.average_productivity).toFixed(1) : 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Last Activity</p>
          <p className="text-sm font-semibold">
            {member.last_activity ? new Date(member.last_activity).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ActivityMonitoring

import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/redux'
import { useOrganizationWebSocket } from '../../hooks/useWebSocket'
import { usersApi } from '../../api/users'
import { reportsApi } from '../../api/reports'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { format } from 'date-fns'

const AdminActivityMonitoring = () => {
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  // Filter out admins - only show employees and managers
  const nonAdminUsers = allUsers?.filter(u => u.role !== 'admin') || []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Activity Monitoring</h2>

      <Card>
        <CardHeader>
          <CardTitle>Employee & Manager Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Activity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {nonAdminUsers.map((user) => {
                  const userPresence = presence[user.id]
                  const status = userPresence?.status || user.status || 'offline'
                  return (
                    <UserActivityRow key={user.id} user={user} status={status} />
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const UserActivityRow = ({ user, status }: { user: any; status: string }) => {
  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', user.id],
    queryFn: () => reportsApi.getUserReport(user.id, {
      start_date: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    enabled: !!user.id,
  })

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {user.role.toUpperCase()}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <span className="text-sm capitalize">{status}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">
          {user.last_seen ? format(new Date(user.last_seen), 'MMM dd, HH:mm') : 'N/A'}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-semibold text-blue-600">
          {Number(userReport?.average_productivity || user.active_percentage || 0).toFixed(1)}%
        </span>
      </td>
    </tr>
  )
}

export default AdminActivityMonitoring

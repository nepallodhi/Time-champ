import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../../hooks/redux'
import { useOrganizationWebSocket } from '../../../hooks/useWebSocket'
import { usersApi } from '../../../api/users'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Users, Activity, Clock, TrendingUp } from 'lucide-react'

const OrgLiveOverview = () => {
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const onlineUsers = allUsers?.filter(u => {
    const userPresence = presence[u.id]
    return (userPresence?.status || u.status) === 'online'
  }).length || 0

  const idleUsers = allUsers?.filter(u => {
    const userPresence = presence[u.id]
    return (userPresence?.status || u.status) === 'idle'
  }).length || 0

  const activeSessions = allUsers?.length || 0 // TODO: Get actual active sessions count

  const avgProductivity = allUsers ? 
    allUsers.reduce((sum, u) => sum + Number(u.active_percentage || 0), 0) / allUsers.length : 0

  const metrics = [
    {
      label: 'Total Online Users',
      value: onlineUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Active Sessions',
      value: activeSessions,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Idle Users',
      value: idleUsers,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Productivity Score',
      value: `${Number(avgProductivity || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
                <div className={`${metric.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default OrgLiveOverview

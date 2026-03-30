import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/redux'
import { useOrganizationWebSocket } from '../../hooks/useWebSocket'
import { usersApi } from '../../api/users'
import { dashboardApi } from '../../api/dashboard'
import { useAuth } from '../../auth/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Users, Briefcase, Activity, TrendingUp } from 'lucide-react'

const ManagerMainDashboard = () => {
  const { user } = useAuth()
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  // Fetch dashboard statistics from API
  const { data: statistics } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: dashboardApi.getStatistics,
    refetchInterval: 60000, // Refetch every minute
  })

  const { data: teamMembers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const myTeam = teamMembers?.filter(member => {
    const managerId = member.manager_id
    return member.role === 'employee' && 
           managerId !== null && 
           managerId !== undefined && 
           Number(managerId) === Number(user?.id)
  }) || []

  const onlineTeamMembers = myTeam.filter(m => {
    const memberPresence = presence[m.id]
    return (memberPresence?.status || m.status) === 'online'
  }).length

  const metrics = [
    {
      label: 'Team Members',
      value: statistics?.employees_count ?? myTeam.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Total Projects',
      value: statistics?.project_count ?? 0,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Active Projects',
      value: statistics?.active_projects ?? 0,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Team Productivity',
      value: statistics?.team_productivity ? `${statistics.team_productivity}%` : '0%',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myTeam.length > 0 ? (
              myTeam.map((member) => {
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
              })
            ) : (
              <p className="text-center py-8 text-gray-500">No team members assigned yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ManagerMainDashboard

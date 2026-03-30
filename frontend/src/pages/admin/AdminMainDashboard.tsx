import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/redux'
import { useOrganizationWebSocket } from '../../hooks/useWebSocket'
import { usersApi } from '../../api/users'
import { reportsApi } from '../../api/reports'
import { attendanceApi } from '../../api/attendance'
import { dashboardApi } from '../../api/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Users, Activity, Clock, TrendingUp, UserPlus, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

const AdminMainDashboard = () => {
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  // Fetch dashboard statistics from API
  const { data: statistics } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: dashboardApi.getStatistics,
    refetchInterval: 60000, // Refetch every minute
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  // Filter out admins - only show employees and managers
  const nonAdminUsers = allUsers?.filter(u => u.role !== 'admin') || []

  // Get attendance data for all employees and managers (system activity)
  const { data: allUsersAttendance } = useQuery({
    queryKey: ['attendance', 'organization'],
    queryFn: async () => {
      // Get attendance for all non-admin users
      const users = nonAdminUsers || []
      const attendancePromises = users.map(user => 
        attendanceApi.getUserAttendance(user.id, {
          start_date: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          end_date: format(new Date(), 'yyyy-MM-dd'),
        }).catch(() => null)
      )
      const results = await Promise.all(attendancePromises)
      return results.filter(r => r !== null)
    },
    enabled: !!allUsers && nonAdminUsers.length > 0,
    refetchInterval: 60000,
  })

  const onlineUsers = nonAdminUsers.filter(u => {
    const userPresence = presence[u.id]
    return (userPresence?.status || u.status) === 'online'
  }).length

  const idleUsers = nonAdminUsers.filter(u => {
    const userPresence = presence[u.id]
    return (userPresence?.status || u.status) === 'idle'
  }).length

  const totalUsers = nonAdminUsers.length
  const managers = nonAdminUsers.filter(u => u.role === 'manager').length
  const employees = nonAdminUsers.filter(u => u.role === 'employee').length

  // Aggregate attendance data by date for the graph
  const attendanceByDate: Record<string, { active: number; idle: number }> = {}
  
  if (allUsersAttendance) {
    allUsersAttendance.forEach((userAttendance: any) => {
      userAttendance.attendance_records?.forEach((record: any) => {
        const dateStr = format(new Date(record.date), 'yyyy-MM-dd')
        if (!attendanceByDate[dateStr]) {
          attendanceByDate[dateStr] = { active: 0, idle: 0 }
        }
        attendanceByDate[dateStr].active += Math.round((record.active_seconds || 0) / 3600 * 10) / 10
        attendanceByDate[dateStr].idle += Math.round((record.idle_seconds || 0) / 3600 * 10) / 10
      })
    })
  }

  // Generate last 7 days and aggregate data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return format(date, 'yyyy-MM-dd')
  })

  const attendanceChartData = last7Days.map(dateStr => {
    const data = attendanceByDate[dateStr] || { active: 0, idle: 0 }
    return {
      date: format(new Date(dateStr), 'MMM dd'),
      active: data.active,
      idle: data.idle,
    }
  })

  const metrics = [
    {
      label: 'Employees',
      value: statistics?.employees_count ?? employees,
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Team Productivity',
      value: statistics?.team_productivity ? `${statistics.team_productivity}%` : '0%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Projects',
      value: statistics?.project_count ?? 0,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Projects',
      value: statistics?.active_projects ?? 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Online Users',
      value: onlineUsers,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Activity (Last 7 Days)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">System activity - Active/Idle time for employees and managers</p>
          </CardHeader>
          <CardContent>
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#10b981" name="Active Hours" />
                  <Bar dataKey="idle" fill="#f59e0b" name="Idle Hours" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No attendance data available for the last 7 days</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Trend</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Project productivity - Based on project work sessions</p>
          </CardHeader>
          <CardContent>
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="#3b82f6" name="Active Hours" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No productivity data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee & Manager Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nonAdminUsers.slice(0, 10).map((user) => {
              const userPresence = presence[user.id]
              const status = userPresence?.status || user.status || 'offline'
              return (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'online' ? 'bg-green-500' :
                      status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold capitalize">{status}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminMainDashboard

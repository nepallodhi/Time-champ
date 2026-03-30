import { useQuery } from '@tanstack/react-query'
import { useOrganizationWebSocket } from '../../hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { usersApi } from '../../api/users'
import { reportsApi } from '../../api/reports'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6']

const AdminReports = () => {
  // Use centralized WebSocket hook for real-time updates
  useOrganizationWebSocket()

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const { data: dailySummaries } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => reportsApi.getDaily({
      start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  // Filter to only employees for productivity summary
  const employees = allUsers?.filter(u => u.role === 'employee') || []

  const chartData = dailySummaries?.map((summary) => {
    const totalSeconds = summary.total_active_seconds + summary.total_idle_seconds
    const productivity = totalSeconds > 0 
      ? Math.round((summary.total_active_seconds / totalSeconds) * 100) 
      : 0
    return {
      date: format(new Date(summary.date), 'MMM dd'),
      active: Math.round(summary.total_active_seconds / 3600 * 10) / 10,
      idle: Math.round(summary.total_idle_seconds / 3600 * 10) / 10,
      productivity: productivity,
    }
  }) || []
  
  // Show message if no data
  if (chartData.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Organization Reports</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">No activity data available for the selected period</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate productivity insights
  const employeeReports = employees.map(emp => {
    // This would need to fetch reports for each employee
    return { id: emp.id, name: emp.name }
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Organization Reports</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="#10b981" name="Active Hours" />
                  <Line type="monotone" dataKey="idle" stroke="#f59e0b" name="Idle Hours" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductivityInsights employees={employees} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Productivity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeProductivityTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee Work Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeWorkSessionsTable />
        </CardContent>
      </Card>
    </div>
  )
}

const ProductivityInsights = ({ employees }: { employees: any[] }) => {
  const { data: dailySummaries } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => reportsApi.getDaily({
      start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
  })

  const avgProductivity = dailySummaries?.length 
    ? dailySummaries.reduce((sum, s) => sum + Number(s.productivity_percentage || 0), 0) / dailySummaries.length 
    : 0

  const totalActiveHours = dailySummaries?.reduce((sum, s) => sum + (Number(s.total_active_seconds || 0) / 3600), 0) || 0
  const totalIdleHours = dailySummaries?.reduce((sum, s) => sum + (Number(s.total_idle_seconds || 0) / 3600), 0) || 0

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">Average Productivity</p>
        <p className="text-2xl font-bold text-blue-600">{Number(avgProductivity || 0).toFixed(1)}%</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-green-50 rounded">
          <p className="text-xs text-gray-600">Total Active</p>
          <p className="text-lg font-semibold text-green-600">{Number(totalActiveHours || 0).toFixed(1)}h</p>
        </div>
        <div className="p-3 bg-yellow-50 rounded">
          <p className="text-xs text-gray-600">Total Idle</p>
          <p className="text-lg font-semibold text-yellow-600">{Number(totalIdleHours || 0).toFixed(1)}h</p>
        </div>
      </div>
      <div className="p-3 bg-purple-50 rounded">
        <p className="text-xs text-gray-600">Total Employees</p>
        <p className="text-lg font-semibold text-purple-600">{employees.length}</p>
      </div>
    </div>
  )
}

const EmployeeProductivityTable = () => {
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  // Only show employees
  const employees = allUsers?.filter(u => u.role === 'employee') || []

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Avg Productivity</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Active Hours</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Idle Hours</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Work Sessions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((user) => (
            <EmployeeProductivityRow key={user.id} userId={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const EmployeeWorkSessionsTable = () => {
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const employees = allUsers?.filter(u => u.role === 'employee') || []

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Employee</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Active Sessions</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Session</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((user) => (
            <EmployeeWorkSessionRow key={user.id} userId={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const EmployeeProductivityRow = ({ userId, user }: { userId: number; user: any }) => {
  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', userId],
    queryFn: () => reportsApi.getUserReport(userId, {
      start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    enabled: !!userId,
  })

  const totalSessions = userReport?.daily_summaries?.reduce((sum: number, s: any) => sum + (s.work_sessions_count || 0), 0) || 0

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-semibold text-blue-600">
          {Number(userReport?.average_productivity || 0).toFixed(1)}%
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">
          {Number(userReport?.total_active_hours || 0).toFixed(1)} hrs
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">
          {Number(userReport?.total_idle_hours || 0).toFixed(1)} hrs
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">{totalSessions}</span>
      </td>
    </tr>
  )
}

const EmployeeWorkSessionRow = ({ userId, user }: { userId: number; user: any }) => {
  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', userId],
    queryFn: () => reportsApi.getUserReport(userId, {
      start_date: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    enabled: !!userId,
  })

  const totalSessions = userReport?.daily_summaries?.reduce((sum: number, s: any) => sum + (s.work_sessions_count || 0), 0) || 0
  const lastSession = userReport?.daily_summaries?.[0]?.date
  const status = user.status || 'offline'

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">{totalSessions}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">
          {lastSession ? format(new Date(lastSession), 'MMM dd, yyyy') : 'N/A'}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {status === 'online' ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  )
}

export default AdminReports

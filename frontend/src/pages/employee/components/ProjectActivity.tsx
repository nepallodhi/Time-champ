import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { reportsApi } from '../../../api/reports'
import { useAuth } from '../../../auth/useAuth'
import { format, subDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ProjectActivity = () => {
  const { user } = useAuth()

  const { data: userReport, isLoading, isError, error } = useQuery({
    queryKey: ['reports', 'user', user?.id, 'project'],
    queryFn: () => user?.id ? reportsApi.getUserReport(user.id, {
      start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }) : null,
    enabled: !!user?.id,
    refetchInterval: 120000, // Refetch every 2 minutes (reduced from 1 minute)
    staleTime: 60000, // Consider data fresh for 1 minute
    retry: 1,
  })

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading project data...</CardContent></Card>
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading project data.</p>
          {error && <p className="text-sm text-gray-500 mt-2">{String(error)}</p>}
        </CardContent>
      </Card>
    )
  }

  const dailySummaries = userReport?.daily_summaries || []
  const totalActiveSeconds = userReport?.total_active_hours ? userReport.total_active_hours * 3600 : 0
  const totalIdleSeconds = userReport?.total_idle_hours ? userReport.total_idle_hours * 3600 : 0
  // Ensure averageProductivity is always a number
  const averageProductivity = Number(userReport?.average_productivity) || 0

  const chartData = dailySummaries.map((summary: any) => ({
    date: format(new Date(summary.date), 'MMM dd'),
    active: Math.round((summary.total_active_seconds || 0) / 3600 * 10) / 10,
    productivity: summary.productivity_percentage || 0,
  }))

  if (dailySummaries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No project activity data available for the last 30 days. Start working on projects to see your progress here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Project Hours</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatTime(totalActiveSeconds)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days - Active time only</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Productivity</p>
                <p className="text-3xl font-bold text-blue-600">
                  {averageProductivity.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Based on 8 hours per day</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Work Hours (Last 30 Days)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Time spent working on projects</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" stroke="#10b981" name="Active Hours" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Trend</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Productivity percentage over time</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="productivity" stroke="#3b82f6" name="Productivity %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProjectActivity

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { reportsApi } from '../../../api/reports'
import { useAuth } from '../../../auth/useAuth'
import { format, subDays } from 'date-fns'

const DailyWeeklyReports = () => {
  const { user } = useAuth()
  const { data: dailySummaries } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => reportsApi.getDaily({
      start_date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
  })

  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', user?.id],
    queryFn: () => user?.id ? reportsApi.getUserReport(user.id, {
      start_date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }) : null,
    enabled: !!user?.id,
  })

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const chartData = userReport?.daily_summaries?.map((summary: any) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Work Hours Trend</CardTitle>
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
              <Line type="monotone" dataKey="idle" stroke="#f59e0b" name="Idle Hours" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productivity Trend</CardTitle>
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
  )
}

export default DailyWeeklyReports

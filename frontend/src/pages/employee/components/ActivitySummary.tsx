import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { reportsApi } from '../../../api/reports'
import { format } from 'date-fns'

const COLORS = ['#10b981', '#f59e0b', '#ef4444']

const ActivitySummary = () => {
  const { data: dailySummaries, isLoading } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => reportsApi.getDaily({
      start_date: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
    refetchInterval: (query) => {
      // Don't refetch if query is in error state or currently fetching
      if (query.state.status === 'error' || query.state.isFetching) {
        return false
      }
      return 300000 // Refetch every 5 minutes (reduced from 2 minutes)
    },
    staleTime: 120000, // Consider data fresh for 2 minutes
  })
  
  // WebSocket SESSION_UPDATE events will trigger query invalidation for real-time updates

  const todayDateStr = format(new Date(), 'yyyy-MM-dd')
  const todaySummary = dailySummaries?.find(
    (summary) => {
      // API returns date as string, so we just need to handle string format
      let summaryDate: string
      if (typeof summary.date === 'string') {
        summaryDate = summary.date
      } else {
        // Fallback: try to parse as date string
        try {
          summaryDate = format(new Date(summary.date as any), 'yyyy-MM-dd')
        } catch {
          summaryDate = ''
        }
      }
      return summaryDate === todayDateStr || summaryDate.startsWith(todayDateStr)
    }
  )
  
  // Debug logging
  if (dailySummaries && dailySummaries.length > 0) {
    console.log('Daily summaries:', dailySummaries.map(s => ({
      date: s.date,
      active: s.total_active_seconds,
      productivity: s.productivity_percentage
    })))
    console.log('Today date string:', todayDateStr)
    console.log('Today summary found:', !!todaySummary)
  }

  const formatTime = (seconds: number) => {
    // Handle null, undefined, or NaN values
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0h 0m'
    }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>
  }

  // Handle errors
  if (!dailySummaries && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No activity data for today</p>
        </CardContent>
      </Card>
    )
  }

  if (!todaySummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No activity data for today</p>
        </CardContent>
      </Card>
    )
  }

  const activeSeconds = Number(todaySummary.total_active_seconds) || 0
  
  // Productivity calculation: 8 hours per day = 100%
  // 1 hour = 12.5% (1/8 * 100)
  const hoursPerDay = 8
  const secondsPerDay = hoursPerDay * 3600
  const productivityPercentage = Math.min(Math.round((activeSeconds / secondsPerDay) * 100), 100)

  const chartData = [
    {
      name: 'Active',
      value: activeSeconds,
      color: COLORS[0],
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Activity Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Active Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatTime(activeSeconds)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Project work time</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Productivity</p>
                <p className="text-2xl font-bold text-blue-600">
                  {productivityPercentage}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Based on 8 hours per day</p>
              </div>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ActivitySummary

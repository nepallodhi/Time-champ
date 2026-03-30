import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { attendanceApi } from '../../../api/attendance'
import { useAuth } from '../../../auth/useAuth'
import { format, subDays } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const AttendanceActivity = () => {
  const { user } = useAuth()

  const { data: attendanceData, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', user?.id],
    queryFn: () => attendanceApi.list({
      start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }),
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
    return <Card><CardContent className="p-6">Loading attendance data...</CardContent></Card>
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading attendance data.</p>
          {error && <p className="text-sm text-gray-500 mt-2">{String(error)}</p>}
        </CardContent>
      </Card>
    )
  }

  const attendanceRecords = attendanceData?.attendance_records || []
  const totalActiveSeconds = attendanceData?.total_active_seconds || 0
  const totalIdleSeconds = attendanceData?.total_idle_seconds || 0

  const chartData = attendanceRecords.map((record) => ({
    date: format(new Date(record.date), 'MMM dd'),
    active: Math.round((record.active_seconds || 0) / 3600 * 10) / 10,
    idle: Math.round((record.idle_seconds || 0) / 3600 * 10) / 10,
    activePercentage: record.active_percentage || 0,
  }))

  if (attendanceRecords.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No attendance data available for the last 30 days.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Active Time</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatTime(totalActiveSeconds)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Idle Time</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatTime(totalIdleSeconds)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-full">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Percentage</p>
                <p className="text-3xl font-bold text-blue-600">
                  {totalActiveSeconds + totalIdleSeconds > 0
                    ? Math.round((totalActiveSeconds / (totalActiveSeconds + totalIdleSeconds)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">System presence</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
            <CardTitle>Attendance Activity (Last 30 Days)</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Active vs Idle time when logged into system</p>
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
            <CardTitle>Active Percentage Trend</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Percentage of time active vs idle</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activePercentage" stroke="#3b82f6" name="Active %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AttendanceActivity

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUserWebSocket } from '../../hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { attendanceApi } from '../../api/attendance'
import { useAuth } from '../../auth/useAuth'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { Calendar, CheckCircle, Clock } from 'lucide-react'
import AttendanceActivity from './components/AttendanceActivity'
import ProjectActivity from './components/ProjectActivity'

const EmployeeAttendance = () => {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Use WebSocket hook for real-time session updates
  useUserWebSocket()

  const selectedDate = new Date(selectedYear, selectedMonth - 1, 1)
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  const { data: attendanceData, isLoading: attendanceLoading, isError: attendanceError } = useQuery({
    queryKey: ['attendance', user?.id, selectedMonth, selectedYear],
    queryFn: () => attendanceApi.list({
      start_date: format(monthStart, 'yyyy-MM-dd'),
      end_date: format(monthEnd, 'yyyy-MM-dd'),
    }),
    enabled: !!user?.id,
    refetchInterval: (query) => {
      // Don't refetch if query is in error state or currently fetching
      if (query.state.status === 'error' || query.state.isFetching) {
        return false
      }
      return 300000 // Refetch every 5 minutes
    },
    staleTime: 120000, // Consider data fresh for 2 minutes
    retry: 1,
  })

  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  })
  
  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  
  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']

  const attendanceRecords = attendanceData?.attendance_records || []
  const daysWithAttendance = attendanceRecords.map((r: any) => format(new Date(r.date), 'yyyy-MM-dd'))

  // Show loading state
  if (attendanceLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Attendance</h2>
        </div>
        <Card><CardContent className="p-6">Loading attendance data...</CardContent></Card>
      </div>
    )
  }

  // Show error state
  if (attendanceError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Attendance</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading attendance data. Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getDayStatus = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    if (daysWithAttendance.includes(dayStr)) {
      const record = attendanceRecords.find((r: any) => format(new Date(r.date), 'yyyy-MM-dd') === dayStr)
      if (record && (record.active_seconds > 0 || record.idle_seconds > 0)) {
        return 'present'
      }
    }
    return 'absent'
  }

  const presentDays = monthDays.filter(day => getDayStatus(day) === 'present').length
  const totalDays = monthDays.length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Attendance</h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {monthNames[month - 1]}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Present Days</p>
                <p className="text-3xl font-bold text-green-600">{presentDays}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Days</p>
                <p className="text-3xl font-bold text-gray-600">{totalDays}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-600">
                  {totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>{format(selectedDate, 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            {monthDays.map((day) => {
              const status = getDayStatus(day)
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center rounded ${
                    status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : isToday
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                  {status === 'present' && (
                    <CheckCircle className="h-3 w-3 mx-auto mt-1 text-green-600" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Activity</CardTitle>
          <p className="text-sm text-gray-500 mt-1">System presence tracking - Active when logged in, Idle when tab is closed</p>
        </CardHeader>
        <CardContent>
          <AttendanceActivity />
        </CardContent>
      </Card>

      {/* Project Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Project Activity</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Project work hours and productivity - Only counts time when working on projects</p>
        </CardHeader>
        <CardContent>
          <ProjectActivity />
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-3">
              {attendanceRecords.slice(0, 10).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{format(new Date(record.date), 'MMMM dd, yyyy')}</p>
                    <p className="text-sm text-gray-500">
                      Active: {Math.floor((record.active_seconds || 0) / 3600)}h {Math.floor(((record.active_seconds || 0) % 3600) / 60)}m | 
                      Idle: {Math.floor((record.idle_seconds || 0) / 3600)}h {Math.floor(((record.idle_seconds || 0) % 3600) / 60)}m
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      {Number(record.active_percentage || 0).toFixed(1)}%
                    </p>
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No attendance records found for this month.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeAttendance

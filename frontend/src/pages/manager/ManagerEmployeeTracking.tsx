import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '../../hooks/redux'
import { useOrganizationWebSocket } from '../../hooks/useWebSocket'
import { usersApi } from '../../api/users'
import { reportsApi } from '../../api/reports'
import { attendanceApi } from '../../api/attendance'
import { useAuth } from '../../auth/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { format, subDays, subWeeks, subMonths } from 'date-fns'
import { Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ManagerEmployeeTracking = () => {
  const { user } = useAuth()
  const presence = useAppSelector((state) => state.presence.users)
  
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const myTeam = allUsers?.filter(member => {
    const managerId = member.manager_id
    return member.role === 'employee' && 
           managerId !== null && 
           managerId !== undefined && 
           Number(managerId) === Number(user?.id)
  }) || []

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Employee Tracking</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {myTeam.map((member) => (
          <EmployeeTrackingCard key={member.id} member={member} presence={presence[member.id]} />
        ))}
      </div>

      {myTeam.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No team members to track</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const EmployeeTrackingCard = ({ member, presence }: { member: any; presence?: any }) => {
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week')
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date()
    let startDate: Date
    switch (dateRange) {
      case 'day':
        startDate = subDays(endDate, 1)
        break
      case 'week':
        startDate = subDays(endDate, 7)
        break
      case 'month':
        startDate = subDays(endDate, 30)
        break
      default:
        startDate = subDays(endDate, 7)
    }
    return {
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    }
  }
  
  const dateParams = getDateRange()
  
  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', member.id, dateParams.start_date, dateParams.end_date],
    queryFn: () => reportsApi.getUserReport(member.id, dateParams),
    enabled: !!member.id,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', member.id, dateParams.start_date, dateParams.end_date],
    queryFn: () => attendanceApi.getUserAttendance(member.id, dateParams),
    enabled: !!member.id,
  })

  const status = presence?.status || member.status || 'offline'

  const projectChartData = userReport?.daily_summaries?.map((summary: any) => ({
    date: format(new Date(summary.date), 'MMM dd'),
    productivity: Number(summary.productivity_percentage || 0),
  })) || []

  const attendanceChartData = attendanceData?.attendance_records?.map((record: any) => ({
    date: format(new Date(record.date), 'MMM dd'),
    active: Math.round((record.active_seconds || 0) / 3600 * 10) / 10,
    idle: Math.round((record.idle_seconds || 0) / 3600 * 10) / 10,
  })) || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'online' ? 'bg-green-500' :
              status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
            <CardTitle>{member.name}</CardTitle>
          </div>
          <span className="text-sm capitalize text-gray-600">{status}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Productivity - Only from Project Work Sessions */}
        {userReport?.project_productivity?.has_project_sessions ? (
          <div>
            <p className="text-sm font-medium mb-2 text-gray-700">Project Productivity</p>
            <p className="text-xs text-gray-500 mb-2">Based on project work sessions only</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Productivity</p>
                <p className="text-lg font-bold text-blue-600">
                  {Number(userReport.project_productivity.average_productivity || 0).toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-xs text-gray-600">Project Hours</p>
                <p className="text-lg font-bold text-green-600">
                  {Number(userReport.project_productivity.total_project_hours || 0).toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium mb-2 text-gray-700">Project Productivity</p>
            <p className="text-sm text-gray-500 text-center py-4">No project sessions found for this period</p>
          </div>
        )}

        {/* Attendance */}
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Attendance (System Activity)</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-xs text-gray-600">Active Time</p>
              <p className="text-lg font-bold text-green-600">
                {attendanceData ? Math.round((attendanceData.total_active_seconds || 0) / 3600 * 10) / 10 : 0}h
              </p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <p className="text-xs text-gray-600">Idle Time</p>
              <p className="text-lg font-bold text-yellow-600">
                {attendanceData ? Math.round((attendanceData.total_idle_seconds || 0) / 3600 * 10) / 10 : 0}h
              </p>
            </div>
          </div>
        </div>

        {/* Project Productivity Breakdown */}
        <div>
          <p className="text-sm font-medium mb-2 text-gray-700">Project Productivity Breakdown</p>
          {userReport?.project_breakdown && userReport.project_breakdown.length > 0 ? (
            <div className="space-y-2">
              {userReport.project_breakdown.map((project) => (
                <div key={project.project_id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-800">{project.project_name}</p>
                      <p className="text-xs text-gray-500">{project.sessions_count} session{project.sessions_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{Number(project.productivity_percentage || 0).toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">Productivity</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Active</p>
                      <p className="text-sm font-semibold text-green-600">
                        {(() => {
                          const totalSeconds = project.total_active_seconds || 0
                          const hours = Math.floor(totalSeconds / 3600)
                          const minutes = Math.floor((totalSeconds % 3600) / 60)
                          return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                        })()}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-gray-600">Idle</p>
                      <p className="text-sm font-semibold text-yellow-600">
                        {(() => {
                          const totalSeconds = project.total_idle_seconds || 0
                          const hours = Math.floor(totalSeconds / 3600)
                          const minutes = Math.floor((totalSeconds % 3600) / 60)
                          return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
                        })()}
                      </p>
                    </div>
                  </div>
                  {/* Productivity Bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          Number(project.productivity_percentage || 0) >= 80 ? 'bg-green-500' :
                          Number(project.productivity_percentage || 0) >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(Number(project.productivity_percentage || 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No project data available for this period</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Productivity Trend</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('day')}
                className={`px-3 py-1 text-xs rounded ${
                  dateRange === 'day' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-3 py-1 text-xs rounded ${
                  dateRange === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-3 py-1 text-xs rounded ${
                  dateRange === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          {projectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projectChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Productivity %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '8px'
                  }}
                  formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Productivity']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Productivity %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No productivity data available for selected period</p>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Recent Activity</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Active</span>
              <span className="font-medium">
                {member.last_seen ? format(new Date(member.last_seen), 'MMM dd, HH:mm') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Work Sessions</span>
              <span className="font-medium">
                {userReport?.daily_summaries?.reduce((sum: number, s: any) => sum + (s.work_sessions_count || 0), 0) || 0}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ManagerEmployeeTracking

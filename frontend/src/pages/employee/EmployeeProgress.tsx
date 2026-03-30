import { useQuery } from '@tanstack/react-query'
import { useUserWebSocket } from '../../hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { reportsApi } from '../../api/reports'
import { useAuth } from '../../auth/useAuth'
import { format, subDays } from 'date-fns'
import AttendanceActivity from './components/AttendanceActivity'
import ProjectActivity from './components/ProjectActivity'

const EmployeeProgress = () => {
  const { user } = useAuth()
  
  // Use WebSocket hook for real-time session updates
  useUserWebSocket()

  // Note: We don't need to wait for this query - child components handle their own data fetching
  // This query is just for potential future use, but we don't block rendering on it
  const { data: userReport } = useQuery({
    queryKey: ['reports', 'user', user?.id],
    queryFn: () => user?.id ? reportsApi.getUserReport(user.id, {
      start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }) : null,
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
  
  // WebSocket SESSION_UPDATE events will trigger query invalidation for real-time updates
  // Don't block rendering - child components handle their own loading/error states

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">My Progress</h2>
        <p className="text-gray-600">Track your attendance activity and project productivity</p>
      </div>

      {/* Attendance Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Activity</CardTitle>
          <p className="text-sm text-gray-500 mt-1">System presence - Active when logged in, Idle when tab is closed or logged out</p>
        </CardHeader>
        <CardContent>
          <AttendanceActivity />
        </CardContent>
      </Card>

      {/* Project Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Project Activity & Productivity</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Project work hours - Only counts time when actively working on projects</p>
        </CardHeader>
        <CardContent>
          <ProjectActivity />
        </CardContent>
      </Card>
    </div>
  )
}

export default EmployeeProgress

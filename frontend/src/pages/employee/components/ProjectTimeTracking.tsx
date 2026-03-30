import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { projectsApi } from '../../../api/projects'
import { reportsApi } from '../../../api/reports'
import { sessionsApi } from '../../../api/sessions'
import { useAuth } from '../../../auth/useAuth'
import { format } from 'date-fns'

const ProjectTimeTracking = () => {
  const { user } = useAuth()
  
  // WebSocket hook is called in parent EmployeeMainDashboard
  
  const { data: projects, isError: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (projects don't change often)
  })

  const { data: userReport, isError: userReportError } = useQuery({
    queryKey: ['reports', 'user', user?.id],
    queryFn: () => user?.id ? reportsApi.getUserReport(user.id, {
      start_date: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
    }) : null,
    enabled: !!user?.id,
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchInterval: (query) => {
      // Don't refetch if query is in error state or currently fetching
      if (query.state.status === 'error' || query.state.isFetching) {
        return false
      }
      return 300000 // Refetch every 5 minutes (reduced from 2 minutes)
    },
  })

  const { data: activeSession, isError: activeSessionError } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: sessionsApi.getActive,
    refetchInterval: (query) => {
      // Don't refetch if query is in error state or currently fetching
      if (query.state.status === 'error' || query.state.isFetching) {
        return false
      }
      return 60000 // Refetch every 60 seconds (reduced from 30 seconds)
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  // Fetch all work sessions to calculate time per project
  const { data: allSessions, isError: sessionsError } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.list,
    enabled: !!user?.id,
    refetchInterval: (query) => {
      // Don't refetch if query is in error state or fetching
      if (query.state.status === 'error' || query.state.isFetching) {
        return false
      }
      return 60000 // Refetch every 60 seconds (reduced from 30 seconds)
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
  
  // REMOVED: useEffect subscription that was causing infinite loop
  // WebSocket hooks already handle query invalidation properly

  // Show all projects, but highlight the active one
  const assignedProjects = projects || []
  
  // Sort to show active project first
  const sortedProjects = [...assignedProjects].sort((a, b) => {
    const aIsActive = activeSession?.session?.project_id === a.id
    const bIsActive = activeSession?.session?.project_id === b.id
    if (aIsActive && !bIsActive) return -1
    if (!aIsActive && bIsActive) return 1
    return 0
  })

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '0h 0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Calculate time per project from all work sessions
  const getProjectTime = (projectId: number) => {
    if (!allSessions?.sessions || allSessions.sessions.length === 0) return 0
    
    // Sum up all time from sessions for this project
    const projectSessions = allSessions.sessions.filter(s => s.project_id === projectId)
    
    if (projectSessions.length === 0) return 0
    
    const totalSeconds = projectSessions.reduce((sum, session) => {
      // For project sessions, count Active Time
      let activeSeconds = Number(session.total_active_seconds) || 0
      const idleSeconds = Number(session.total_idle_seconds) || 0
      const sessionTotal = activeSeconds + idleSeconds
      
      // If session has no activity logs but has duration, use session duration
      if (sessionTotal === 0 && session.start_time) {
        if (session.end_time) {
          // Stopped session: calculate duration from start to end
          const duration = Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000)
          activeSeconds = duration
        } else if (session.status === 'active') {
          // Active session: calculate from start to now
          const duration = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000)
          activeSeconds = duration
        }
      }
      
      return sum + activeSeconds
    }, 0)
    
    return totalSeconds
  }
  
  // Calculate average productivity from user report
  // Ensure it's always a number
  const averageProductivity = Number(userReport?.average_productivity) || 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Average Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {userReportError ? (
              <div>
                <p className="text-red-600 text-sm">Error loading productivity data</p>
                <p className="text-xs text-gray-500 mt-1">Please try refreshing</p>
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-blue-600">{averageProductivity.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-2">Based on project work hours</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Assigned Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projectsError ? (
            <p className="text-red-600 text-sm">Error loading projects. Please try refreshing.</p>
          ) : sortedProjects.length > 0 ? (
            <div className="space-y-4">
              {sortedProjects.map((project) => {
                const projectTime = getProjectTime(project.id)
                return (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-gray-500">{project.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Time Spent</p>
                      <p className="font-bold text-lg">
                        {formatTime(projectTime)}
                      </p>
                      {activeSession?.session?.project_id === project.id && (
                        <p className="text-xs text-green-600 mt-1">Active</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No projects assigned yet. Start a session with a project to see it here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectTimeTracking

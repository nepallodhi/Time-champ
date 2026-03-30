import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../../../hooks/redux'
import { setActiveSession } from '../../../store/slices/sessionSlice'
import { sessionsApi, WorkSession } from '../../../api/sessions'
import { projectsApi } from '../../../api/projects'
import { useAuth } from '../../../auth/useAuth'
import Button from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Play, Square, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const SessionControl = () => {
  const dispatch = useAppDispatch()
  const { activeSession } = useAppSelector((state) => state.session)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>()
  const [currentTime, setCurrentTime] = useState(Date.now()) // For live timer updates

  // WebSocket hook is called in parent EmployeeMainDashboard

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (projects don't change often)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes as fallback
  })

  const { data: activeSessionData, isLoading, isError: activeSessionError } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: sessionsApi.getActive,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    staleTime: 15000, // Consider data fresh for 15 seconds
  })

  // Sync API data with Redux (WebSocket will also update via hook)
  useEffect(() => {
    // Only update if we have data from the API (not undefined)
    if (activeSessionData !== undefined) {
      if (activeSessionData?.session) {
        dispatch(setActiveSession(activeSessionData.session))
      } else {
        // API explicitly returned null session (no active session)
        dispatch(setActiveSession(null))
      }
    }
  }, [activeSessionData, dispatch])
  
  // Use API data as primary source (most up-to-date), fallback to Redux state
  const currentSession = activeSessionData?.session ?? activeSession ?? null

  // Update timer every second for live countdown
  useEffect(() => {
    if (!currentSession) {
      // Reset timer when no session
      setCurrentTime(Date.now())
      return
    }

    // Initialize timer immediately
    setCurrentTime(Date.now())

    // Update timer every second for live display
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [currentSession])

  const startMutation = useMutation({
    mutationFn: () => sessionsApi.start(selectedProjectId ? { project_id: selectedProjectId } : undefined),
    onSuccess: (data) => {
      if (data.session) {
        dispatch(setActiveSession(data.session))
      }
      // Only invalidate queries - React Query will refetch when needed
      // WebSocket will also broadcast SESSION_STATE which will update the UI
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      // Don't use refetchQueries to avoid cascading refetches
    },
    onError: (error: any) => {
      console.error('Failed to start session:', error)
      alert(error.response?.data?.error || error.response?.data?.errors?.[0] || 'Failed to start session. Please try again.')
    },
  })

  const stopMutation = useMutation({
    mutationFn: (sessionId: number) => sessionsApi.stop(sessionId),
    onSuccess: async () => {
      // Clear Redux state immediately
      dispatch(setActiveSession(null))
      // Clear selected project
      setSelectedProjectId(undefined)
      // Only invalidate queries - React Query will refetch when needed
      // WebSocket will also broadcast SESSION_STOPPED which will update the UI
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      // Don't use refetchQueries to avoid cascading refetches and infinite loops
    },
    onError: (error: any) => {
      console.error('Failed to stop session:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0] || 
                          error.message || 
                          'Failed to stop session. Please try again.'
      alert(errorMessage)
    },
  })

  const handleStart = () => {
    startMutation.mutate()
  }

  const handleStop = () => {
    const sessionToStop = activeSession || activeSessionData?.session
    if (sessionToStop) {
      stopMutation.mutate(sessionToStop.id)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getElapsedTime = (session: WorkSession) => {
    const start = new Date(session.start_time).getTime()
    const now = currentTime // Use state for live updates
    const elapsed = Math.floor((now - start) / 1000)
    return elapsed
  }

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>
  }

  if (activeSessionError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Control</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-red-600 text-sm">Error loading session data. Please try refreshing the page.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentSession ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projects?.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No projects available. Please create a project first.</p>
              )}
            </div>
            <Button
              onClick={handleStart}
              disabled={startMutation.isPending || !selectedProjectId || projects?.length === 0}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
            {!selectedProjectId && (
              <p className="text-xs text-red-500 text-center">Please select a project to start session</p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Active Session</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatTime(getElapsedTime(currentSession))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Started {formatDistanceToNow(new Date(currentSession.start_time), { addSuffix: true })}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            
            {currentSession.project_name && (
              <div className="text-sm text-gray-600">
                Project: <span className="font-medium">{currentSession.project_name}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-600">Active Time</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatTime(currentSession.total_active_seconds)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-xs text-gray-600">Idle Time</p>
                <p className="text-lg font-semibold text-yellow-700">
                  {formatTime(currentSession.total_idle_seconds)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleStop}
              disabled={stopMutation.isPending || !currentSession}
              variant="destructive"
              className="w-full"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SessionControl

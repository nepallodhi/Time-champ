import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { usersApi } from '../api/users'
import { attendanceApi } from '../api/attendance'

/**
 * Hook to handle user online/offline status and attendance tracking
 * - Sets user status (online/offline) for presence
 * - Tracks attendance (active/idle) separately from project sessions
 * - Active: when page is visible and user is logged in
 * - Idle: when page is hidden or user closes tab
 */
export const usePageVisibility = () => {
  const { user, isAuthenticated } = useAuth()
  const lastUpdateRef = useRef<number>(Date.now())
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Update attendance activity every 30 seconds
    const updateAttendanceActivity = async (isActive: boolean) => {
      try {
        await attendanceApi.updateActivity({ is_active: isActive })
        lastUpdateRef.current = Date.now()
      } catch (error) {
        console.error('Failed to update attendance activity:', error)
      }
    }

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page is hidden - mark as idle for attendance, offline for presence
        try {
          // Update attendance: mark as idle
          await updateAttendanceActivity(false)
          
          // Update user status: set offline
          await usersApi.update(user.id, { status: 'offline' })
          
          // Clear activity interval
          if (activityIntervalRef.current) {
            clearInterval(activityIntervalRef.current)
            activityIntervalRef.current = null
          }
        } catch (error) {
          console.error('Failed to update status to offline:', error)
        }
      } else {
        // Page is visible - mark as active for attendance, online for presence
        try {
          // Update user status: set online
          await usersApi.update(user.id, { status: 'online' })
          
          // Update attendance: mark as active
          await updateAttendanceActivity(true)
          
          // Start periodic activity updates (every 30 seconds)
          if (!activityIntervalRef.current) {
            activityIntervalRef.current = setInterval(() => {
              updateAttendanceActivity(true)
            }, 30000) // Update every 30 seconds
          }
        } catch (error) {
          console.error('Failed to update status to online:', error)
        }
      }
    }

    const handleBeforeUnload = async () => {
      // Mark as idle when user closes tab/window
      if (user) {
        try {
          // Final attendance update: mark as idle
          await updateAttendanceActivity(false)
          
          // Update user status: set offline
          await usersApi.update(user.id, { status: 'offline' })
        } catch (error) {
          console.error('Failed to update status on unload:', error)
        }
      }
    }

    // Initial setup: mark as active if page is visible
    if (!document.hidden) {
      updateAttendanceActivity(true)
      activityIntervalRef.current = setInterval(() => {
        updateAttendanceActivity(true)
      }, 30000)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current)
      }
    }
  }, [user, isAuthenticated])
}

import { useEffect, useRef } from 'react'
import { useAppDispatch } from './redux'
import { setUserStatus, updateUserPresence } from '../store/slices/presenceSlice'
import { setActiveSession, updateSession } from '../store/slices/sessionSlice'
import { useAuth } from '../auth/useAuth'
import { createSubscription, disconnectConsumer } from '../websocket/actioncable'
import { useQueryClient } from '@tanstack/react-query'

export const useOrganizationWebSocket = () => {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')
    if (!token) return

    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = createSubscription(
      'OrganizationChannel',
      { organization_id: user.organization_id, token },
      {
        connected: () => {
          console.log('✅ Connected to OrganizationChannel')
        },
        disconnected: () => {
          console.log('❌ Disconnected from OrganizationChannel')
        },
        received: (data: any) => {
          console.log('📨 OrganizationChannel received:', data.type, data)

          switch (data.type) {
            case 'USER_ONLINE':
              dispatch(setUserStatus({ user_id: data.user_id, status: 'online' }))
              // Invalidate users query to refresh data
              queryClient.invalidateQueries({ queryKey: ['users'] })
              break

            case 'USER_OFFLINE':
              dispatch(setUserStatus({ user_id: data.user_id, status: 'offline' }))
              queryClient.invalidateQueries({ queryKey: ['users'] })
              break

            case 'USER_IDLE':
              dispatch(setUserStatus({ user_id: data.user_id, status: 'idle' }))
              queryClient.invalidateQueries({ queryKey: ['users'] })
              break

            case 'SESSION_UPDATE':
              if (data.user_id === user.id) {
                dispatch(updateSession({
                  id: data.session_id,
                  total_active_seconds: data.total_active_seconds,
                  total_idle_seconds: data.total_idle_seconds,
                  last_activity_at: data.last_activity_at,
                }))
              }
              // Invalidate sessions and reports for real-time updates
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
              queryClient.invalidateQueries({ queryKey: ['reports'] })
              break

            case 'SESSION_STOPPED':
              // Session was stopped, but user is still online (logged in)
              // Only invalidate queries - React Query will refetch when needed
              // Don't use refetchQueries to avoid cascading refetches
              queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
              queryClient.invalidateQueries({ queryKey: ['reports'] })
              break

            case 'INACTIVE_ALERT':
            case 'OVERTIME_ALERT':
              // Invalidate alerts to show new alerts
              queryClient.invalidateQueries({ queryKey: ['alerts'] })
              break

            default:
              console.log('Unhandled WebSocket event:', data.type)
          }
        },
      }
    )

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [user, dispatch, queryClient])
}

export const useUserWebSocket = () => {
  const dispatch = useAppDispatch()
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!user || !token) return

    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    const subscription = createSubscription(
      'UserChannel',
      { token },
      {
        connected: () => {
          console.log('✅ Connected to UserChannel')
        },
        disconnected: () => {
          console.log('❌ Disconnected from UserChannel')
        },
        received: (data: any) => {
          console.log('📨 UserChannel received:', data.type, data)

          switch (data.type) {
            case 'SESSION_STATE':
              if (data.session) {
                dispatch(setActiveSession(data.session))
                // Invalidate queries to refresh UI
                queryClient.invalidateQueries({ queryKey: ['sessions'] })
                queryClient.invalidateQueries({ queryKey: ['projects'] })
              } else {
                dispatch(setActiveSession(null))
                queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
                queryClient.invalidateQueries({ queryKey: ['sessions'] })
                queryClient.invalidateQueries({ queryKey: ['reports'] })
              }
              break

            case 'SESSION_UPDATE':
              dispatch(updateSession(data.session))
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
              queryClient.invalidateQueries({ queryKey: ['reports'] })
              break

            case 'SESSION_STOPPED':
              // Session was stopped, clear it from state
              dispatch(setActiveSession(null))
              // Only invalidate queries - React Query will refetch when needed
              // Don't use refetchQueries to avoid cascading refetches
              queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
              queryClient.invalidateQueries({ queryKey: ['reports'] })
              break

            case 'BATCH_ACTIVITY_UPDATE':
              // Refresh batch activity data immediately
              queryClient.invalidateQueries({ queryKey: ['batchActivity'] })
              // Also update session list/details
              queryClient.invalidateQueries({ queryKey: ['sessions'] })
              break

            default:
              console.log('Unhandled UserChannel event:', data.type)
          }
        },
      }
    )

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [user, token, dispatch, queryClient])
}

export const useWebSocketCleanup = () => {
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      disconnectConsumer()
    }
  }, [])
}

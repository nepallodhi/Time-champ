import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOrganizationWebSocket, useUserWebSocket } from './useWebSocket'

/**
 * Hook to enable real-time data updates for a component
 * Automatically handles WebSocket connections and query invalidation
 */
export const useRealTimeData = (options?: {
  enableUserChannel?: boolean
  enableOrgChannel?: boolean
}) => {
  const queryClient = useQueryClient()
  const { enableUserChannel = false, enableOrgChannel = true } = options || {}

  // Set up WebSocket connections
  if (enableOrgChannel) {
    useOrganizationWebSocket()
  }
  if (enableUserChannel) {
    useUserWebSocket()
  }

  // This hook ensures queries are properly invalidated on WebSocket events
  // The actual invalidation is handled in useOrganizationWebSocket and useUserWebSocket
}

import { useAuth } from '../auth/useAuth'
import { useWebSocketCleanup } from '../hooks/useWebSocket'
import { usePageVisibility } from '../hooks/usePageVisibility'

/**
 * WebSocket Provider Component
 * Ensures WebSocket connections are properly cleaned up on logout
 * Handles page visibility for online/offline status
 */
export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  // Cleanup WebSocket on unmount or logout
  useWebSocketCleanup()
  
  // Handle page visibility for online/offline status
  usePageVisibility()

  return <>{children}</>
}

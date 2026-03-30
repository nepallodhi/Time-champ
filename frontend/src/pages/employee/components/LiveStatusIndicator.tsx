import { useAppSelector } from '../../../hooks/redux'
import { useAuth } from '../../../auth/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'

const LiveStatusIndicator = () => {
  const { user } = useAuth()
  const presence = useAppSelector((state) => state.presence.users[user?.id || 0])
  
  // WebSocket hook is called in parent EmployeeMainDashboard

  const status = presence?.status || user?.status || 'offline'

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Active'
      case 'idle':
        return 'Idle'
      default:
        return 'Offline'
    }
  }

  const isActive = status === 'online'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${isActive ? 'animate-pulse' : ''}`} />
          <div>
            <p className="font-semibold">{getStatusText()}</p>
            <p className="text-sm text-gray-500">Your current status</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LiveStatusIndicator

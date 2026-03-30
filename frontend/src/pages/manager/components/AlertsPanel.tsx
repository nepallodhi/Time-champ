import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganizationWebSocket } from '../../../hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { alertsApi } from '../../../api/alerts'
import Button from '../../../components/ui/Button'
import { Bell, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

const AlertsPanel = () => {
  const queryClient = useQueryClient()
  
  // Use centralized WebSocket hook - will handle INACTIVE_ALERT and OVERTIME_ALERT
  useOrganizationWebSocket()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const resolveMutation = useMutation({
    mutationFn: alertsApi.resolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
    onError: (error: any) => {
      console.error('Failed to resolve alert:', error)
      alert(error.response?.data?.error || 'Failed to resolve alert')
    },
  })

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'idle':
      case 'inactivity':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'overtime':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Bell className="h-5 w-5 text-blue-600" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'idle':
      case 'inactivity':
        return 'border-yellow-200 bg-yellow-50'
      case 'overtime':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const unresolvedAlerts = alerts?.filter((alert) => !alert.resolved) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Alerts</span>
          {unresolvedAlerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unresolvedAlerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading alerts...</p>
        ) : unresolvedAlerts.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unresolvedAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border rounded-lg ${getAlertColor(alert.alert_type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveMutation.mutate(alert.id)}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No active alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertsPanel

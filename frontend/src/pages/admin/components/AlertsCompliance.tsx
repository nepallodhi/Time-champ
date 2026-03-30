import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { alertsApi } from '../../../api/alerts'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'

const AlertsCompliance = () => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.list,
  })

  const violations = alerts?.filter(alert => !alert.resolved) || []
  const resolved = alerts?.filter(alert => alert.resolved) || []

  const violationTypes = {
    inactivity: violations.filter(a => a.alert_type === 'inactivity').length,
    overtime: violations.filter(a => a.alert_type === 'overtime').length,
    idle: violations.filter(a => a.alert_type === 'idle').length,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts & Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">Active Violations</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{violations.length}</p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Inactivity</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{violationTypes.inactivity}</p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">Overtime</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{violationTypes.overtime}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Recent Violations</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {violations.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.alert_type === 'overtime' ? 'bg-orange-100 text-orange-800' :
                        alert.alert_type === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {alert.alert_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
                {violations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No active violations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertsCompliance

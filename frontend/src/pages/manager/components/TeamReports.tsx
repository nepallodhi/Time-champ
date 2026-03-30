import { useQuery } from '@tanstack/react-query'
import { useOrganizationWebSocket } from '../../../hooks/useWebSocket'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { usersApi } from '../../../api/users'
import { reportsApi } from '../../../api/reports'
import { format } from 'date-fns'

const TeamReports = () => {
  // Use centralized WebSocket hook
  useOrganizationWebSocket()

  const { data: teamMembers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    refetchInterval: 60000, // Refetch every minute as fallback
  })

  const team = teamMembers?.filter(member => 
    member.role === 'employee' || member.role === 'manager'
  ) || []

  // For now, use mock data or fetch all reports separately
  // In production, you'd want a bulk endpoint or use React Query's useQueries
  const productivityData = team.map((member) => ({
    name: member.name,
    productivity: member.active_percentage || 0,
  }))

  const topPerformers = [...productivityData]
    .sort((a, b) => b.productivity - a.productivity)
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="productivity" stroke="#3b82f6" name="Productivity %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{performer.name}</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {performer.productivity.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeamReports

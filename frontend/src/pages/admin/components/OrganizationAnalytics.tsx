import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { usersApi } from '../../../api/users'
import { reportsApi } from '../../../api/reports'
import { format } from 'date-fns'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6']

const OrganizationAnalytics = () => {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  // Get reports for all users
  const departmentData = [
    { name: 'Engineering', productivity: 85, users: 12 },
    { name: 'Sales', productivity: 78, users: 8 },
    { name: 'Marketing', productivity: 72, users: 6 },
    { name: 'Support', productivity: 80, users: 10 },
  ]

  const roleDistribution = users ? [
    { name: 'Admin', value: users.filter(u => u.role === 'admin').length },
    { name: 'Manager', value: users.filter(u => u.role === 'manager').length },
    { name: 'Employee', value: users.filter(u => u.role === 'employee').length },
  ] : []

  const workHourDistribution = [
    { range: '0-4h', count: 5 },
    { range: '4-6h', count: 12 },
    { range: '6-8h', count: 18 },
    { range: '8-10h', count: 8 },
    { range: '10h+', count: 3 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={departmentData}>
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
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Hour Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={workHourDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#10b981" name="Number of Users" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrganizationAnalytics

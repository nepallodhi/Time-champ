import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { usersApi, CreateUserData } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Plus, UserPlus, Users, Edit, Save, X, Trash2 } from 'lucide-react'

const AdminUserManagement = () => {
  const [showCreateManager, setShowCreateManager] = useState(false)
  const [showCreateEmployee, setShowCreateEmployee] = useState(false)
  const [assigningManager, setAssigningManager] = useState<number | null>(null)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // WebSocket will automatically update presence when user comes online
      setShowCreateManager(false)
      setShowCreateEmployee(false)
    },
    onError: (error: any) => {
      console.error('Failed to create user:', error)
      const errorMessage = error.response?.data?.errors?.[0] || error.response?.data?.error || 'Failed to create user'
      alert(errorMessage)
    },
  })

  const assignManagerMutation = useMutation({
    mutationFn: ({ employeeId, managerId }: { employeeId: number; managerId: number }) =>
      usersApi.assignManager(employeeId, managerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setAssigningManager(null)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error)
      alert(error.response?.data?.error || 'Failed to delete user')
    },
  })

  const handleDelete = (userId: number, userName: string, userRole: string) => {
    if (window.confirm(`Are you sure you want to delete ${userRole} "${userName}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId)
    }
  }

  const admins = allUsers?.filter(u => u.role === 'admin') || []
  const managers = allUsers?.filter(u => u.role === 'manager') || []
  const employees = allUsers?.filter(u => u.role === 'employee') || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreateManager(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create Manager
          </Button>
          <Button onClick={() => setShowCreateEmployee(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Employee
          </Button>
        </div>
      </div>

      {/* Create Manager Modal */}
      {showCreateManager && (
        <CreateUserModal
          role="manager"
          onClose={() => setShowCreateManager(false)}
          onSubmit={(data) => createUserMutation.mutate(data)}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Create Employee Modal */}
      {showCreateEmployee && (
        <CreateUserModal
          role="employee"
          onClose={() => setShowCreateEmployee(false)}
          onSubmit={(data) => createUserMutation.mutate(data)}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Admins ({admins.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : admins.length > 0 ? (
            <div className="space-y-3">
              {admins.map((admin) => {
                return (
                  <div key={admin.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{admin.name}</p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          ADMIN
                        </span>
                        {(admin as any).is_owner ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold" title="Organization owner cannot be deleted">
                            Owner
                          </span>
                        ) : (user?.is_owner || (admin.id === user?.id && !(admin as any).is_owner)) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(admin.id, admin.name, 'admin')}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title={admin.id === user?.id ? "Delete your own account" : "Only organization owners can delete other admins"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold" title="Only organization owners can delete other admins">
                            Protected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No admins found</p>
          )}
        </CardContent>
      </Card>

      {/* Managers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Managers ({managers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : managers.length > 0 ? (
            <div className="space-y-3">
              {managers.map((manager) => {
                const assignedEmployees = employees.filter(e => (e as any).manager_id === manager.id)
                return (
                  <div key={manager.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{manager.name}</p>
                        <p className="text-sm text-gray-500">{manager.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Managing {assignedEmployees.length} employee(s)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          MANAGER
                        </span>
                        {(manager as any).is_owner ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold" title="Organization owner cannot be deleted">
                            Owner
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(manager.id, manager.name, 'manager')}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No managers found</p>
          )}
        </CardContent>
      </Card>

      {/* Employees List with Manager Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Employees ({employees.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : employees.length > 0 ? (
            <div className="space-y-3">
              {employees.map((employee) => {
                const currentManager = managers.find(m => m.id === (employee as any).manager_id)
                const isAssigning = assigningManager === employee.id

                return (
                  <div key={employee.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                        {currentManager && (
                          <p className="text-xs text-blue-600 mt-1">
                            Assigned to: {currentManager.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isAssigning ? (
                          <div className="flex items-center space-x-2">
                            <select
                              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                              onChange={(e) => {
                                const managerId = Number(e.target.value)
                                if (managerId) {
                                  assignManagerMutation.mutate({
                                    employeeId: employee.id,
                                    managerId,
                                  })
                                } else {
                                  setAssigningManager(null)
                                }
                              }}
                              defaultValue={(employee as any).manager_id || ''}
                            >
                              <option value="">Select Manager</option>
                              {managers.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAssigningManager(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAssigningManager(employee.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {currentManager ? 'Change Manager' : 'Assign Manager'}
                            </Button>
                            {(employee as any).is_owner ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold" title="Organization owner cannot be deleted">
                                Owner
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(employee.id, employee.name, 'employee')}
                                disabled={deleteUserMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No employees found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const CreateUserModal = ({
  role,
  onClose,
  onSubmit,
  isLoading,
}: {
  role: 'manager' | 'employee'
  onClose: () => void
  onSubmit: (data: CreateUserData) => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      role,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create {role === 'manager' ? 'Manager' : 'Employee'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminUserManagement

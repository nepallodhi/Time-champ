import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { usersApi } from '../../../api/users'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { Plus, Edit, Trash2 } from 'lucide-react'

const UserManagement = () => {
  const [editingUser, setEditingUser] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
    },
  })

  const handleUpdate = (id: number, data: any) => {
    updateMutation.mutate({ id, data })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <div className="space-y-4">
            {users?.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isEditing={editingUser === user.id}
                onEdit={() => setEditingUser(user.id)}
                onCancel={() => setEditingUser(null)}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const UserRow = ({ 
  user, 
  isEditing, 
  onEdit, 
  onCancel, 
  onUpdate 
}: { 
  user: any
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onUpdate: (id: number, data: any) => void
}) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  })

  if (isEditing) {
    return (
      <div className="p-4 border rounded-lg space-y-3">
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Name"
        />
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
        />
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex space-x-2">
          <Button size="sm" onClick={() => onUpdate(user.id, formData)}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-semibold">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {user.role.toUpperCase()}
        </span>
      </div>
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default UserManagement

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { projectsApi, CreateProjectData } from '../../api/projects'
import { usersApi } from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Plus, Briefcase, Users, Edit, Trash2, X } from 'lucide-react'

const ManagerProjects = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState<number | null>(null)
  const [assigningProject, setAssigningProject] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const { data: availableEmployees } = useQuery({
    queryKey: ['projects', 'available_employees'],
    queryFn: projectsApi.getAvailableEmployees,
  })

  const { user } = useAuth()

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectData) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowCreateModal(false)
    },
    onError: (error: any) => {
      console.error('Failed to create project:', error)
      alert(error.response?.data?.errors?.[0] || 'Failed to create project')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateProjectData }) => projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditingProject(null)
    },
    onError: (error: any) => {
      console.error('Failed to update project:', error)
      alert(error.response?.data?.errors?.[0] || 'Failed to update project')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (error: any) => {
      console.error('Failed to delete project:', error)
      alert(error.response?.data?.error || 'Failed to delete project')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={projects?.find(p => p.id === editingProject)}
          onClose={() => setEditingProject(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingProject, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading projects...</p>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              availableEmployees={availableEmployees || []}
              onEdit={() => setEditingProject(project.id)}
              onDelete={() => deleteMutation.mutate(project.id)}
              isAssigning={assigningProject === project.id}
              onAssignStart={() => setAssigningProject(project.id)}
              onAssignCancel={() => setAssigningProject(null)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No projects created yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const ProjectCard = ({
  project,
  availableEmployees,
  onEdit,
  onDelete,
  isAssigning,
  onAssignStart,
  onAssignCancel,
}: {
  project: any
  availableEmployees: any[]
  onEdit: () => void
  onDelete: () => void
  isAssigning: boolean
  onAssignStart: () => void
  onAssignCancel: () => void
}) => {
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const queryClient = useQueryClient()

  const assignMutation = useMutation({
    mutationFn: ({ projectId, userIds }: { projectId: number; userIds: number[] }) =>
      projectsApi.assignUsersToProject(projectId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'available_employees'] })
      setSelectedMembers([])
      onAssignCancel()
    },
    onError: (error: any) => {
      console.error('Failed to assign project:', error)
      alert(error.response?.data?.error || error.response?.data?.errors?.[0] || 'Failed to assign project')
    },
  })

  const unassignMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) =>
      projectsApi.unassignUserFromProject(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', 'available_employees'] })
    },
    onError: (error: any) => {
      console.error('Failed to unassign project:', error)
      alert(error.response?.data?.error || 'Failed to unassign project')
    },
  })

  const handleAssign = () => {
    if (selectedMembers.length === 0) return
    assignMutation.mutate({ projectId: project.id, userIds: selectedMembers })
  }

  const handleUnassign = (userId: number) => {
    if (window.confirm('Are you sure you want to unassign this employee from the project?')) {
      unassignMutation.mutate({ projectId: project.id, userId })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{project.name}</CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-gray-600">{project.description}</p>
        )}

        {/* Show assigned employees */}
        {project.assigned_users && project.assigned_users.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Assigned Employees
            </label>
            <div className="space-y-1">
              {project.assigned_users.map((assignedUser: any) => (
                <div key={assignedUser.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{assignedUser.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnassign(assignedUser.id)}
                    disabled={unassignMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAssigning ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Available Employees
            </label>
            {availableEmployees && availableEmployees.length > 0 ? (
              <>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableEmployees.map((member) => (
                    <label key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id])
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleAssign} disabled={selectedMembers.length === 0 || assignMutation.isPending}>
                    {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={onAssignCancel}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 py-2">
                No available employees. All employees are already assigned to projects.
              </div>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onAssignStart}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Employees
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const CreateProjectModal = ({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void
  onSubmit: (data: CreateProjectData) => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: '', description: '' })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Project Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Project description..."
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Project'}
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

const EditProjectModal = ({
  project,
  onClose,
  onSubmit,
  isLoading,
}: {
  project?: any
  onClose: () => void
  onSubmit: (data: CreateProjectData) => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Project Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Project description..."
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Updating...' : 'Update Project'}
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

export default ManagerProjects

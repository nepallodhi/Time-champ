import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { usersApi } from '../../../api/users'
import Input from '../../../components/ui/Input'
import { Image, Filter } from 'lucide-react'

interface Screenshot {
  id: number
  url: string
  timestamp: string
  user_id: number
  user_name?: string
}

const ScreenshotMonitoring = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  const { data: teamMembers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [screenshots] = useState<Screenshot[]>([]) // TODO: Fetch from API

  // Mock data for demonstration
  const mockScreenshots: Screenshot[] = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    url: `https://via.placeholder.com/300x200?text=Screenshot+${i + 1}`,
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
    user_id: teamMembers?.[i % (teamMembers?.length || 1)]?.id || 1,
    user_name: teamMembers?.[i % (teamMembers?.length || 1)]?.name || 'User',
  }))

  const displayScreenshots = screenshots.length > 0 ? screenshots : mockScreenshots
  const filteredScreenshots = displayScreenshots.filter((screenshot) => {
    if (selectedUserId && screenshot.user_id !== selectedUserId) return false
    if (selectedDate && !screenshot.timestamp.startsWith(selectedDate)) return false
    return true
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screenshot Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by User
              </label>
              <select
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Users</option>
                {teamMembers?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredScreenshots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredScreenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="relative cursor-pointer group"
                onClick={() => setSelectedScreenshot(screenshot)}
              >
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={screenshot.url}
                    alt={`Screenshot ${screenshot.id}`}
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    loading="lazy"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  <p>{screenshot.user_name}</p>
                  <p>{new Date(screenshot.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No screenshots found</p>
          </div>
        )}

        {selectedScreenshot && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedScreenshot(null)}
          >
            <div className="max-w-4xl max-h-full">
              <img
                src={selectedScreenshot.url}
                alt="Screenshot"
                className="max-w-full max-h-full rounded-lg"
              />
              <p className="text-white text-center mt-4">
                {selectedScreenshot.user_name} - {new Date(selectedScreenshot.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ScreenshotMonitoring

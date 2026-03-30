import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Image } from 'lucide-react'

interface Screenshot {
  id: number
  url: string
  timestamp: string
}

const ScreenshotTimeline = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [screenshots] = useState<Screenshot[]>([]) // TODO: Fetch from API

  // Mock data for demonstration
  const mockScreenshots: Screenshot[] = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    url: `https://via.placeholder.com/300x200?text=Screenshot+${i + 1}`,
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
  }))

  const displayScreenshots = screenshots.length > 0 ? screenshots : mockScreenshots

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screenshot Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {displayScreenshots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayScreenshots.map((screenshot) => (
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
                  {new Date(screenshot.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No screenshots available</p>
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
                {new Date(selectedScreenshot.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ScreenshotTimeline

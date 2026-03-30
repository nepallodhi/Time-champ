import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { Settings } from 'lucide-react'

const PolicySettings = () => {
  const [settings, setSettings] = useState({
    idle_threshold_minutes: 5,
    screenshot_interval_minutes: 5,
    max_work_hours_per_day: 9,
    overtime_alert_threshold_hours: 9,
  })

  const handleSave = () => {
    // TODO: Implement API call to save settings
    console.log('Saving settings:', settings)
    alert('Settings saved! (This is a placeholder - implement API call)')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Policy Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Idle Threshold (minutes)
          </label>
          <Input
            type="number"
            value={settings.idle_threshold_minutes}
            onChange={(e) => setSettings({ ...settings, idle_threshold_minutes: Number(e.target.value) })}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            User will be marked as idle after this many minutes of inactivity
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Screenshot Interval (minutes)
          </label>
          <Input
            type="number"
            value={settings.screenshot_interval_minutes}
            onChange={(e) => setSettings({ ...settings, screenshot_interval_minutes: Number(e.target.value) })}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            How often to capture screenshots during active sessions
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Work Hours Per Day
          </label>
          <Input
            type="number"
            value={settings.max_work_hours_per_day}
            onChange={(e) => setSettings({ ...settings, max_work_hours_per_day: Number(e.target.value) })}
            min="1"
            max="24"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum allowed work hours per day
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overtime Alert Threshold (hours)
          </label>
          <Input
            type="number"
            value={settings.overtime_alert_threshold_hours}
            onChange={(e) => setSettings({ ...settings, overtime_alert_threshold_hours: Number(e.target.value) })}
            min="1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Alert when user exceeds this many hours
          </p>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}

export default PolicySettings


import apiClient from './client'

export interface ActivityMinute {
    id: string
    fullTimestamp: string
    activeSeconds: number
    idleSeconds: number
    keyboardEvents: number
    mouseEvents: number
    activeWindowTitle: string
    windowTitles: Record<string, number>
    activeUrl: string
    status: string
    screenshotPath?: string
}

export interface HourlyActivity {
    hour: string
    activeSeconds: number
    idleSeconds: number
    productivity_percentage: number
    topApp: string
}

export interface Screenshot {
    id: number
    session_id: number
    user_id: number
    timestamp: string
    created_at: string
    file_path: string
    image_url: string
}

export interface BatchActivityResponse {
    sessionId: number
    timestamp: string
    totalMinutes: number
    aggregatedData: ActivityMinute[]
    hourlyActivity: HourlyActivity[]
    summary: {
        userId: string
        totalActiveSeconds: number
        totalIdleSeconds: number
        totalKeyboardEvents: number;
        totalMouseEvents: number;
        screenshots: Screenshot[]
    }
}

export const activityApi = {
    getBatchActivity: async (sessionId: number, date?: string) => {
        const params = date ? { date } : {}
        const response = await apiClient.get<BatchActivityResponse>(`/sessions/${sessionId}/batch_activity`, { params })
        return response.data
    }
}

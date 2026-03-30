import apiClient from './client'

export interface AttendanceRecord {
  id: number
  user_id: number
  date: string
  check_in: string | null
  check_out: string | null
  active_seconds: number
  idle_seconds: number
  total_seconds: number
  active_percentage: number
}

export interface AttendanceResponse {
  attendance_records: AttendanceRecord[]
  total_active_seconds: number
  total_idle_seconds: number
}

export interface UserAttendanceResponse {
  user: { id: number; name: string; email: string }
  attendance_records: AttendanceRecord[]
  total_active_seconds: number
  total_idle_seconds: number
}

export const attendanceApi = {
  list: async (params?: { start_date?: string; end_date?: string }): Promise<AttendanceResponse> => {
    const response = await apiClient.get<AttendanceResponse>('/attendance', { params })
    return response.data
  },

  getUserAttendance: async (
    userId: number,
    params?: { start_date?: string; end_date?: string }
  ): Promise<UserAttendanceResponse> => {
    const response = await apiClient.get<UserAttendanceResponse>(`/attendance/${userId}`, { params })
    return response.data
  },

  updateActivity: async (data: { is_active: boolean }): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>('/attendance/update_activity', data)
    return response.data
  },
}

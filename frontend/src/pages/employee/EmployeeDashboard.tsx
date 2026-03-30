import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import EmployeeMainDashboard from './EmployeeMainDashboard'
import EmployeeTeamView from './EmployeeTeamView'
import EmployeeProgress from './EmployeeProgress'
import EmployeeAttendance from './EmployeeAttendance'
import EmployeeProfile from './EmployeeProfile'
import { LayoutDashboard, Users, TrendingUp, Calendar, User } from 'lucide-react'

const EmployeeDashboard = () => {
  const navItems = [
    { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/team', label: 'My Team', icon: Users },
    { path: '/employee/progress', label: 'My Progress', icon: TrendingUp },
    { path: '/employee/attendance', label: 'Attendance', icon: Calendar },
    { path: '/employee/profile', label: 'Profile', icon: User },
  ]

  return (
    <DashboardLayout title="Employee Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeMainDashboard />} />
        <Route path="team" element={<EmployeeTeamView />} />
        <Route path="progress" element={<EmployeeProgress />} />
        <Route path="attendance" element={<EmployeeAttendance />} />
        <Route path="profile" element={<EmployeeProfile />} />
      </Routes>
    </DashboardLayout>
  )
}

export default EmployeeDashboard

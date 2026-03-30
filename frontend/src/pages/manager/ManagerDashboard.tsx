import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import ManagerMainDashboard from './ManagerMainDashboard'
import ManagerProjects from './ManagerProjects'
import ManagerTeamManagement from './ManagerTeamManagement'
import ManagerEmployeeTracking from './ManagerEmployeeTracking'
import ManagerProfile from './ManagerProfile'
import { LayoutDashboard, Briefcase, Users, Activity, User } from 'lucide-react'

const ManagerDashboard = () => {
  const navItems = [
    { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/manager/projects', label: 'Projects', icon: Briefcase },
    { path: '/manager/team', label: 'Team Management', icon: Users },
    { path: '/manager/tracking', label: 'Employee Tracking', icon: Activity },
    { path: '/manager/profile', label: 'Profile', icon: User },
  ]

  return (
    <DashboardLayout title="Manager Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<ManagerMainDashboard />} />
        <Route path="projects" element={<ManagerProjects />} />
        <Route path="team" element={<ManagerTeamManagement />} />
        <Route path="tracking" element={<ManagerEmployeeTracking />} />
        <Route path="profile" element={<ManagerProfile />} />
      </Routes>
    </DashboardLayout>
  )
}

export default ManagerDashboard

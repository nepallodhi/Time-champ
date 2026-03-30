import { Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import AdminMainDashboard from './AdminMainDashboard'
import AdminUserManagement from './AdminUserManagement'
import AdminActivityMonitoring from './AdminActivityMonitoring'
import AdminReports from './AdminReports'
import { LayoutDashboard, Users, Activity, FileText } from 'lucide-react'

const AdminDashboard = () => {
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/activity', label: 'Activity Monitor', icon: Activity },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ]

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminMainDashboard />} />
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="activity" element={<AdminActivityMonitoring />} />
        <Route path="reports" element={<AdminReports />} />
      </Routes>
    </DashboardLayout>
  )
}

export default AdminDashboard

import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Admin routes
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUserManagement from './pages/admin/AdminUserManagement'
import AdminActivityMonitoring from './pages/admin/AdminActivityMonitoring'
import AdminReports from './pages/admin/AdminReports'

// Manager routes
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerProjects from './pages/manager/ManagerProjects'
import ManagerTeamManagement from './pages/manager/ManagerTeamManagement'
import ManagerEmployeeTracking from './pages/manager/ManagerEmployeeTracking'

// Employee routes
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeTeamView from './pages/employee/EmployeeTeamView'
import EmployeeProgress from './pages/employee/EmployeeProgress'
import EmployeeAttendance from './pages/employee/EmployeeAttendance'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Manager Routes */}
      <Route
        path="/manager/*"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Employee Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { setCredentials, logout, updateUser } from '../store/slices/authSlice'
import { authApi, User } from '../api/auth'
import { usersApi } from '../api/users'
import { attendanceApi } from '../api/attendance'
import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth)

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password })
      dispatch(setCredentials(response))
      
      // Update user status to online on login
      if (response.user) {
        dispatch(updateUser({ ...response.user, status: 'online' }))
      }
      
      // Redirect based on role
      const role = response.user.role
      if (role === 'admin') {
        navigate('/admin/dashboard')
      } else if (role === 'manager') {
        navigate('/manager/dashboard')
      } else {
        navigate('/employee/dashboard')
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (data: {
    email: string
    password: string
    name: string
    role: 'admin' | 'manager' | 'employee'
    organization_name: string
  }) => {
    try {
      const response = await authApi.register({
        user: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
        },
        organization_name: data.organization_name,
      })
      dispatch(setCredentials(response))
      
      // Redirect based on role
      const role = response.user.role
      if (role === 'admin') {
        navigate('/admin/dashboard')
      } else if (role === 'manager') {
        navigate('/manager/dashboard')
      } else {
        navigate('/employee/dashboard')
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  const handleLogout = async () => {
    // Check out attendance and update user status to offline before logout
    if (user) {
      try {
        // Final attendance update: mark as idle
        await attendanceApi.updateActivity({ is_active: false })
        // Update user status to offline
        await usersApi.update(user.id, { status: 'offline' })
      } catch (error) {
        console.error('Failed to update status on logout:', error)
      }
    }
    dispatch(logout())
    navigate('/login')
  }

  const updateUserData = (userData: Partial<User>) => {
    dispatch(updateUser(userData))
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout: handleLogout,
    updateUser: updateUserData,
  }
}

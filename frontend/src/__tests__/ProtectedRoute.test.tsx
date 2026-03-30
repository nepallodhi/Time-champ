import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ProtectedRoute } from '../components/ProtectedRoute'
import authReducer from '../store/slices/authSlice'

const createMockStore = (isAuthenticated: boolean, role: string = 'employee') => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: isAuthenticated ? {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: role as any,
          organization_id: 1,
        } : null,
        token: isAuthenticated ? 'mock-token' : null,
        isAuthenticated,
      },
    },
  })
}

describe('ProtectedRoute', () => {
  it('redirects to login when not authenticated', () => {
    const store = createMockStore(false)
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    )
    // Should redirect, so protected content shouldn't be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders content when authenticated', () => {
    const store = createMockStore(true)
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('allows access when role matches', () => {
    const store = createMockStore(true, 'admin')
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute allowedRoles={['admin']}>
            <div>Admin Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    )
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})

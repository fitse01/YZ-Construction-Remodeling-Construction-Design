import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useAuth, AuthProvider } from '@/admin/contexts/AuthContext'

export const Route = createFileRoute('/admin')({
  component: AdminLayoutWrapper,
})

function AdminLayoutWrapper() {
  return (
    <AuthProvider>
      <AdminProtectedRoute />
    </AuthProvider>
  )
}

function AdminProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-medium">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          <span>Loading session...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

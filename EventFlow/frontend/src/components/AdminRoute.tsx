import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canManageMasterData } from '../lib/authorization'

export default function AdminRoute() {
  const { loading, appUser, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-lg font-medium">Loading your session…</p>
          <p className="mt-2 text-slate-600">Checking your authorization.</p>
        </div>
      </div>
    )
  }

  if (!appUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!canManageMasterData(role)) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
        <div className="max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-rose-900">Access denied</h1>
          <p className="mt-4 text-sm text-rose-900">You do not have permission to manage configuration.</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

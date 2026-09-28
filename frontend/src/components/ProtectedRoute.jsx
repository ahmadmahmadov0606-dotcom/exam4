import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './Loader'

export default function ProtectedRoute({ vendor = false }) {
  const { user, loading, isVendor } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (vendor && !isVendor) return <Navigate to="/" replace />
  return <Outlet />
}

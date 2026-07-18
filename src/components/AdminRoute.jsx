import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingOverlay from './LoadingOverlay'

export default function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingOverlay active variant="fullscreen" label="Loading admin" />
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="admin-loading">
        <p>Access denied. Your account does not have admin role.</p>
      </div>
    )
  }

  return children
}

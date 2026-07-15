import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { session, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    )
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

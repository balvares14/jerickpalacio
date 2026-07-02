import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/admin" className="admin-brand">
            Portfolio Admin
          </Link>
          <div className="admin-topbar-actions">
            <span className="admin-muted">{profile?.email}</span>
            <Link to="/" className="admin-btn admin-btn-ghost" target="_blank" rel="noreferrer">
              View site
            </Link>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

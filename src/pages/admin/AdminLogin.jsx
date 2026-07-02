import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { session, isAdmin, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const prof = await signIn(email, password)
      if (prof?.role !== 'admin') {
        await signOut()
        setError('This account does not have admin access.')
        return
      }
      const dest = location.state?.from?.pathname || '/admin'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-card admin-login-form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p className="admin-muted">Sign in with your Supabase Auth account.</p>

        {error && <p className="admin-error">{error}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <Link to="/" className="admin-link-back">
          ← Back to site
        </Link>
      </form>
    </div>
  )
}

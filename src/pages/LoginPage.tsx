import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { UsageGuide } from '../components/UsageGuide'
import { interpolate, ja } from '../locales'

export function LoginPage() {
  const { user, login } = useAuth()
  const { push } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const ok = login(email, password)
    if (!ok) {
      setError(ja.login.errorInvalid)
      return
    }
    push(ja.login.notifySignedInTitle, interpolate(ja.login.notifySignedInBody, { email }))
    navigate(from, { replace: true })
  }

  return (
    <div className="login-wrap">
      <div className="login-column">
        <div className="login-card">
          <h1 className="login-title">{ja.login.title}</h1>
          <p className="login-lead">{ja.login.lead}</p>
          <form className="form-stack" onSubmit={onSubmit}>
            <label className="field">
              <span>{ja.login.email}</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{ja.login.password}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn primary wide">
              {ja.login.submit}
            </button>
          </form>
          <details className="demo-hint">
            <summary>{ja.login.demoSummary}</summary>
            <ul>
              <li>
                <code>admin@demo.com</code> / <code>demo123</code> ({ja.roles.admin})
              </li>
              <li>
                <code>manager@demo.com</code> / <code>demo123</code>
              </li>
              <li>
                <code>sales@demo.com</code> / <code>demo123</code>
              </li>
              <li>
                <code>staff@demo.com</code> / <code>demo123</code>
              </li>
            </ul>
          </details>
        </div>
        <UsageGuide />
      </div>
    </div>
  )
}

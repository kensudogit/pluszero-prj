import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { REGISTERABLE_ROLES, useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { UsageGuide } from '../components/UsageGuide'
import { interpolate, ja } from '../locales'
import type { Role } from '../types'

export function LoginPage() {
  const j = ja.login
  const { user, login, register } = useAuth()
  const { push } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPassword2, setRegPassword2] = useState('')
  const [regRole, setRegRole] = useState<Role>('staff')

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const ok = login(email, password)
    if (!ok) {
      setError(j.errorInvalid)
      return
    }
    push(j.notifySignedInTitle, interpolate(j.notifySignedInBody, { email }))
    navigate(from, { replace: true })
  }

  function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!regName.trim()) {
      setError(j.registerErrorName)
      return
    }
    if (regPassword !== regPassword2) {
      setError(j.registerErrorPasswordMismatch)
      return
    }
    const res = register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
    })
    if (!res.ok) {
      if (res.code === 'duplicate') setError(j.registerErrorDuplicate)
      else if (res.code === 'weak') setError(j.registerErrorWeakPassword)
      else setError(j.registerErrorName)
      return
    }
    push(
      j.registerSuccessNotifyTitle,
      interpolate(j.registerSuccessNotifyBody, { name: res.user.name, email: res.user.email })
    )
    navigate(from, { replace: true })
  }

  return (
    <div className="login-wrap">
      <div className="login-page-top">
        <UsageGuide placement="top" />
      </div>
      <div className="login-column">
        <div className="login-card">
          <div className="login-brand">
            <img src="/pc.png" alt="" className="login-logo" width={64} height={64} decoding="async" />
            <h1 className="login-title">{j.title}</h1>
          </div>

          {mode === 'login' ? (
            <>
              <p className="login-lead">{j.lead}</p>
              <form className="form-stack" onSubmit={onLogin}>
                <label className="field">
                  <span>{j.email}</span>
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>{j.password}</span>
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
                  {j.submit}
                </button>
              </form>
              <details className="demo-hint">
                <summary>{j.demoSummary}</summary>
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
              <p className="login-footer-link">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setMode('register')
                    setError('')
                  }}
                >
                  {j.toggleRegister}
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="login-back-row">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setMode('login')
                    setError('')
                  }}
                >
                  {j.backToLogin}
                </button>
              </p>
              <p className="login-lead">{j.registerLead}</p>
              <h2 className="login-subtitle">{j.registerTitle}</h2>
              <form className="form-stack" onSubmit={onRegister}>
                <label className="field">
                  <span>{j.displayName}</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>{j.email}</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>{j.roleLabel}</span>
                  <select value={regRole} onChange={(e) => setRegRole(e.target.value as Role)}>
                    {REGISTERABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ja.roles[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{j.password}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </label>
                <label className="field">
                  <span>{j.passwordConfirm}</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={regPassword2}
                    onChange={(e) => setRegPassword2(e.target.value)}
                    required
                    minLength={8}
                  />
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <button type="submit" className="btn primary wide">
                  {j.registerSubmit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

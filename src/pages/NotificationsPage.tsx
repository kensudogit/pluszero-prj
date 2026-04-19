import { useNotifications } from '../contexts/NotificationContext'
import { ja } from '../locales'

export function NotificationsPage() {
  const j = ja.notifications
  const { items, markRead, markAllRead } = useNotifications()

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1>{j.title}</h1>
          <p className="page-desc">{j.desc}</p>
        </div>
        <button type="button" className="btn secondary" onClick={markAllRead} disabled={items.length === 0}>
          {j.markAllRead}
        </button>
      </header>

      <ul className="notice-list card">
        {items.length === 0 ? (
          <li className="notice-empty muted">{j.empty}</li>
        ) : (
          items.map((n) => (
            <li key={n.id} className={n.read ? 'notice read' : 'notice'}>
              <div className="notice-head">
                <strong>{n.title}</strong>
                <time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString('ja-JP')}</time>
              </div>
              <p>{n.body}</p>
              {!n.read ? (
                <button type="button" className="link-btn" onClick={() => markRead(n.id)}>
                  {j.markRead}
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

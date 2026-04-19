import { useNotifications } from '../contexts/NotificationContext'

export function NotificationsPage() {
  const { items, markRead, markAllRead } = useNotifications()

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1>Alerts</h1>
          <p className="page-desc">Login events, imports, and exports appear here.</p>
        </div>
        <button type="button" className="btn secondary" onClick={markAllRead} disabled={items.length === 0}>
          Mark all read
        </button>
      </header>

      <ul className="notice-list card">
        {items.length === 0 ? (
          <li className="notice-empty muted">No notifications yet.</li>
        ) : (
          items.map((n) => (
            <li key={n.id} className={n.read ? 'notice read' : 'notice'}>
              <div className="notice-head">
                <strong>{n.title}</strong>
                <time dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleString()}</time>
              </div>
              <p>{n.body}</p>
              {!n.read ? (
                <button type="button" className="link-btn" onClick={() => markRead(n.id)}>
                  Mark read
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

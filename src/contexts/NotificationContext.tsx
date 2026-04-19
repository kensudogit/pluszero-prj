import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppNotification } from '../types'
import { loadNotifications, saveNotifications } from '../storage/appStorage'

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

type NotificationState = {
  items: AppNotification[]
  unreadCount: number
  push: (title: string, body: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationState | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>(() => loadNotifications())

  const push = useCallback((title: string, body: string) => {
    const n: AppNotification = {
      id: uid(),
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    }
    setItems((prev) => {
      const next = [n, ...prev]
      saveNotifications(next)
      return next
    })
  }, [])

  const markRead = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, read: true } : i))
      saveNotifications(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((i) => ({ ...i, read: true }))
      saveNotifications(next)
      return next
    })
  }, [])

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])

  const value = useMemo(
    () => ({ items, unreadCount, push, markRead, markAllRead }),
    [items, unreadCount, push, markRead, markAllRead]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

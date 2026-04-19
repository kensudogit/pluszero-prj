import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RequireAccess } from './components/RequireAccess'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CasesPage } from './pages/CasesPage'
import { TasksPage } from './pages/TasksPage'
import { CustomersPage } from './pages/CustomersPage'
import { DataExchangePage } from './pages/DataExchangePage'
import { NotificationsPage } from './pages/NotificationsPage'
import { PortalPage } from './pages/PortalPage'
import { ReportsPage } from './pages/ReportsPage'
import './app-shell.css'

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="portal" element={<PortalPage />} />
                <Route path="cases" element={<CasesPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route
                  path="customers"
                  element={
                    <RequireAccess menuKey="customers">
                      <CustomersPage />
                    </RequireAccess>
                  }
                />
                <Route
                  path="data"
                  element={
                    <RequireAccess menuKey="data">
                      <DataExchangePage />
                    </RequireAccess>
                  }
                />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

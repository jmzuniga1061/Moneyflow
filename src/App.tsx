import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Sidebar from './components/Sidebar'
import { AuthProvider } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Ingresos from './pages/Ingresos'
import ProfileSettings from './pages/ProfileSettings'
import Reports from './pages/Reports'
import Egresos from './pages/Egresos'

function AppShell() {
  const { theme } = useTheme()
  const location = useLocation()
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className={`app-theme ${theme} min-h-screen text-slate-900`}>
      {!isPublicRoute ? <Navbar /> : null}
      <div className="mx-auto flex max-w-[1600px]">
        {!isPublicRoute ? <Sidebar /> : null}
        <main className="min-h-[calc(100vh-73px)] min-w-0 flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/egresos"
              element={
                <PrivateRoute>
                  <Egresos />
                </PrivateRoute>
              }
            />
            <Route path="/transactions" element={<Navigate to="/egresos" replace />} />
            <Route
              path="/ingresos"
              element={
                <PrivateRoute>
                  <Ingresos />
                </PrivateRoute>
              }
            />
            <Route path="/sale-notes" element={<Navigate to="/ingresos" replace />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfileSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

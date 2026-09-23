import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ children, role = 'superusuario' }: { children: ReactNode; role?: 'superusuario' }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-sm text-slate-500">Verificando permisos...</div>
  if (!user || user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

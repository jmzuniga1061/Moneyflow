import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Egresos', to: '/egresos' },
  { label: 'Ingresos', to: '/ingresos' },
  { label: 'Reportes', to: '/reports' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { user, signOut, isSuperuser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const avatarUrl = user?.avatar_url ?? null
  const initials = (user?.email ?? 'U').charAt(0).toUpperCase()
  const visibleNavItems = isSuperuser ? [...navItems, { label: 'Notas de venta', to: '/notas-venta' }] : navItems

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && !userMenuRef.current?.contains(target)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    try {
      await signOut()
      setMenuOpen(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Error signing out', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3" aria-label="Ir al dashboard">
          <img
            src={theme === 'dark' ? '/moneyflow-mark-dark.svg' : '/moneyflow-mark-light.svg'}
            alt="MoneyFlow"
            className="h-9 w-9"
          />
          <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:block">MoneyFlow</span>
        </NavLink>

        <nav className="flex items-center gap-2">
          <div className={`${mobileOpen ? 'flex' : 'hidden'} absolute left-0 right-0 top-full flex-col border-b border-slate-200 bg-white p-4 shadow-xl sm:static sm:flex sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none`}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${mobileOpen ? 'flex' : 'hidden'} rounded-lg px-3 py-2 text-sm font-medium transition sm:flex ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            title={`Modo ${theme === 'dark' ? 'oscuro' : 'claro'}`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>

          <div ref={userMenuRef} className="relative ml-1 flex">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm transition hover:border-slate-300 hover:bg-slate-200"
              aria-label="Abrir menú de usuario"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar del usuario" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-slate-700">{initials}</span>
              )}
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5">
                <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-left">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cuenta</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{user?.email ?? 'Usuario'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/profile')
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <span>Configuración de perfil</span>
                  <span aria-hidden="true">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <span>Cerrar sesión</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg text-slate-700"
            aria-label="Abrir navegación"
          >
            {mobileOpen ? '×' : '☰'}
          </button>
        </div>
      </div>
    </header>
  )
}

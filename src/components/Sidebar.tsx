import { NavLink } from 'react-router-dom'

const items = [
  { label: 'Dashboard', to: '/' },
  { label: 'Egresos', to: '/egresos' },
  { label: 'Ingresos', to: '/ingresos' },
  { label: 'Reportes', to: '/reports' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4 lg:flex">
      <div className="mb-6 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Menú</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

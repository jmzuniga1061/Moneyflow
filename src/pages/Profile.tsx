import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Cuenta</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Perfil</h1>
      </div>

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-lg font-semibold text-white">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar del usuario" className="h-full w-full object-cover" />
            ) : (
              <span>{(user?.email ?? 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-500">Usuario</p>
            <p className="text-xl font-semibold text-slate-900">{user?.email ?? 'Sin email'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          Configuración de perfil disponible próximamente.
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getUsersBasic, updateUserRole } from '../services/api'

type BasicUser = { id: string; email?: string | null; nickname?: string | null; role: 'usuario' | 'superusuario' }

export default function UserManagement() {
  const [users, setUsers] = useState<BasicUser[]>([])
  const [error, setError] = useState('')
  const load = async () => { try { setUsers((await getUsersBasic()) as BasicUser[]) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.') } }
  useEffect(() => { void load() }, [])
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Superusuario</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Gestión de usuarios</h1><p className="mt-2 text-sm text-slate-500">Solo se muestran nickname, correo y rol.</p></div>{error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Usuario</th><th className="p-4">Rol</th><th className="p-4">Acción</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-200"><td className="p-4"><p className="font-semibold text-slate-900">{user.nickname || 'Sin nickname'}</p><p className="text-slate-500">{user.email}</p></td><td className="p-4">{user.role}</td><td className="p-4"><select value={user.role} onChange={async (event) => { await updateUserRole(user.id, event.target.value as BasicUser['role']); await load() }} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"><option value="usuario">Usuario</option><option value="superusuario">Superusuario</option></select></td></tr>)}</tbody></table></div></div>
}

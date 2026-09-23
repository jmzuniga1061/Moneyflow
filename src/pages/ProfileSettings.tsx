import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getIngresos, getTransactions } from '../services/api'
import { supabase } from '../services/supabaseClient'

type Tab = 'profile' | 'security' | 'preferences' | 'privacy'

type Settings = {
  nickname: string
  language: string
  notifications: { spending: boolean; savings: boolean }
  dashboard: { metrics: boolean; charts: boolean; recommendations: boolean }
}

const defaultSettings: Settings = { nickname: '', language: 'es', notifications: { spending: true, savings: true }, dashboard: { metrics: true, charts: true, recommendations: true } }

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">{children}</section>
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`rounded-lg border px-3 py-2.5 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{children}</div>
}

export default function ProfileSettings() {
  const { user, isSuperuser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('profile')
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const metadata = (data.user?.user_metadata ?? {}) as Record<string, any>
      setSettings({ nickname: typeof metadata.nickname === 'string' ? metadata.nickname : '', language: typeof metadata.language === 'string' ? metadata.language : 'es', notifications: { spending: metadata.notifications?.spending !== false, savings: metadata.notifications?.savings !== false }, dashboard: { metrics: metadata.dashboard?.metrics !== false, charts: metadata.dashboard?.charts !== false, recommendations: metadata.dashboard?.recommendations !== false } })
      const factors = await supabase.auth.mfa.listFactors()
      setMfaEnabled(Boolean(factors.data?.totp?.some((factor) => factor.status === 'verified')))
    }
    void load()
  }, [])

  const feedback = (nextMessage = '', nextError = '') => { setMessage(nextMessage); setError(nextError) }

  const saveSettings = async (next: Settings) => {
    setSaving(true)
    feedback()
    const { error: updateError } = await supabase.auth.updateUser({ data: next })
    setSaving(false)
    if (updateError) feedback('', updateError.message)
    else { setSettings(next); setMessage('Configuración guardada.') }
  }

  const selectAvatar = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { feedback('', 'Selecciona una imagen válida de máximo 2 MB.'); return }
    setAvatarFile(file)
    setAvatar(URL.createObjectURL(file))
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return
    setSaving(true)
    feedback()
    try {
      const path = `${user.id}/avatar-${Date.now()}-${avatarFile.name}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      if (updateError) throw updateError
      setAvatarFile(null)
      setMessage('Foto de perfil actualizada.')
    } catch (uploadError) {
      console.error('Error al subir avatar:', uploadError)
      feedback('', 'No se pudo subir la foto. Verifica que exista el bucket público "avatars" en Supabase Storage.')
    } finally { setSaving(false) }
  }

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || password !== confirmPassword) { feedback('', 'La contraseña debe tener 8 caracteres, mayúscula, minúscula, número y coincidir.'); return }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (updateError) feedback('', updateError.message)
    else { setPassword(''); setConfirmPassword(''); setMessage('Contraseña actualizada.') }
  }

  const toggleMfa = async () => {
    if (mfaEnabled) { feedback('', 'Para desactivar 2FA usa la pestaña Seguridad y confirma desde tu autenticador.'); return }
    const { error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'MoneyFlow Authenticator' })
    if (enrollError) feedback('', enrollError.message)
    else { setMfaEnabled(true); setMessage('Factor 2FA creado. Verifícalo desde Supabase Authenticator antes de usarlo.') }
  }

  const downloadData = async () => {
    const [ingresos, egresos] = await Promise.all([getIngresos(), getTransactions()])
    const blob = new Blob([JSON.stringify({ user: { id: user?.id, email: user?.email, nickname: settings.nickname }, ingresos, egresos }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'moneyflow-datos.json'; anchor.click(); URL.revokeObjectURL(url); setMessage('Datos descargados.')
  }

  const tabs: Array<[Tab, string]> = [['profile', 'Perfil'], ['security', 'Seguridad'], ['preferences', 'Preferencias'], ['privacy', 'Privacidad y datos']]
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><header><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Cuenta</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Configuración del perfil</h1><p className="mt-2 text-sm text-slate-500">Administra tu identidad, seguridad y experiencia en MoneyFlow.</p>{isSuperuser ? <Link to="/usuarios" className="mt-4 inline-flex rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">Administrar usuarios</Link> : null}</header><nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1">{tabs.map(([id, label]) => <button key={id} type="button" onClick={() => { setTab(id); feedback() }} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</nav>{message ? <Notice>{message}</Notice> : null}{error ? <Notice error>{error}</Notice> : null}{tab === 'profile' ? <div className="space-y-6"><Card><h2 className="text-xl font-semibold text-slate-900">Perfil</h2><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center"><button type="button" onClick={() => fileRef.current?.click()} className="h-24 w-24 overflow-hidden rounded-full border-4 border-amber-300 bg-slate-900"><img src={avatar ?? '/moneyflow-mark-dark.svg'} alt="Avatar" className="h-full w-full object-cover" /></button><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => selectAvatar(event.target.files?.[0])} /><div><p className="font-semibold text-slate-900">{user?.email}</p><p className="text-sm text-slate-500">JPG, PNG o WEBP, máximo 2 MB.</p>{avatarFile ? <button type="button" onClick={() => void uploadAvatar()} disabled={saving} className="mt-3 rounded-lg bg-amber-400 px-4 py-2 font-bold text-slate-950">Guardar foto</button> : null}</div></div></Card><Card><h2 className="text-xl font-semibold text-slate-900">Nickname</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={settings.nickname} onChange={(event) => setSettings({ ...settings, nickname: event.target.value })} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5" placeholder="Tu nickname" /><button type="button" onClick={() => void saveSettings(settings)} className="rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white">Guardar nickname</button></div></Card></div> : null}{tab === 'security' ? <div className="space-y-6"><Card><h2 className="text-xl font-semibold text-slate-900">Cambiar contraseña</h2><form onSubmit={(event) => void updatePassword(event)} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nueva contraseña" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5" required /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repetir contraseña" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5" required /><button className="w-fit rounded-lg bg-amber-400 px-4 py-2.5 font-bold text-slate-950">Actualizar contraseña</button></form></Card><Card><h2 className="text-xl font-semibold text-slate-900">Autenticación de dos factores</h2><p className="mt-2 text-sm text-slate-500">Estado: {mfaEnabled ? 'activa' : 'inactiva'}</p><button type="button" onClick={() => void toggleMfa()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white">{mfaEnabled ? 'Administrar 2FA' : 'Activar 2FA'}</button></Card></div> : null}{tab === 'preferences' ? <div className="space-y-6"><Card><h2 className="text-xl font-semibold text-slate-900">Idioma y tema</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={settings.language} onChange={(event) => void saveSettings({ ...settings, language: event.target.value })} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5"><option value="es">Español</option><option value="en">English</option></select><button type="button" onClick={toggleTheme} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-left">Modo {theme === 'dark' ? 'oscuro' : 'claro'} {theme === 'dark' ? '☀' : '☾'}</button></div></Card><Card><h2 className="text-xl font-semibold text-slate-900">Notificaciones y dashboard</h2><div className="mt-4 space-y-3">{[['spending', 'Alertas de gasto'], ['savings', 'Recordatorios de ahorro']].map(([key, label]) => <label key={key} className="flex justify-between rounded-lg bg-slate-50 p-3"><span>{label}</span><input type="checkbox" checked={settings.notifications[key as keyof Settings['notifications']]} onChange={(event) => void saveSettings({ ...settings, notifications: { ...settings.notifications, [key]: event.target.checked } })} /></label>)}{[['metrics', 'Tarjetas de métricas'], ['charts', 'Gráficos'], ['recommendations', 'Recomendaciones']].map(([key, label]) => <label key={key} className="flex justify-between rounded-lg bg-slate-50 p-3"><span>{label}</span><input type="checkbox" checked={settings.dashboard[key as keyof Settings['dashboard']]} onChange={(event) => void saveSettings({ ...settings, dashboard: { ...settings.dashboard, [key]: event.target.checked } })} /></label>)}</div></Card></div> : null}{tab === 'privacy' ? <div className="space-y-6"><Card><h2 className="text-xl font-semibold text-slate-900">Descargar datos</h2><button type="button" onClick={() => void downloadData()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 font-bold text-white">Descargar JSON</button></Card><Card><h2 className="text-xl font-semibold text-slate-900">Cerrar sesiones</h2><button type="button" onClick={() => void supabase.auth.signOut({ scope: 'global' })} className="mt-4 rounded-lg border border-rose-200 px-4 py-2.5 font-semibold text-rose-700">Cerrar sesión en todos los dispositivos</button></Card></div> : null}</div>
}

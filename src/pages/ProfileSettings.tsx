import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getIngresos, getTransactions } from '../services/api'
import { supabase } from '../services/supabaseClient'

type Tab = 'profile' | 'security' | 'preferences' | 'privacy'
type TabItem = { id: Tab; label: string }

const tabs: TabItem[] = [
  { id: 'profile', label: 'Perfil' },
  { id: 'security', label: 'Seguridad' },
  { id: 'preferences', label: 'Preferencias' },
  { id: 'privacy', label: 'Privacidad y datos' },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>
}

function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={`rounded-xl border px-3 py-2.5 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{message}</div>
}

export default function ProfileSettings() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [nickname, setNickname] = useState('')
  const [language, setLanguage] = useState('es')
  const [notifications, setNotifications] = useState({ spending: true, savings: true })
  const [dashboard, setDashboard] = useState({ metrics: true, charts: true, recommendations: true })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [mfaFactor, setMfaFactor] = useState<{ id: string; status?: string; friendly_name?: string } | null>(null)
  const [mfaQr, setMfaQr] = useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [loginHistory, setLoginHistory] = useState<Array<{ created_at?: string; ip_address?: string; user_agent?: string }>>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const metadata = user ? (supabase.auth.getUser().then(({ data }) => (data.user?.user_metadata ?? {}) as Record<string, any>)) : Promise.resolve({} as Record<string, any>)
    void metadata.then((data) => {
      setNickname(typeof data.nickname === 'string' ? data.nickname : '')
      setLanguage(typeof data.language === 'string' ? data.language : 'es')
      setNotifications({ spending: data.notifications?.spending !== false, savings: data.notifications?.savings !== false })
      setDashboard({ metrics: data.dashboard?.metrics !== false, charts: data.dashboard?.charts !== false, recommendations: data.dashboard?.recommendations !== false })
    })

    const loadAccountSecurity = async () => {
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find((factor) => factor.status === 'verified')
      setMfaFactor(verified ?? null)

      const history = await supabase.from('login_history').select('created_at, ip_address, user_agent').order('created_at', { ascending: false }).limit(10)
      if (!history.error && history.data) setLoginHistory(history.data)
    }

    void loadAccountSecurity()
  }, [user])

  const clearFeedback = () => {
    setMessage('')
    setError('')
  }

  const saveMetadata = async (updates: Record<string, unknown>, successMessage: string) => {
    clearFeedback()
    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ data: updates })
      if (updateError) throw updateError
      setMessage(successMessage)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen válida.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2 MB.')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    clearFeedback()
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return
    clearFeedback()
    setSaving(true)
    try {
      const extension = avatarFile.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/avatar-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      if (updateError) throw updateError
      setAvatarFile(null)
      setMessage('Foto de perfil actualizada.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'No se pudo subir la foto. Verifica que exista el bucket avatars.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearFeedback()
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (updateError) setError(updateError.message)
    else {
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Contraseña actualizada correctamente.')
    }
  }

  const enrollMfa = async () => {
    clearFeedback()
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'MoneyFlow Authenticator' })
    if (enrollError) {
      setError(enrollError.message)
      return
    }
    setMfaFactor({ id: data.id, status: 'unverified', friendly_name: 'MoneyFlow Authenticator' })
    setMfaQr(data.totp.uri)
    setMfaSecret(data.totp.secret)
  }

  const verifyMfa = async () => {
    if (!mfaFactor || mfaCode.length !== 6) {
      setError('Introduce el código de 6 dígitos de tu aplicación autenticadora.')
      return
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactor.id })
    if (challengeError) {
      setError(challengeError.message)
      return
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: mfaFactor.id, challengeId: challenge.id, code: mfaCode })
    if (verifyError) setError(verifyError.message)
    else {
      setMfaFactor((current) => current ? { ...current, status: 'verified' } : current)
      setMfaQr(null)
      setMfaCode('')
      setMessage('Autenticación de dos factores activada.')
    }
  }

  const disableMfa = async () => {
    if (!mfaFactor) return
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: mfaFactor.id })
    if (unenrollError) setError(unenrollError.message)
    else {
      setMfaFactor(null)
      setMessage('Autenticación de dos factores desactivada.')
    }
  }

  const downloadData = async () => {
    clearFeedback()
    const [ingresos, egresos] = await Promise.all([getIngresos(), getTransactions()])
    const blob = new Blob([JSON.stringify({ user: { id: user?.id, email: user?.email, nickname }, ingresos, egresos }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'moneyflow-datos.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Tus datos se han descargado.')
  }

  const signOutEverywhere = async () => {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' })
    if (signOutError) setError(signOutError.message)
    else setMessage('Se cerraron las sesiones en todos los dispositivos.')
  }

  const deleteAccount = async () => {
    const confirmation = window.prompt('Escribe ELIMINAR para confirmar la eliminación permanente de tu cuenta.')
    if (confirmation !== 'ELIMINAR') return
    clearFeedback()
    const { error: deleteError } = await supabase.functions.invoke('delete-account', { body: { confirmation } })
    if (deleteError) setError(`No se pudo eliminar la cuenta. Configura la Edge Function delete-account: ${deleteError.message}`)
    else await supabase.auth.signOut({ scope: 'global' })
  }

  const renderProfile = () => <div className="space-y-6"><Card><SectionHeading eyebrow="Identidad" title="Tu perfil" description="Personaliza la información que identifica tu cuenta en MoneyFlow." /><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><button type="button" onClick={() => fileInputRef.current?.click()} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-amber-300 bg-slate-900 text-2xl font-bold text-white"><img src={avatarPreview ?? '/moneyflow-mark-dark.svg'} alt="Foto de perfil" className="h-full w-full object-cover" /><span className="absolute inset-0 hidden items-center justify-center bg-slate-950/70 text-xs group-hover:flex">Cambiar</span></button><div className="flex-1"><p className="font-semibold text-slate-900">{user?.email ?? 'Sin email'}</p><p className="mt-1 text-sm text-slate-500">JPG, PNG o WEBP. Máximo 2 MB.</p><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatar(event.target.files?.[0] ?? null)} />{avatarFile ? <button type="button" onClick={() => void uploadAvatar()} disabled={saving} className="mt-3 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">{saving ? 'Subiendo...' : 'Guardar foto'}</button> : null}</div></div></Card><Card><SectionHeading eyebrow="Nombre visible" title="Nickname" description="Este nombre aparecerá en las personalizaciones futuras de tu cuenta." /><div className="flex flex-col gap-3 sm:flex-row"><input value={nickname} onChange={(event) => setNickname(event.target.value)} className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-amber-400" placeholder="Ej. Alex" maxLength={40} /><button type="button" onClick={() => void saveMetadata({ nickname: nickname.trim() }, 'Nickname actualizado.')} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Guardar nickname</button></div></Card></div>

  const renderSecurity = () => <div className="space-y-6"><Card><SectionHeading eyebrow="Acceso" title="Cambiar contraseña" description="Protege tu cuenta con una contraseña única y difícil de adivinar." /><form onSubmit={(event) => void changePassword(event)} className="grid gap-4 sm:grid-cols-2"><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-amber-400" placeholder="Nueva contraseña" required /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-amber-400" placeholder="Repite la contraseña" required /><p className="text-xs text-slate-500 sm:col-span-2">Mínimo 8 caracteres, mayúscula, minúscula y número.</p><button type="submit" disabled={saving} className="w-fit rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">Actualizar contraseña</button></form></Card><Card><SectionHeading eyebrow="Protección adicional" title="Autenticación de dos factores" description="Añade un código de tu aplicación autenticadora al iniciar sesión." />{!mfaFactor ? <button type="button" onClick={() => void enrollMfa()} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Activar 2FA</button> : mfaFactor.status === 'verified' ? <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">2FA activa</span><button type="button" onClick={() => void disableMfa()} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700">Desactivar</button></div> : <div className="space-y-4"><p className="text-sm text-slate-600">Escanea el QR con tu aplicación autenticadora.</p>{mfaQr ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mfaQr)}`} alt="Código QR para activar 2FA" className="h-44 w-44 rounded-lg border border-slate-200 p-2" /> : null}<p className="break-all text-xs text-slate-500">Clave manual: {mfaSecret}</p><div className="flex gap-2"><input value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-36 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" placeholder="123456" /><button type="button" onClick={() => void verifyMfa()} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950">Verificar</button></div></div>}</Card><Card><SectionHeading eyebrow="Sesiones" title="Historial de inicio de sesión" description="Revisa las sesiones registradas y cierra el acceso en todos los dispositivos." />{loginHistory.length ? <div className="space-y-2">{loginHistory.map((login, index) => <div key={`${login.created_at}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">{login.created_at ? new Date(login.created_at).toLocaleString() : 'Fecha desconocida'}</span><span className="ml-2">{login.ip_address ?? 'IP no disponible'}</span></div>)}</div> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No hay historial disponible. Puedes crear la tabla opcional login_history para registrar eventos.</p>}<button type="button" onClick={() => void signOutEverywhere()} className="mt-4 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700">Cerrar sesión en todos los dispositivos</button></Card></div>

  const renderPreferences = () => <div className="space-y-6"><Card><SectionHeading eyebrow="Apariencia" title="Idioma y tema" description="Configura cómo quieres usar MoneyFlow." /><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-medium text-slate-700"><span>Idioma</span><select value={language} onChange={(event) => { setLanguage(event.target.value); void saveMetadata({ language: event.target.value }, 'Idioma actualizado.') }} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900"><option value="es">Español</option><option value="en">English</option></select></label><div className="flex items-end"><button type="button" onClick={toggleTheme} className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"><span>Modo {theme === 'dark' ? 'oscuro' : 'claro'}</span><span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span></button></div></div></Card><Card><SectionHeading eyebrow="Avisos" title="Notificaciones financieras" description="Elige qué recordatorios quieres recibir en tu cuenta." /><div className="space-y-3">{[['spending', 'Alertas de gasto'], ['savings', 'Recordatorios de ahorro']].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700"><span>{label}</span><input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(event) => { const next = { ...notifications, [key]: event.target.checked }; setNotifications(next); void saveMetadata({ notifications: next }, 'Notificaciones actualizadas.') }} className="h-5 w-5 accent-amber-400" /></label>)}</div></Card><Card><SectionHeading eyebrow="Dashboard" title="Personalización" description="Controla qué bloques se muestran en tu panel principal." /><div className="space-y-3">{[['metrics', 'Tarjetas de métricas'], ['charts', 'Gráficos estadísticos'], ['recommendations', 'Recomendaciones financieras']].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700"><span>{label}</span><input type="checkbox" checked={dashboard[key as keyof typeof dashboard]} onChange={(event) => { const next = { ...dashboard, [key]: event.target.checked }; setDashboard(next); void saveMetadata({ dashboard: next }, 'Dashboard actualizado.') }} className="h-5 w-5 accent-amber-400" /></label>)}</div></Card></div>

  const renderPrivacy = () => <div className="space-y-6"><Card><SectionHeading eyebrow="Portabilidad" title="Descargar tus datos" description="Obtén un archivo JSON con tu perfil, ingresos y egresos registrados." /><button type="button" onClick={() => void downloadData()} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Descargar datos</button></Card><Card className="border-rose-200"><SectionHeading eyebrow="Zona sensible" title="Eliminar cuenta" description="Esta acción debe ejecutarse mediante la Edge Function delete-account para borrar Auth y datos relacionados de forma segura." /><button type="button" onClick={() => void deleteAccount()} className="rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700">Eliminar cuenta permanentemente</button></Card></div>

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Cuenta</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Configuración del perfil</h1><p className="mt-2 text-sm text-slate-500">Administra tu identidad, seguridad y experiencia en MoneyFlow.</p></div><div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); clearFeedback() }} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{tab.label}</button>)}</div>{message ? <Notice message={message} /> : null}{error ? <Notice message={error} error /> : null}{activeTab === 'profile' ? renderProfile() : null}{activeTab === 'security' ? renderSecurity() : null}{activeTab === 'preferences' ? renderPreferences() : null}{activeTab === 'privacy' ? renderPrivacy() : null}</div>
}
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

type Movement = {
  fecha: string
  monto: number
  descripcion?: string | null
  estado?: string | null
  categoria?: string | null
}

type DashboardInsightsProps = {
  ingresos: Movement[]
  egresos: Movement[]
}

const money = (value: number) => `$${value.toFixed(0)}`

function Panel({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">{eyebrow}</p> : null}
        <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function DashboardInsights({ ingresos, egresos }: DashboardInsightsProps) {
  const { theme } = useTheme()
  const text = theme === 'dark' ? '#aeb7c2' : '#64748b'
  const grid = theme === 'dark' ? '#2b323a' : '#e2e8f0'
  const tooltip = theme === 'dark' ? '#181c21' : '#ffffff'
  const ingresosTotal = ingresos.reduce((sum, item) => sum + Number(item.monto || 0), 0)
  const egresosTotal = egresos.reduce((sum, item) => sum + Number(item.monto || 0), 0)
  const ahorro = Math.max(ingresosTotal - egresosTotal, 0)
  const emergencyTarget = egresosTotal * 3
  const emergencyProgress = emergencyTarget ? Math.min((ahorro / emergencyTarget) * 100, 100) : 0
  const desireRows = egresos.filter((item) => /ocio|restaurante|comida|compras|viaje|suscripci[oó]n|entretenimiento|delivery/i.test(item.descripcion ?? ''))
  const desireTotal = desireRows.reduce((sum, item) => sum + Number(item.monto || 0), 0)
  const impulsiveSpend = egresosTotal ? (desireTotal / egresosTotal) * 100 : 0

  const monthly = Array.from(new Set([...ingresos, ...egresos].map((item) => item.fecha.slice(0, 7))))
    .sort()
    .slice(-6)
    .map((month) => ({
      month,
      ingresos: ingresos.filter((item) => item.fecha.startsWith(month)).reduce((sum, item) => sum + Number(item.monto || 0), 0),
      egresos: egresos.filter((item) => item.fecha.startsWith(month)).reduce((sum, item) => sum + Number(item.monto || 0), 0),
    }))

  const debtRows = egresos.filter((item) => item.categoria === 'deudas' || item.categoria === 'creditos' || /deuda|cr[eé]dito|pr[eé]stamo|cuota/i.test(item.descripcion ?? ''))
  const debtPending = debtRows.filter((item) => item.estado !== 'pagado' && item.estado !== 'pagada').reduce((sum, item) => sum + Number(item.monto || 0), 0)
  const debtPaid = debtRows.filter((item) => item.estado === 'pagado' || item.estado === 'pagada').reduce((sum, item) => sum + Number(item.monto || 0), 0)
  const debtData = [{ name: 'Deudas', pagadas: debtPaid, pendientes: debtPending }]
  const categoryLabels: Record<string, string> = { gastos_variables: 'Variables', gastos_fijos: 'Fijos', deudas: 'Deudas', creditos: 'Créditos', pagos_mensuales: 'Pagos mensuales' }
  const categoryColors = ['#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981']
  const spendingData = Object.entries(egresos.reduce<Record<string, number>>((totals, item) => { const key = item.categoria ?? 'gastos_variables'; totals[key] = (totals[key] ?? 0) + Number(item.monto || 0); return totals }, {})).map(([key, value], index) => ({ name: categoryLabels[key] ?? key, value, color: categoryColors[index % categoryColors.length] }))

  const recommendations = [
    { icon: '◔', title: 'Regla 50 / 30 / 20', text: egresosTotal > ingresosTotal * 0.9 ? 'Tus egresos ocupan casi todo lo que ingresas. Revisa primero las necesidades.' : 'Distribuye 50% en necesidades, 30% en deseos y 20% en ahorro.' },
    { icon: '↗', title: 'Automatiza tu ahorro', text: ahorro < ingresosTotal * 0.2 ? 'Tu ahorro está por debajo del 20%. Programa una transferencia automática al cobrar.' : 'Tu ritmo de ahorro supera el 20%. Mantén la transferencia automática.' },
    { icon: '▣', title: 'Fondo de emergencia', text: emergencyProgress < 100 ? `Llevas ${emergencyProgress.toFixed(0)}% de una reserva objetivo de tres meses de egresos.` : 'Tu fondo de emergencia ya cubre tres meses de egresos.' },
    { icon: '↓', title: 'Método avalancha', text: debtRows.length ? 'Identificamos movimientos asociados a deudas. Prioriza los de mayor costo.' : 'Registra tus deudas con una descripción clara para priorizarlas.' },
  ]

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Hábitos inteligentes</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Recomendaciones para ti</h2></div><span className="text-xs text-slate-500">Actualizadas con tus movimientos</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((recommendation) => <article key={recommendation.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-lg font-bold text-amber-700">{recommendation.icon}</span><h3 className="mt-4 font-semibold text-slate-900">{recommendation.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{recommendation.text}</p></article>)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel eyebrow="Distribución" title="Regla 50 / 30 / 20"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={spendingData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} paddingAngle={3}>{spendingData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: tooltip, border: `1px solid ${grid}`, borderRadius: 8 }} /><text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill={text} fontSize="12">Egresos</text><text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fill={theme === 'dark' ? '#f3f4f6' : '#0f172a'} fontSize="18" fontWeight="700">{money(egresosTotal)}</text></PieChart></ResponsiveContainer></div><div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">{spendingData.map((item) => <span key={item.name} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>)}</div></Panel>
        <Panel eyebrow="Reserva" title="Progreso del fondo de emergencia"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Fondo', actual: ahorro, objetivo: emergencyTarget }]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="name" stroke={text} /><YAxis stroke={text} tickFormatter={(value) => `$${value / 1000}k`} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: tooltip, border: `1px solid ${grid}`, borderRadius: 8 }} /><Bar dataKey="objetivo" fill={grid} radius={[6, 6, 0, 0]} /><Bar dataKey="actual" fill="#10b981" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="text-center text-sm text-slate-500">{emergencyTarget ? `${emergencyProgress.toFixed(0)}% completado` : 'Registra egresos para calcular tu objetivo.'}</p></Panel>
        <Panel eyebrow="Tendencia" title="Ingresos vs egresos por mes"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="month" stroke={text} /><YAxis stroke={text} tickFormatter={(value) => `$${value / 1000}k`} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: tooltip, border: `1px solid ${grid}`, borderRadius: 8 }} /><Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="egresos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div><div className="flex justify-center gap-5 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />Ingresos</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" />Egresos</span></div></Panel>
        <Panel eyebrow="Obligaciones" title="Estado de deudas pendientes"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={debtData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}><CartesianGrid stroke={grid} horizontal={false} /><XAxis type="number" stroke={text} tickFormatter={(value) => `$${value / 1000}k`} /><YAxis type="category" dataKey="name" stroke={text} /><Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: tooltip, border: `1px solid ${grid}`, borderRadius: 8 }} /><Bar dataKey="pagadas" stackId="debt" fill="#10b981" /><Bar dataKey="pendientes" stackId="debt" fill="#f59e0b" /></BarChart></ResponsiveContainer></div><p className="text-center text-sm text-slate-500">{debtRows.length ? `${debtRows.length} movimientos identificados como deuda` : 'No hay deudas identificadas en tus descripciones.'}</p></Panel>
      </div>

      <Panel eyebrow="Control" title="Indicador de gasto impulsivo"><div className="relative mx-auto h-44 max-w-sm overflow-hidden"><div className="absolute bottom-0 left-1/2 h-32 w-64 -translate-x-1/2 rounded-t-full" style={{ background: 'conic-gradient(from 270deg at 50% 100%, #10b981 0deg 54deg, #f59e0b 54deg 108deg, #f43f5e 108deg 180deg, transparent 180deg)' }} /><div className="absolute bottom-0 left-1/2 h-24 w-48 -translate-x-1/2 rounded-t-full bg-white dark:bg-[#181c21]" /><div className="absolute bottom-0 left-1/2 h-28 w-0.5 origin-bottom bg-slate-900 transition-transform duration-500" style={{ transform: `translateX(-50%) rotate(${Math.min(impulsiveSpend / 30, 1) * 180 - 90}deg)` }} /><div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-900" /><p className="absolute bottom-1 left-0 right-0 text-center text-3xl font-bold text-slate-900">{impulsiveSpend.toFixed(0)}%</p></div><p className="text-center text-sm text-slate-500">{desireRows.length === 0 ? 'Clasifica tus egresos en la descripción para medir este indicador.' : impulsiveSpend > 30 ? 'Tus deseos superan el 30% de referencia. Revisa gastos variables.' : 'Tus gastos variables están dentro del 30% de referencia.'}</p></Panel>
    </div>
  )
}
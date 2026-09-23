import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardInsights from '../components/DashboardInsights'
import { getAhorros, getIngresos, getSaleNotes, getTransactions, subscribeToFinanceChanges } from '../services/api'

type DashboardSummary = {
  ingresos: number
  egresos: number
  balance: number
  pendientes: number
}

type Movement = {
  fecha: string
  monto: number
  descripcion?: string | null
  estado?: string | null
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>({ ingresos: 0, egresos: 0, balance: 0, pendientes: 0 })
  const [ingresos, setIngresos] = useState<Movement[]>([])
  const [egresos, setEgresos] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [ahorrosTotal, setAhorrosTotal] = useState(0)
  const [saleNotesSummary, setSaleNotesSummary] = useState({ pendientes: 0, pagadas: 0, activas: 0, desactivadas: 0 })

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [transactions, ingresos, ahorros, saleNotes] = await Promise.all([getTransactions(), getIngresos(), getAhorros(), getSaleNotes()])
        const ingresoRows = ingresos as Movement[]
        const egresoRows = transactions as Movement[]

        const ingresosTotal = ingresoRows.reduce(
          (sum, item) => sum + Number(item.monto || 0),
          0,
        )

        const egresosTotal = egresoRows.reduce(
          (sum, item) => sum + Number(item.monto || 0),
          0,
        )

        setIngresos(ingresoRows)
        setEgresos(egresoRows)
        setAhorrosTotal((ahorros as Array<{ monto: number; revertido?: boolean }>).filter((row) => !row.revertido).reduce((sum, row) => sum + Number(row.monto || 0), 0))
        const notes = saleNotes as Array<{ monto: number; estado: string; activo: boolean }>
        setSaleNotesSummary({ pendientes: notes.filter((row) => row.activo && row.estado === 'pendiente').reduce((sum, row) => sum + Number(row.monto || 0), 0), pagadas: notes.filter((row) => row.activo && row.estado === 'pagada').reduce((sum, row) => sum + Number(row.monto || 0), 0), activas: notes.filter((row) => row.activo).reduce((sum, row) => sum + Number(row.monto || 0), 0), desactivadas: notes.filter((row) => !row.activo).reduce((sum, row) => sum + Number(row.monto || 0), 0) })

        setSummary({
          ingresos: ingresosTotal,
          egresos: egresosTotal,
          balance: ingresosTotal - egresosTotal,
          pendientes: ingresoRows.filter((item) => item.estado === 'pendiente').reduce((sum, item) => sum + Number(item.monto || 0), 0),
        })
      } catch (error) {
        console.error('Error loading dashboard summary', error)
      } finally {
        setLoading(false)
      }
    }

    void loadSummary()

    return subscribeToFinanceChanges(() => {
      void loadSummary()
    })
  }, [])

  const formatMoney = (value: number) => `$${value.toFixed(2)}`

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-amber-400">Resumen financiero</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tu dinero, en control.</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300">Consulta el rendimiento de tu operación y registra cada movimiento desde un solo panel.</p>
          </div>
          <Link to="/ingresos" className="inline-flex w-fit items-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
            + Registrar ingreso
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">Ingresos</p><span className="rounded-lg bg-emerald-100 px-2 py-1 text-sm text-emerald-700">↗</span></div>
          <p className="mt-5 text-3xl font-bold tracking-tight text-emerald-600">
            {loading ? '$0.00' : formatMoney(summary.ingresos)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Entradas registradas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">Egresos</p><span className="rounded-lg bg-rose-100 px-2 py-1 text-sm text-rose-700">↘</span></div>
          <p className="mt-5 text-3xl font-bold tracking-tight text-rose-600">
            {loading ? '$0.00' : formatMoney(summary.egresos)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Salidas registradas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">Balance</p><span className="rounded-lg bg-amber-100 px-2 py-1 text-sm text-amber-700">◆</span></div>
          <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            {loading ? '$0.00' : formatMoney(summary.balance)}
          </p>
          <p className="mt-2 text-xs text-slate-500">Resultado neto actual</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-sm font-medium text-emerald-700">Ahorros</p><p className="mt-5 text-3xl font-bold tracking-tight text-emerald-700">{loading ? '$0.00' : formatMoney(ahorrosTotal)}</p><p className="mt-2 text-xs text-emerald-700">Ahorro acumulado</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><p className="text-sm font-medium text-amber-700">Ingresos pendientes</p><p className="mt-5 text-3xl font-bold tracking-tight text-amber-700">{loading ? '$0.00' : formatMoney(summary.pendientes)}</p><p className="mt-2 text-xs text-amber-700">Por cobrar</p></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Notas pendientes</p><p className="mt-2 text-2xl font-bold text-amber-600">${saleNotesSummary.pendientes.toFixed(2)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Notas pagadas</p><p className="mt-2 text-2xl font-bold text-emerald-600">${saleNotesSummary.pagadas.toFixed(2)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Notas activas</p><p className="mt-2 text-2xl font-bold text-slate-900">${saleNotesSummary.activas.toFixed(2)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Notas desactivadas</p><p className="mt-2 text-2xl font-bold text-slate-500">${saleNotesSummary.desactivadas.toFixed(2)}</p></div></div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Accesos rápidos</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Continúa tu gestión</h2></div><span className="text-2xl text-amber-400">✦</span></div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/egresos" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            Ver egresos
          </Link>
          <Link to="/ingresos" className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
            Ver ingresos
          </Link>
          <Link to="/reports" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Reportes
          </Link>
        </div>
      </div>

      <DashboardInsights ingresos={ingresos} egresos={egresos} />
    </div>
  )
}

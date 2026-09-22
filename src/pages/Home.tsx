import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardInsights from '../components/DashboardInsights'
import { getIngresos, getTransactions, subscribeToFinanceChanges } from '../services/api'

type DashboardSummary = {
  ingresos: number
  egresos: number
  balance: number
}

type Movement = {
  fecha: string
  monto: number
  descripcion?: string | null
  estado?: string | null
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>({ ingresos: 0, egresos: 0, balance: 0 })
  const [ingresos, setIngresos] = useState<Movement[]>([])
  const [egresos, setEgresos] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const [transactions, ingresos] = await Promise.all([getTransactions(), getIngresos()])
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

        setSummary({
          ingresos: ingresosTotal,
          egresos: egresosTotal,
          balance: ingresosTotal - egresosTotal,
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

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

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

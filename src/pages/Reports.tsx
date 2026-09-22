import { useEffect, useState } from 'react'
import { getIngresos, getTransactions } from '../services/api'

export default function Reports() {
  const [totals, setTotals] = useState({ transactions: 0, pending: 0 })

  useEffect(() => {
    const load = async () => {
      const [transactions, ingresos] = await Promise.all([getTransactions(), getIngresos()])
      setTotals({
        transactions: (transactions as Array<{ monto: number }>).reduce((sum, row) => sum + Number(row.monto || 0), 0),
        pending: (ingresos as Array<{ estado?: string }>).filter((row) => row.estado === 'pendiente').length,
      })
    }

    void load()
  }, [])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Analítica</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Reportes</h1>
        <p className="mt-2 text-sm text-slate-500">Una lectura rápida de la actividad financiera.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total por transacciones</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">${totals.transactions.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Notas pendientes</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{totals.pending}</p>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { addSaleNote, getTransactions } from '../services/api'

type SaleNoteFormValues = {
  numero_nota: string
  fecha: string
  monto: number
  estado: 'pendiente' | 'pagada'
  transaction_id: string | null
}

type SaleNoteFormProps = {
  onSubmit?: (values: SaleNoteFormValues) => Promise<void> | void
}

const defaultValues = {
  numero_nota: '',
  fecha: new Date().toISOString().slice(0, 10),
  monto: 0,
  estado: 'pendiente' as const,
  transaction_id: null,
}

export default function SaleNoteForm({ onSubmit }: SaleNoteFormProps) {
  const [values, setValues] = useState<SaleNoteFormValues>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<{ id: string; descripcion: string }[]>([])

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getTransactions()
        setTransactions(data as { id: string; descripcion: string }[])
      } catch (error) {
        console.error('Error loading transactions for sale note', error)
      }
    }

    loadTransactions()
  }, [])

  const handleChange = (field: keyof SaleNoteFormValues, value: string | number | null) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        numero_nota: values.numero_nota,
        fecha: values.fecha,
        monto: Number(values.monto),
        estado: values.estado,
        transaction_id: values.transaction_id || null,
      }

      if (onSubmit) {
        await onSubmit(payload)
      } else {
        await addSaleNote(payload)
      }

      setValues(defaultValues)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-lg font-semibold text-slate-900">Nueva nota de venta</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Número de nota</label>
        <input
          type="text"
          value={values.numero_nota}
          onChange={(event) => handleChange('numero_nota', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="NV-001"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Fecha</label>
        <input
          type="date"
          value={values.fecha}
          onChange={(event) => handleChange('fecha', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Monto</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.monto}
          onChange={(event) => handleChange('monto', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Estado</label>
        <select
          value={values.estado}
          onChange={(event) => handleChange('estado', event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
        >
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Relacionar con ingreso</label>
        <select
          value={values.transaction_id ?? ''}
          onChange={(event) => handleChange('transaction_id', event.target.value || null)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
        >
          <option value="">Sin relación</option>
          {transactions.map((transaction) => (
            <option key={transaction.id} value={transaction.id}>
              {transaction.descripcion}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'Guardar nota'}
      </button>
    </form>
  )
}

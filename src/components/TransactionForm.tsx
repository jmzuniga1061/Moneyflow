import { useState } from 'react'
import type { FormEvent } from 'react'

type TransactionFormValues = {
  monto: string
  fecha: string
  descripcion: string
}

type TransactionPayload = {
  monto: number
  fecha: string
  descripcion: string
}

type TransactionFormProps = {
  onSubmit?: (values: TransactionPayload) => Promise<void> | void
}

const defaultValues = {
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: '',
}

export default function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: keyof TransactionFormValues, value: string | number) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const monto = Number(values.monto.replace(',', '.'))
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('El monto debe ser un número mayor que cero.')
      return
    }

    if (!values.fecha || !values.descripcion.trim()) {
      setError('Completa la fecha y la descripción.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        monto,
        fecha: values.fecha,
        descripcion: values.descripcion.trim(),
      }

      if (onSubmit) {
        await onSubmit(payload)
      } else {
        throw new Error('El formulario de egresos no tiene un manejador de guardado configurado.')
      }

      setValues(defaultValues)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No se pudo guardar el egreso.'
      console.error('Error al guardar egreso desde TransactionForm:', submitError)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Nuevo movimiento</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">Nueva transacción</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Monto</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={values.monto}
          onChange={(event) => handleChange('monto', event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:border-amber-400"
          placeholder="0.00"
          required
        />
      </div>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Fecha</label>
        <input
          type="date"
          value={values.fecha}
          onChange={(event) => handleChange('fecha', event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Descripción</label>
        <input
          type="text"
          value={values.descripcion}
          onChange={(event) => handleChange('descripcion', event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
          placeholder="Ej: Pago de servicio"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'Guardar transacción'}
      </button>
    </form>
  )
}

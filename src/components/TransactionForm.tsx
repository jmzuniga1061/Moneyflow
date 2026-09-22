import { useState } from 'react'
import type { FormEvent } from 'react'

type TransactionFormValues = {
  categoria: 'gastos_variables' | 'gastos_fijos' | 'deudas' | 'creditos' | 'pagos_mensuales'
  monto: string
  fecha: string
  descripcion: string
  estado: 'pendiente' | 'pagado'
  recurrente: boolean
  recordatorio_dia: string
}

type TransactionPayload = {
  categoria: TransactionFormValues['categoria']
  monto: number
  fecha: string
  descripcion: string
  estado: TransactionFormValues['estado']
  recurrente: boolean
  recordatorio_dia: number | null
}

type TransactionFormProps = {
  onSubmit?: (values: TransactionPayload) => Promise<void> | void
}

const defaultValues = {
  categoria: 'gastos_variables' as TransactionFormValues['categoria'],
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: '',
  estado: 'pendiente' as TransactionFormValues['estado'],
  recurrente: false,
  recordatorio_dia: '',
}

export default function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field: keyof TransactionFormValues, value: string | number | boolean) => {
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
        categoria: values.categoria,
        monto,
        fecha: values.fecha,
        descripcion: values.descripcion.trim(),
        estado: values.estado,
        recurrente: values.recurrente,
        recordatorio_dia: values.recurrente ? Number(values.recordatorio_dia || 1) : null,
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
        <p className="mt-1 text-lg font-semibold text-slate-900">Nuevo egreso</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Categoría</label>
        <select value={values.categoria} onChange={(event) => handleChange('categoria', event.target.value as TransactionFormValues['categoria'])} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
          <option value="gastos_variables">Gastos variables</option>
          <option value="gastos_fijos">Gastos fijos</option>
          <option value="deudas">Deudas</option>
          <option value="creditos">Créditos</option>
          <option value="pagos_mensuales">Pagos mensuales</option>
        </select>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700"><span>Estado</span><select value={values.estado} onChange={(event) => handleChange('estado', event.target.value as TransactionFormValues['estado'])} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900"><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></label>
        <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={values.recurrente} onChange={(event) => handleChange('recurrente', event.target.checked)} className="h-5 w-5 accent-amber-400" /> Pago mensual</label>
      </div>

      {values.recurrente ? <div className="space-y-2"><label className="block text-sm font-medium text-slate-700">Día del recordatorio</label><input type="number" min="1" max="28" value={values.recordatorio_dia} onChange={(event) => handleChange('recordatorio_dia', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" placeholder="Ej. 5" required /></div> : null}

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
        {loading ? 'Guardando...' : 'Guardar egreso'}
      </button>
    </form>
  )
}

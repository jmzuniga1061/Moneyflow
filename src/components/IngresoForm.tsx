import { useMemo, useState } from 'react'

export type IngresoFormValues = {
  tipo: 'nota_venta' | 'otro_ingreso'
  destino: 'ingreso' | 'ahorro'
  numero_nota: string
  fecha: string
  monto: string
  estado: 'pendiente' | 'pagada'
  descripcion: string
}

export type IngresoFormProps = {
  onSubmit: (values: IngresoFormValues) => Promise<void> | void
  loading?: boolean
  error?: string
}

const today = new Date().toISOString().slice(0, 10)

const defaultValues: IngresoFormValues = {
  tipo: 'nota_venta',
  destino: 'ingreso',
  numero_nota: '',
  fecha: today,
  monto: '',
  estado: 'pendiente',
  descripcion: '',
}

export default function IngresoForm({ onSubmit, loading = false, error = '' }: IngresoFormProps) {
  const [values, setValues] = useState<IngresoFormValues>(defaultValues)

  const isNotaVenta = useMemo(() => values.tipo === 'nota_venta', [values.tipo])

  const handleChange = <K extends keyof IngresoFormValues>(field: K, value: IngresoFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Nuevo movimiento</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">Nuevo ingreso</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Tipo de ingreso</label>
        <select
          value={values.tipo}
          onChange={(event) => handleChange('tipo', event.target.value as 'nota_venta' | 'otro_ingreso')}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
        >
          <option value="nota_venta">Nota de venta</option>
          <option value="otro_ingreso">Otro ingreso</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Destino del dinero</label>
        <select
          value={values.destino}
          onChange={(event) => handleChange('destino', event.target.value as 'ingreso' | 'ahorro')}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
        >
          <option value="ingreso">Ingreso operativo del mes</option>
          <option value="ahorro">Enviar directamente a ahorros</option>
        </select>
        <p className="text-xs text-slate-500">
          {values.destino === 'ahorro' ? 'Se guardará en Ahorros y no aparecerá en el total de ingresos.' : 'Se guardará como ingreso operativo.'}
        </p>
      </div>

      {isNotaVenta ? (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Número de nota</label>
            <input
              type="text"
              value={values.numero_nota}
              onChange={(event) => handleChange('numero_nota', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
              placeholder="NV-001"
            />
          </div>

        </>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Descripción</label>
          <input
            type="text"
            value={values.descripcion}
            onChange={(event) => handleChange('descripcion', event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
            placeholder="Ej: Cobro de servicio extra"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Estado</label>
        <select
          value={values.estado}
          onChange={(event) => handleChange('estado', event.target.value as 'pendiente' | 'pagada')}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
        >
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Fecha</label>
        <input
          type="date"
          value={values.fecha}
          onChange={(event) => handleChange('fecha', event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-400"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Monto</label>
        <input
          type="text"
          inputMode="decimal"
          value={values.monto}
          onChange={(event) => {
            const nextValue = event.target.value.replace(/[^0-9,\.]/g, '')
            handleChange('monto', nextValue)
          }}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-500"
          placeholder="0.00"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Guardando...' : 'Guardar ingreso'}
      </button>
    </form>
  )
}

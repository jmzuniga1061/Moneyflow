import { useEffect, useMemo, useState } from 'react'
import IngresoForm from '../components/IngresoForm'
import IngresosTable from '../components/IngresosTable'
import { addIngreso, deleteIngreso, getIngresos } from '../services/api'

type IngresoTipo = 'nota_venta' | 'otro_ingreso'

type IngresoRow = {
  id: string
  tipo: IngresoTipo
  numero_nota?: string | null
  fecha: string
  monto: number
  estado?: 'pendiente' | 'pagada' | null
  descripcion?: string | null
}

export default function Ingresos() {
  const [rows, setRows] = useState<IngresoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadIngresos = async () => {
    try {
      const data = await getIngresos()
      setRows(data as IngresoRow[])
    } catch (err) {
      console.error('Error loading ingresos', err)
    }
  }

  useEffect(() => {
    void loadIngresos()
  }, [])

  const summary = useMemo(() => {
    const totalGeneral = rows.reduce((acc, row) => acc + Number(row.monto || 0), 0)
    const totalNotaVenta = rows
      .filter((row) => row.tipo === 'nota_venta')
      .reduce((acc, row) => acc + Number(row.monto || 0), 0)
    const totalOtroIngreso = rows
      .filter((row) => row.tipo === 'otro_ingreso')
      .reduce((acc, row) => acc + Number(row.monto || 0), 0)

    return { totalGeneral, totalNotaVenta, totalOtroIngreso }
  }, [rows])

  const handleSubmit = async (values: {
    tipo: IngresoTipo
    numero_nota: string
    fecha: string
    monto: string
    estado: 'pendiente' | 'pagada'
    descripcion: string
  }) => {
    setError('')

    const parsedMonto = Number(values.monto.replace(/,/g, ''))

    if (!values.fecha || !parsedMonto || Number(parsedMonto) <= 0) {
      setError('Debes completar una fecha válida y un monto mayor que cero.')
      return
    }

    if (values.tipo === 'nota_venta' && !values.numero_nota.trim()) {
      setError('El número de nota es obligatorio para este tipo de ingreso.')
      return
    }

    if (values.tipo === 'otro_ingreso' && !values.descripcion.trim()) {
      setError('La descripción es obligatoria para otros ingresos.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        tipo: values.tipo,
        numero_nota: values.tipo === 'nota_venta' ? values.numero_nota : null,
        fecha: values.fecha,
        monto: Number(parsedMonto),
        estado: values.tipo === 'nota_venta' ? values.estado : null,
        descripcion: values.tipo === 'otro_ingreso' ? values.descripcion : null,
      }

      await addIngreso(payload)
      await loadIngresos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el ingreso.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteIngreso(id)
      await loadIngresos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el ingreso.')
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Entradas</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Ingresos</h1>
        <p className="mt-2 text-sm text-slate-500">Registra notas de venta y otros ingresos con trazabilidad.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total general</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">${summary.totalGeneral.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Nota de venta</p>
          <p className="mt-3 text-2xl font-bold text-emerald-600">${summary.totalNotaVenta.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Otro ingreso</p>
          <p className="mt-3 text-2xl font-bold text-sky-600">${summary.totalOtroIngreso.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <IngresoForm onSubmit={handleSubmit} loading={loading} error={error} />
        <IngresosTable rows={rows} onDelete={handleDelete} />
      </div>
    </div>
  )
}

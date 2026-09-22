import { useEffect, useMemo, useState } from 'react'
import IngresoForm from '../components/IngresoForm'
import IngresosTable from '../components/IngresosTable'
import RecordModal from '../components/RecordModal'
import { addIngreso, deleteIngreso, getIngresos, updateIngreso } from '../services/api'

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
  const [selectedRow, setSelectedRow] = useState<IngresoRow | null>(null)
  const [editingRow, setEditingRow] = useState<IngresoRow | null>(null)

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
    const totalPendiente = rows
      .filter((row) => row.estado === 'pendiente')
      .reduce((acc, row) => acc + Number(row.monto || 0), 0)

    return { totalGeneral, totalNotaVenta, totalOtroIngreso, totalPendiente }
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

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRow) return
    setLoading(true)
    setError('')
    try {
      await updateIngreso(editingRow.id, {
        tipo: editingRow.tipo,
        numero_nota: editingRow.tipo === 'nota_venta' ? editingRow.numero_nota : null,
        fecha: editingRow.fecha,
        monto: Number(editingRow.monto),
        estado: editingRow.tipo === 'nota_venta' ? editingRow.estado : null,
        descripcion: editingRow.tipo === 'otro_ingreso' ? editingRow.descripcion : null,
      })
      setEditingRow(null)
      await loadIngresos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el ingreso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Entradas</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Ingresos</h1>
        <p className="mt-2 text-sm text-slate-500">Registra notas de venta y otros ingresos con trazabilidad.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total general</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">${summary.totalGeneral.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Total pendiente</p>
          <p className="mt-3 text-2xl font-bold text-amber-700">${summary.totalPendiente.toFixed(2)}</p>
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
        <IngresosTable rows={rows} onDelete={handleDelete} onEdit={setEditingRow} onSelect={setSelectedRow} />
      </div>

      {selectedRow ? <RecordModal title="Detalle del ingreso" onClose={() => setSelectedRow(null)}><div className="space-y-3 text-sm"><p><span className="font-semibold text-slate-500">Tipo:</span> {selectedRow.tipo === 'nota_venta' ? 'Nota de venta' : 'Otro ingreso'}</p><p><span className="font-semibold text-slate-500">Monto:</span> ${Number(selectedRow.monto).toFixed(2)}</p><p><span className="font-semibold text-slate-500">Fecha:</span> {selectedRow.fecha}</p><p><span className="font-semibold text-slate-500">Número:</span> {selectedRow.numero_nota ?? '-'}</p><p><span className="font-semibold text-slate-500">Estado:</span> {selectedRow.estado ?? '-'}</p><p><span className="font-semibold text-slate-500">Descripción:</span> {selectedRow.descripcion ?? '-'}</p><div className="flex gap-2 pt-4"><button type="button" onClick={() => { setEditingRow(selectedRow); setSelectedRow(null) }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Editar</button><button type="button" onClick={() => { setSelectedRow(null); void handleDelete(selectedRow.id) }} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white">Eliminar</button></div></div></RecordModal> : null}
      {editingRow ? <RecordModal title="Editar ingreso" onClose={() => setEditingRow(null)}><form onSubmit={(event) => void handleUpdate(event)} className="space-y-4"><select value={editingRow.tipo} onChange={(event) => setEditingRow({ ...editingRow, tipo: event.target.value as IngresoTipo })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900"><option value="nota_venta">Nota de venta</option><option value="otro_ingreso">Otro ingreso</option></select>{editingRow.tipo === 'nota_venta' ? <input value={editingRow.numero_nota ?? ''} onChange={(event) => setEditingRow({ ...editingRow, numero_nota: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" placeholder="Número de nota" /> : null}<input type="date" value={editingRow.fecha} onChange={(event) => setEditingRow({ ...editingRow, fecha: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required /><input type="number" min="0.01" step="0.01" value={editingRow.monto} onChange={(event) => setEditingRow({ ...editingRow, monto: Number(event.target.value) })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />{editingRow.tipo === 'nota_venta' ? <select value={editingRow.estado ?? 'pendiente'} onChange={(event) => setEditingRow({ ...editingRow, estado: event.target.value as 'pendiente' | 'pagada' })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900"><option value="pendiente">Pendiente</option><option value="pagada">Pagada</option></select> : <input value={editingRow.descripcion ?? ''} onChange={(event) => setEditingRow({ ...editingRow, descripcion: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" placeholder="Descripción" />}{error ? <p className="text-sm text-rose-600">{error}</p> : null}<button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-bold text-slate-950">{loading ? 'Guardando...' : 'Guardar cambios'}</button></form></RecordModal> : null}
    </div>
  )
}

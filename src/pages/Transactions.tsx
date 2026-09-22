import { useEffect, useState } from 'react'
import TransactionForm from '../components/TransactionForm'
import Table from '../components/Table'
import RecordModal from '../components/RecordModal'
import { addTransaction, deleteTransaction, getTransactions, subscribeToFinanceChanges, updateTransaccion } from '../services/api'

type TransactionRow = {
  id: string
  categoria: 'gastos_variables' | 'gastos_fijos' | 'deudas' | 'creditos' | 'pagos_mensuales'
  monto: number
  fecha: string
  descripcion: string
  estado: 'pendiente' | 'pagado'
  recurrente: boolean
  recordatorio_dia?: number | null
}

export default function Transactions() {
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [loadError, setLoadError] = useState('')
  const [selectedRow, setSelectedRow] = useState<TransactionRow | null>(null)
  const [editingRow, setEditingRow] = useState<TransactionRow | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTransactions()
        setRows(data as TransactionRow[])
      } catch (error) {
        console.error('Error loading transactions', error)
        setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los egresos.')
      }
    }

    void load()

    return subscribeToFinanceChanges(() => {
      void load()
    })
  }, [])

  const handleSubmit = async (values: { categoria: TransactionRow['categoria']; monto: number; fecha: string; descripcion: string; estado: TransactionRow['estado']; recurrente: boolean; recordatorio_dia: number | null }) => {
    setLoadError('')
    console.log('Datos de egreso recibidos antes de insertar:', values)

    try {
      await addTransaction(values)
      await loadTransactions()
    } catch (error) {
      console.error('Error al insertar egreso en Supabase:', error)
      throw error
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await getTransactions()
      setRows(data as TransactionRow[])
    } catch (error) {
      console.error('Error loading transactions', error)
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los egresos.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este egreso?')) return
    try {
      await deleteTransaction(id)
      setSelectedRow(null)
      await loadTransactions()
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo eliminar el egreso.')
    }
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRow) return
    setSavingEdit(true)
    setLoadError('')
    try {
      await updateTransaccion(editingRow.id, {
        monto: Number(editingRow.monto),
        fecha: editingRow.fecha,
        descripcion: editingRow.descripcion.trim(),
      })
      setEditingRow(null)
      await loadTransactions()
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'No se pudo actualizar el egreso.')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Operación</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Egresos</h1>
        <p className="mt-2 text-sm text-slate-500">Organiza tus gastos fijos, variables, deudas y pagos mensuales.</p>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Los pagos mensuales recurrentes conservan el día del recordatorio en Supabase para que puedas gestionarlos y programar avisos desde tu sistema de notificaciones.
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <TransactionForm onSubmit={handleSubmit} />

        <div className="space-y-3">
          {loadError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</div> : null}
          <Table
            columns={[
              { key: 'descripcion', label: 'Descripción' },
              { key: 'categoria', label: 'Categoría' },
              { key: 'monto', label: 'Monto', render: (row) => `$${Number(row.monto).toFixed(2)}` },
              { key: 'fecha', label: 'Fecha' },
              { key: 'estado', label: 'Estado' },
              { key: 'id', label: 'Acciones', render: (row) => <div className="flex gap-2"><button type="button" onClick={(event) => { event.stopPropagation(); setEditingRow(row) }} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Editar</button><button type="button" onClick={(event) => { event.stopPropagation(); void handleDelete(row.id) }} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Eliminar</button></div> },
            ]}
            rows={rows}
            onRowClick={setSelectedRow}
          />
        </div>
      </div>

      {selectedRow ? <RecordModal title="Detalle del egreso" onClose={() => setSelectedRow(null)}><div className="space-y-3 text-sm"><p><span className="font-semibold text-slate-500">Categoría:</span> {selectedRow.categoria}</p><p><span className="font-semibold text-slate-500">Monto:</span> ${Number(selectedRow.monto).toFixed(2)}</p><p><span className="font-semibold text-slate-500">Fecha:</span> {selectedRow.fecha}</p><p><span className="font-semibold text-slate-500">Estado:</span> {selectedRow.estado}</p><p><span className="font-semibold text-slate-500">Descripción:</span> {selectedRow.descripcion}</p><p><span className="font-semibold text-slate-500">Recurrencia:</span> {selectedRow.recurrente ? `Mensual, día ${selectedRow.recordatorio_dia ?? '-'}` : 'No recurrente'}</p><div className="flex gap-2 pt-4"><button type="button" onClick={() => { setEditingRow(selectedRow); setSelectedRow(null) }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Editar</button><button type="button" onClick={() => void handleDelete(selectedRow.id)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white">Eliminar</button></div></div></RecordModal> : null}
      {editingRow ? <RecordModal title="Editar egreso" onClose={() => setEditingRow(null)}><form onSubmit={(event) => void handleUpdate(event)} className="space-y-4"><input type="number" min="0.01" step="0.01" value={editingRow.monto} onChange={(event) => setEditingRow({ ...editingRow, monto: Number(event.target.value) })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required /><input type="date" value={editingRow.fecha} onChange={(event) => setEditingRow({ ...editingRow, fecha: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required /><textarea value={editingRow.descripcion} onChange={(event) => setEditingRow({ ...editingRow, descripcion: event.target.value })} className="min-h-24 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" required />{loadError ? <p className="text-sm text-rose-600">{loadError}</p> : null}<button type="submit" disabled={savingEdit} className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-bold text-slate-950">{savingEdit ? 'Guardando...' : 'Guardar cambios'}</button></form></RecordModal> : null}
    </div>
  )
}

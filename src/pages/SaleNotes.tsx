import { useEffect, useState } from 'react'
import SaleNoteForm from '../components/SaleNoteForm'
import Table from '../components/Table'
import RecordModal from '../components/RecordModal'
import { deleteSaleNote, getSaleNotes, updateSaleNote } from '../services/api'

type SaleNoteRow = { id: string; numero_nota: string; fecha: string; monto: number; estado: 'pendiente' | 'pagada'; tipo: 'azogues' | 'cuenca' | 'otro'; activo: boolean; descripcion?: string | null; transaction_id?: string | null; transactions?: { descripcion?: string } | null }

export default function SaleNotes() {
  const [rows, setRows] = useState<SaleNoteRow[]>([])
  const [error, setError] = useState('')
  const [editingRow, setEditingRow] = useState<SaleNoteRow | null>(null)
  const [saving, setSaving] = useState(false)

  const loadNotes = async () => {
    try { setRows((await getSaleNotes()) as SaleNoteRow[]) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las notas de venta.') }
  }

  useEffect(() => { void loadNotes() }, [])

  const totals = {
    pendientes: rows.filter((row) => row.activo && row.estado === 'pendiente').reduce((sum, row) => sum + Number(row.monto), 0),
    pagadas: rows.filter((row) => row.activo && row.estado === 'pagada').reduce((sum, row) => sum + Number(row.monto), 0),
    activas: rows.filter((row) => row.activo).reduce((sum, row) => sum + Number(row.monto), 0),
    desactivadas: rows.filter((row) => !row.activo).reduce((sum, row) => sum + Number(row.monto), 0),
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta nota de venta? Esta acción no se puede deshacer.')) return
    try { await deleteSaleNote(id); await loadNotes() } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar la nota de venta.') }
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRow) return
    setSaving(true)
    try {
      await updateSaleNote(editingRow.id, { numero_nota: editingRow.numero_nota, tipo: editingRow.tipo, fecha: editingRow.fecha, monto: Number(editingRow.monto), estado: editingRow.estado, activo: editingRow.activo, descripcion: editingRow.descripcion ?? null })
      setEditingRow(null)
      await loadNotes()
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar la nota de venta.') } finally { setSaving(false) }
  }

  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Superusuario</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Notas de venta</h1></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Pendientes', totals.pendientes, 'text-amber-600'], ['Pagadas', totals.pagadas, 'text-emerald-600'], ['Activas', totals.activas, 'text-slate-900'], ['Desactivadas', totals.desactivadas, 'text-slate-500']].map(([label, value, color]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Notas {label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>${Number(value).toFixed(2)}</p></div>)}</div>{error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div> : null}<div className="grid gap-6 lg:grid-cols-[420px_1fr]"><SaleNoteForm /><Table columns={[{ key: 'numero_nota', label: 'Número' }, { key: 'tipo', label: 'Tipo', render: (row) => row.tipo === 'azogues' ? 'Rustung Azogues' : row.tipo === 'cuenca' ? 'Rustung Cuenca' : 'Otro' }, { key: 'monto', label: 'Monto', render: (row) => `$${Number(row.monto).toFixed(2)}` }, { key: 'fecha', label: 'Fecha' }, { key: 'estado', label: 'Estado' }, { key: 'activo', label: 'Activo', render: (row) => <button type="button" onClick={async (event) => { event.stopPropagation(); await updateSaleNote(row.id, { activo: !row.activo }); await loadNotes() }} className="rounded-full px-3 py-1 text-xs font-semibold">{row.activo ? 'Activa' : 'Desactivada'}</button> }, { key: 'descripcion', label: 'Descripción', render: (row) => row.descripcion ?? '-' }, { key: 'id', label: 'Acciones', render: (row) => <div className="flex gap-2"><button type="button" onClick={(event) => { event.stopPropagation(); setEditingRow(row) }} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Editar</button><button type="button" onClick={(event) => { event.stopPropagation(); void handleDelete(row.id) }} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Eliminar</button></div> }]} rows={rows} /></div>{editingRow ? <RecordModal title="Editar nota de venta" onClose={() => setEditingRow(null)}><form onSubmit={(event) => void handleUpdate(event)} className="space-y-4"><input value={editingRow.numero_nota} onChange={(event) => setEditingRow({ ...editingRow, numero_nota: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" placeholder="Número de nota" required /><select value={editingRow.tipo} onChange={(event) => setEditingRow({ ...editingRow, tipo: event.target.value as SaleNoteRow['tipo'] })} className="w-full rounded-lg border px-3 py-2.5"><option value="azogues">Rustung Azogues</option><option value="cuenca">Rustung Cuenca</option><option value="otro">Otro</option></select><textarea value={editingRow.descripcion ?? ''} onChange={(event) => setEditingRow({ ...editingRow, descripcion: event.target.value })} className="min-h-24 w-full rounded-lg border px-3 py-2.5" placeholder="Descripción" /><input type="date" value={editingRow.fecha} onChange={(event) => setEditingRow({ ...editingRow, fecha: event.target.value })} className="w-full rounded-lg border px-3 py-2.5" required /><input type="number" min="0.01" step="0.01" value={editingRow.monto} onChange={(event) => setEditingRow({ ...editingRow, monto: Number(event.target.value) })} className="w-full rounded-lg border px-3 py-2.5" required /><select value={editingRow.estado} onChange={(event) => setEditingRow({ ...editingRow, estado: event.target.value as SaleNoteRow['estado'] })} className="w-full rounded-lg border px-3 py-2.5"><option value="pendiente">Pendiente</option><option value="pagada">Pagada</option></select><label className="flex gap-2"><input type="checkbox" checked={editingRow.activo} onChange={(event) => setEditingRow({ ...editingRow, activo: event.target.checked })} /> Nota activa</label><button type="submit" disabled={saving} className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-bold">{saving ? 'Guardando...' : 'Guardar cambios'}</button></form></RecordModal> : null}</div>
}

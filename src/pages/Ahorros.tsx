import { useEffect, useMemo, useState } from 'react'
import { addAhorro, getAhorros } from '../services/api'

type Ahorro = { id: string; monto: number; fecha: string; descripcion?: string | null; origen?: string; revertido?: boolean }

export default function Ahorros() {
  const [rows, setRows] = useState<Ahorro[]>([])
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const total = useMemo(() => rows.filter((row) => !row.revertido).reduce((sum, row) => sum + Number(row.monto || 0), 0), [rows])
  const load = async () => { try { setRows((await getAhorros()) as Ahorro[]) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los ahorros.') } }
  useEffect(() => { void load() }, [])
  const submit = async (event: React.FormEvent) => { event.preventDefault(); const value = Number(monto); if (!value || value <= 0) { setError('Ingresa un monto mayor que cero.'); return } try { await addAhorro({ monto: value, fecha, descripcion, origen: 'manual' }); setMonto(''); setDescripcion(''); await load() } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo registrar el ahorro.') } }
  return <div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Superusuario</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Ahorros</h1><p className="mt-2 text-sm text-slate-500">Registra ahorros separados de tus ingresos operativos.</p></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-sm text-emerald-700">Ahorro acumulado activo</p><p className="mt-2 text-3xl font-bold text-emerald-700">${total.toFixed(2)}</p></div><form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4"><input type="number" min="0.01" step="0.01" value={monto} onChange={(event) => setMonto(event.target.value)} placeholder="Monto" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5" required /><input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5" required /><input value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder="Descripción" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5" /><button className="rounded-lg bg-amber-400 px-4 py-2.5 font-bold text-slate-950">Registrar ahorro</button></form>{error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">Fecha</th><th className="p-4">Monto</th><th className="p-4">Origen</th><th className="p-4">Descripción</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-200"><td className="p-4">{row.fecha}</td><td className="p-4 font-semibold">${Number(row.monto).toFixed(2)}</td><td className="p-4">{row.origen}</td><td className="p-4">{row.descripcion ?? '-'}</td></tr>)}</tbody></table></div></div>
}

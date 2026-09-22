type IngresoRow = {
  id: string
  tipo: 'nota_venta' | 'otro_ingreso'
  numero_nota?: string | null
  fecha: string
  monto: number
  estado?: 'pendiente' | 'pagada' | null
  descripcion?: string | null
}

type IngresosTableProps = {
  rows: IngresoRow[]
  onDelete: (id: string) => Promise<void> | void
  onEdit: (row: IngresoRow) => void
  onSelect: (row: IngresoRow) => void
}

export default function IngresosTable({ rows, onDelete, onEdit, onSelect }: IngresosTableProps) {
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('¿Seguro que quieres eliminar este ingreso?')
    if (!confirmed) return

    await onDelete(id)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Número</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay ingresos registrados.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} onClick={() => onSelect(row)} className={`cursor-pointer hover:bg-slate-50 ${index % 2 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {row.tipo === 'nota_venta' ? 'Nota de venta' : 'Otro ingreso'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.numero_nota ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.fecha}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">${Number(row.monto).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {row.tipo === 'nota_venta' ? (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.estado === 'pagada'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {row.estado ?? 'Pendiente'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.descripcion ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(row)
                      }}
                      className="mr-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleDelete(row.id)
                      }}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <span aria-hidden="true">⌫</span> Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

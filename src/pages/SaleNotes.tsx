import { useEffect, useState } from 'react'
import SaleNoteForm from '../components/SaleNoteForm'
import Table from '../components/Table'
import { getSaleNotes } from '../services/api'

type SaleNoteRow = {
  id: string
  numero_nota: string
  fecha: string
  monto: number
  estado: 'pendiente' | 'pagada'
  transaction_id?: string | null
  transactions?: {
    id: string
    descripcion?: string
    monto?: number
    fecha?: string
  } | null
}

export default function SaleNotes() {
  const [rows, setRows] = useState<SaleNoteRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSaleNotes()
        setRows(data as SaleNoteRow[])
      } catch (error) {
        console.error('Error loading sale notes', error)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Ventas</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Notas de venta</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <SaleNoteForm />

        <Table
          columns={[
            { key: 'numero_nota', label: 'Número' },
            { key: 'monto', label: 'Monto' },
            { key: 'fecha', label: 'Fecha' },
            {
              key: 'estado',
              label: 'Estado',
              render: (row) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    row.estado === 'pagada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {row.estado}
                </span>
              ),
            },
            {
              key: 'transaction_id',
              label: 'Ingreso asociado',
              render: (row) => row.transactions?.descripcion ?? 'Sin relación',
            },
          ]}
          rows={rows}
        />
      </div>
    </div>
  )
}

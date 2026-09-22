import { useEffect, useState } from 'react'
import TransactionForm from '../components/TransactionForm'
import Table from '../components/Table'
import { getTransactions } from '../services/api'

type TransactionRow = {
  id: string
  monto: number
  fecha: string
  descripcion: string
}

export default function Transactions() {
  const [rows, setRows] = useState<TransactionRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTransactions()
        setRows(data as TransactionRow[])
      } catch (error) {
        console.error('Error loading transactions', error)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Operación</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Transacciones</h1>
        <p className="mt-2 text-sm text-slate-500">Registra y revisa tus egresos en un solo lugar.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <TransactionForm />

        <Table
          columns={[
            { key: 'descripcion', label: 'Descripción' },
            { key: 'monto', label: 'Monto' },
            { key: 'fecha', label: 'Fecha' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  )
}

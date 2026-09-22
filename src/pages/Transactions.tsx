import { useEffect, useState } from 'react'
import TransactionForm from '../components/TransactionForm'
import Table from '../components/Table'
import { addTransaction, getTransactions, subscribeToFinanceChanges } from '../services/api'

type TransactionRow = {
  id: string
  monto: number
  fecha: string
  descripcion: string
}

export default function Transactions() {
  const [rows, setRows] = useState<TransactionRow[]>([])
  const [loadError, setLoadError] = useState('')

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

  const handleSubmit = async (values: { monto: number; fecha: string; descripcion: string }) => {
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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-500">Operación</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Transacciones</h1>
        <p className="mt-2 text-sm text-slate-500">Registra y revisa tus egresos en un solo lugar.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <TransactionForm onSubmit={handleSubmit} />

        <div className="space-y-3">
          {loadError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</div> : null}
          <Table
            columns={[
              { key: 'descripcion', label: 'Descripción' },
              { key: 'monto', label: 'Monto', render: (row) => `$${Number(row.monto).toFixed(2)}` },
              { key: 'fecha', label: 'Fecha' },
            ]}
            rows={rows}
          />
        </div>
      </div>
    </div>
  )
}

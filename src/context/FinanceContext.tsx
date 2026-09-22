import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type FinanceContextType = {
  transactions: { id: string; amount: number; date: string; description: string }[]
  saleNotes: { id: string; note_number: string; date: string; amount: number; status: 'pendiente' | 'pagada' }[]
  setTransactions: React.Dispatch<React.SetStateAction<FinanceContextType['transactions']>>
  setSaleNotes: React.Dispatch<React.SetStateAction<FinanceContextType['saleNotes']>>
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<FinanceContextType['transactions']>([])
  const [saleNotes, setSaleNotes] = useState<FinanceContextType['saleNotes']>([])

  const value = useMemo(
    () => ({ transactions, saleNotes, setTransactions, setSaleNotes }),
    [transactions, saleNotes],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)

  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }

  return context
}

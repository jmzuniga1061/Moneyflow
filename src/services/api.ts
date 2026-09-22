import { supabase } from './supabaseClient'

type TransactionInput = {
  fecha: string
  monto: number
  descripcion: string
}

type SaleNoteInput = {
  numero_nota: string
  fecha: string
  monto: number
  estado: 'pendiente' | 'pagada'
  transaction_id?: string | null
}

type IngresoTipo = 'nota_venta' | 'otro_ingreso'

type IngresoInput = {
  tipo: IngresoTipo
  numero_nota?: string | null
  fecha: string
  monto: number
  estado?: 'pendiente' | 'pagada' | null
  descripcion?: string | null
  user_id?: string | null
}

export async function addTransaction(payload: TransactionInput) {
  const { data, error } = await supabase.from('transactions').insert([payload]).select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('fecha', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export function subscribeToFinanceChanges(onChange: () => void) {
  const channel = supabase
    .channel('finance-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ingresos' }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function updateTransaction(id: string, data: Partial<TransactionInput>) {
  const { data: updatedData, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return updatedData
}

export async function deleteTransaction(id: string) {
  const { data, error } = await supabase.from('transactions').delete().eq('id', id).select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getTransactionsWithSaleNotes() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, sale_notes(*)')
    .order('fecha', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function addSaleNote(payload: SaleNoteInput) {
  const { data, error } = await supabase.from('sale_notes').insert([payload]).select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getSaleNotes() {
  const { data, error } = await supabase
    .from('sale_notes')
    .select('*, transactions(id, descripcion, monto, fecha)')
    .order('fecha', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateSaleNote(id: string, data: Partial<SaleNoteInput>) {
  const { data: updatedData, error } = await supabase
    .from('sale_notes')
    .update(data)
    .eq('id', id)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  return updatedData
}

export async function deleteSaleNote(id: string) {
  const { data, error } = await supabase.from('sale_notes').delete().eq('id', id).select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function addIngreso(payload: IngresoInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error(userError?.message ?? 'No hay una sesión activa para guardar el ingreso.')
  }

  const payloadWithUser = {
    ...payload,
    user_id: payload.user_id ?? user.id,
  }

  const { data, error } = await supabase.from('ingresos').insert([payloadWithUser]).select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getIngresos() {
  const { data, error } = await supabase.from('ingresos').select('*').order('fecha', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateIngreso(id: string, data: Partial<IngresoInput>) {
  const { data: updatedData, error } = await supabase.from('ingresos').update(data).eq('id', id).select()

  if (error) {
    throw new Error(error.message)
  }

  return updatedData
}

export async function deleteIngreso(id: string) {
  const { data, error } = await supabase.from('ingresos').delete().eq('id', id).select()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

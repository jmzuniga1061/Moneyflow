-- Ejecutar en Supabase SQL Editor.
-- El frontend envia auth.uid() como user_id al crear un egreso.

alter table public.transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists transactions_user_id_idx
  on public.transactions(user_id);

alter table public.transactions enable row level security;

-- Elimina políticas anteriores de esta tabla para evitar que una política
-- antigua con WITH CHECK incompatible siga rechazando los inserts.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'transactions'
  loop
    execute format('drop policy if exists %I on public.transactions', policy_record.policyname);
  end loop;
end $$;

grant select, insert, update, delete on public.transactions to authenticated;

create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Si ya existen filas antiguas con user_id NULL, asígnales el UUID correcto
-- antes de exigir NOT NULL. No es seguro inventar ese UUID automáticamente.
-- Ejemplo para una cuenta concreta:
-- update public.transactions set user_id = 'UUID_DEL_USUARIO' where user_id is null;
-- alter table public.transactions alter column user_id set not null;

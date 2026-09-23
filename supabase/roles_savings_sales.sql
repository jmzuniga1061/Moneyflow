-- MoneyFlow: roles, ahorros y notas de venta.
-- Ejecutar en Supabase SQL Editor con un usuario administrador.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  role text not null default 'usuario' check (role in ('usuario', 'superusuario')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create or replace function public.is_superusuario()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.users where id = auth.uid() and role = 'superusuario') $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.users (id, email, nickname) values (new.id, new.email, new.raw_user_meta_data ->> 'nickname') on conflict (id) do update set email = excluded.email; return new; end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_read_own') then
    create policy users_read_own on public.users for select to authenticated using (id = auth.uid() or public.is_superusuario());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_update_superuser') then
    create policy users_update_superuser on public.users for update to authenticated using (public.is_superusuario()) with check (role in ('usuario', 'superusuario'));
  end if;
end $$;

insert into public.users (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;

create table if not exists public.ahorros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default current_date,
  descripcion text,
  origen text not null default 'manual' check (origen in ('manual', 'cierre_mensual')),
  revertido boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.ahorros add column if not exists periodo_mes date;
create unique index if not exists ahorros_cierre_mensual_unique on public.ahorros(user_id, periodo_mes) where origen = 'cierre_mensual' and periodo_mes is not null;

create or replace function public.cerrar_mes_en_ahorros(p_mes date default date_trunc('month', current_date)::date)
returns numeric language plpgsql security invoker set search_path = public
as $$
declare
  total_mes numeric(12,2);
  user_uuid uuid := auth.uid();
begin
  if user_uuid is null then raise exception 'No hay una sesión autenticada'; end if;
  select coalesce(sum(monto), 0)::numeric(12,2) into total_mes
  from public.ingresos
  where user_id = user_uuid and estado in ('pagada', 'pagado') and fecha >= p_mes and fecha < (p_mes + interval '1 month')::date;
  insert into public.ahorros(user_id, monto, fecha, descripcion, origen, periodo_mes)
  values (user_uuid, total_mes, p_mes, 'Cierre mensual de ingresos', 'cierre_mensual', p_mes)
  on conflict (user_id, periodo_mes) where origen = 'cierre_mensual' and periodo_mes is not null
  do update set monto = excluded.monto, revertido = false;
  return total_mes;
end $$;

create or replace function public.revertir_cierre_ahorros(p_mes date)
returns void language sql security invoker set search_path = public
as $$ update public.ahorros set revertido = true where user_id = auth.uid() and origen = 'cierre_mensual' and periodo_mes = p_mes $$;

create or replace function public.cerrar_todos_los_meses(p_mes date default date_trunc('month', current_date - interval '1 month')::date)
returns void language plpgsql security definer set search_path = public
as $$
declare account record; total_mes numeric(12,2);
begin
  for account in select id from public.users loop
    select coalesce(sum(monto), 0)::numeric(12,2) into total_mes
    from public.ingresos
    where user_id = account.id and estado in ('pagada', 'pagado') and fecha >= p_mes and fecha < (p_mes + interval '1 month')::date;
    insert into public.ahorros(user_id, monto, fecha, descripcion, origen, periodo_mes)
    values (account.id, total_mes, p_mes, 'Cierre mensual automático', 'cierre_mensual', p_mes)
    on conflict (user_id, periodo_mes) where origen = 'cierre_mensual' and periodo_mes is not null
    do update set monto = excluded.monto, revertido = false;
  end loop;
end $$;

-- Tras habilitar pg_cron en Supabase, programa el cierre del último día de cada mes:
-- select cron.schedule('moneyflow-cierre-mensual', '5 23 28-31 * *', $$select public.cerrar_todos_los_meses();$$);

alter table public.ahorros enable row level security;
create index if not exists ahorros_user_id_idx on public.ahorros(user_id);
drop policy if exists ahorros_select on public.ahorros;
drop policy if exists ahorros_insert on public.ahorros;
drop policy if exists ahorros_update on public.ahorros;
drop policy if exists ahorros_delete on public.ahorros;
create policy ahorros_select on public.ahorros for select to authenticated using (user_id = auth.uid() or public.is_superusuario());
create policy ahorros_insert on public.ahorros for insert to authenticated with check (user_id = auth.uid() or public.is_superusuario());
create policy ahorros_update on public.ahorros for update to authenticated using (user_id = auth.uid() or public.is_superusuario()) with check (user_id = auth.uid() or public.is_superusuario());
create policy ahorros_delete on public.ahorros for delete to authenticated using (user_id = auth.uid() or public.is_superusuario());

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sale_notes') then
    alter table public.sale_notes add column if not exists tipo text not null default 'otro' check (tipo in ('azogues', 'cuenca', 'otro'));
    alter table public.sale_notes add column if not exists activo boolean not null default true;
    alter table public.sale_notes add column if not exists descripcion text;
    alter table public.sale_notes add column if not exists user_id uuid references auth.users(id) on delete cascade;
  else
    create table public.sale_notes (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
      numero_nota text not null, fecha date not null default current_date, monto numeric(12,2) not null check (monto > 0),
      tipo text not null default 'otro' check (tipo in ('azogues', 'cuenca', 'otro')),
      estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada')),
      activo boolean not null default true, descripcion text, created_at timestamptz not null default now()
    );
  end if;
end $$;

alter table public.sale_notes enable row level security;
drop policy if exists sale_notes_select on public.sale_notes;
drop policy if exists sale_notes_insert on public.sale_notes;
drop policy if exists sale_notes_update on public.sale_notes;
drop policy if exists sale_notes_delete on public.sale_notes;
create policy sale_notes_select on public.sale_notes for select to authenticated using (user_id = auth.uid() or public.is_superusuario());
create policy sale_notes_insert on public.sale_notes for insert to authenticated with check (user_id = auth.uid() or public.is_superusuario());
create policy sale_notes_update on public.sale_notes for update to authenticated using (user_id = auth.uid() or public.is_superusuario()) with check (user_id = auth.uid() or public.is_superusuario());
create policy sale_notes_delete on public.sale_notes for delete to authenticated using (user_id = auth.uid() or public.is_superusuario());

grant select, insert, update, delete on public.users, public.ahorros, public.sale_notes to authenticated;

-- Para promover al primer superusuario, sustituye el correo y ejecuta una vez:
-- update public.users set role = 'superusuario' where email = 'admin@ejemplo.com';

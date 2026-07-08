-- =========================================================
-- Esquema Tesorería Club Alianza Francés (básquetbol)
-- Ejecutar en: Supabase > SQL Editor > New query
-- =========================================================

-- Jugadores del club
create table jugadores (
  id bigint generated always as identity primary key,
  nombre text not null,
  email text unique not null,
  activo boolean default true,
  creado_en timestamptz default now()
);

-- Cuotas por trimestre / periodo
create table cuotas (
  id bigint generated always as identity primary key,
  jugador_id bigint references jugadores(id) on delete cascade,
  periodo text not null,          -- ej: 'T1 2026', 'T2 2026'
  monto numeric not null default 0,
  monto_pagado numeric not null default 0,
  estado text not null default 'pendiente', -- pagado | pendiente | parcial | descuento
  observaciones text,
  creado_en timestamptz default now()
);

-- Gastos del club (arriendo, entrenador, otros)
create table gastos (
  id bigint generated always as identity primary key,
  fecha date not null,
  concepto text not null,          -- ej: 'Arriendo gimnasio', 'Entrenador'
  monto numeric not null default 0,
  notas text,
  creado_en timestamptz default now()
);

-- Perfiles: liga cada usuario de Supabase Auth con su rol y su jugador
create table perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  jugador_id bigint references jugadores(id),
  rol text not null default 'jugador', -- 'admin' | 'jugador'
  creado_en timestamptz default now()
);

-- =========================================================
-- Seguridad a nivel de fila (RLS): cada jugador solo ve lo suyo,
-- los admin ven y editan todo.
-- =========================================================

alter table jugadores enable row level security;
alter table cuotas enable row level security;
alter table gastos enable row level security;
alter table perfiles enable row level security;

-- Función auxiliar: rol del usuario autenticado
create or replace function rol_actual()
returns text
language sql
security definer
stable
as $$
  select rol from perfiles where id = auth.uid();
$$;

create or replace function jugador_actual()
returns bigint
language sql
security definer
stable
as $$
  select jugador_id from perfiles where id = auth.uid();
$$;

-- Perfiles: cada usuario ve su propio perfil; admin ve todos
create policy "ver propio perfil" on perfiles
  for select using (id = auth.uid() or rol_actual() = 'admin');

-- Jugadores: todos los autenticados pueden ver el listado (nombres),
-- solo admin puede editar
create policy "ver jugadores" on jugadores
  for select using (auth.role() = 'authenticated');
create policy "editar jugadores admin" on jugadores
  for insert with check (rol_actual() = 'admin');
create policy "actualizar jugadores admin" on jugadores
  for update using (rol_actual() = 'admin');

-- Cuotas: jugador ve solo las suyas; admin ve y edita todas
create policy "ver mis cuotas" on cuotas
  for select using (jugador_id = jugador_actual() or rol_actual() = 'admin');
create policy "admin inserta cuotas" on cuotas
  for insert with check (rol_actual() = 'admin');
create policy "admin actualiza cuotas" on cuotas
  for update using (rol_actual() = 'admin');

-- Gastos: todos los autenticados pueden ver (transparencia financiera);
-- solo admin edita
create policy "ver gastos" on gastos
  for select using (auth.role() = 'authenticated');
create policy "admin inserta gastos" on gastos
  for insert with check (rol_actual() = 'admin');
create policy "admin actualiza gastos" on gastos
  for update using (rol_actual() = 'admin');

-- =========================================================
-- Los datos reales (27 jugadores, cuotas y gastos) están en
-- el archivo aparte: supabase/datos_reales.sql — ejecútalo
-- justo después de este archivo.
-- =========================================================

-- Nota: después de crear un usuario en Authentication > Users,
-- vincúlalo manualmente con:
-- insert into perfiles (id, jugador_id, rol) values ('<uuid-del-usuario>', 2, 'jugador');
-- o rol 'admin' para los dirigentes.

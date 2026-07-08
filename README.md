# Tesorería Club Alianza Francés

Web app para controlar ingresos y egresos del club, con login individual por jugador
(solo ve su propio estado de cuenta y los totales generales) y panel de administración
para los dirigentes. Costo: $0 (Supabase y Vercel gratis para este tamaño de proyecto).

## Qué incluye
- Login con correo/contraseña real (Supabase Auth)
- Dashboard con KPI (ingresos, egresos, saldo, socios al día), gráfico y tabla de cuotas
- Botones para enviar el resumen por correo, WhatsApp, o imprimir/guardar como PDF
- Panel de administración para que los dos dirigentes carguen cuotas y gastos
- Seguridad a nivel de base de datos: un jugador nunca puede ver las cuotas de otro

## Paso 1 — Crear el proyecto en Supabase (gratis)
1. Entra a https://supabase.com y crea una cuenta.
2. Crea un nuevo proyecto (elige la región más cercana, ej. São Paulo).
3. Ve a **SQL Editor** > **New query**, pega el contenido de `supabase/schema.sql` y ejecútalo
   (botón "Run"). Esto crea las tablas y la seguridad por fila. Debería decir
   "Success. No rows returned".
4. Abre **otra** "New query", pega el contenido de `supabase/datos_reales.sql` y ejecútalo.
   Esto carga tus 27 jugadores reales, las cuotas de T1/T2/T3 2026 y los gastos del año.
   Los correos son **provisorios** (`nombre.apellido@club-afc.cl`) — puedes reemplazarlos
   por los reales en cualquier momento desde **Table Editor > jugadores**.
5. Ve a **Authentication > Users** y crea un usuario por cada jugador (usa el mismo correo
   que quedó en la tabla `jugadores`, y una contraseña temporal que luego cada uno cambia).
   Crea también un usuario para cada uno de los **3 dirigentes/administradores**.
6. Por cada usuario creado, copia su UUID (columna "UID" en la lista de usuarios) y
   ejecuta en el SQL Editor:
   ```sql
   insert into perfiles (id, jugador_id, rol) values ('<uuid-del-usuario>', <id-jugador>, 'jugador');
   ```
   Para los 3 dirigentes, usa `'admin'` en vez de `'jugador'` (si un dirigente también es
   jugador, usa su `jugador_id` real; si no juega, deja `jugador_id` en `null`).
6. Ve a **Project Settings > API** y copia la "Project URL" y la "anon public key".

## Paso 2 — Configurar el proyecto localmente
```bash
npm install
cp .env.local.example .env.local
# pega la URL y la anon key de Supabase en .env.local
npm run dev
```
Abre http://localhost:3000 para probarlo.

## Paso 3 — Publicarlo gratis en Vercel
1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a https://vercel.com, conecta tu cuenta de GitHub e importa el repositorio.
3. En "Environment Variables" agrega `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores de tu `.env.local`.
4. Haz clic en "Deploy". En un par de minutos tendrás una URL pública
   (ej. `tesoreria-afc.vercel.app`) para compartir con el club.

## Mantenimiento (tú y el otro dirigente)
- Para cargar una cuota nueva o un gasto: entra con tu usuario admin y ve a `/admin`.
- Cada trimestre, edita `supabase/schema.sql` como referencia o simplemente carga los
  nuevos registros desde el panel admin — no hace falta tocar código.
- Si se suma o se va un jugador: agrégalo/inactívalo en la tabla `jugadores` desde
  Supabase (Table Editor), y crea/inactiva su usuario en Authentication.

## Personalizar el estilo
Los colores y tipografía están en `app/globals.css`. Si más adelante compartes el
estilo de tu CRM, se puede ajustar esa hoja de estilos para que se vea igual.

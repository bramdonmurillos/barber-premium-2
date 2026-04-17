# BarberFlow MVP - Fase 1 Completada ✅

Sistema SaaS para gestión multi-sede de barberías con arquitectura multi-tenant.

## 🎉 Estado del Proyecto

**Fase 1: Infraestructura Multi-Tenant - COMPLETADA**

- ✅ Proyecto React + Vite + JavaScript inicializado
- ✅ Tailwind CSS configurado con tema Black & Gold
- ✅ Supabase client configurado
- ✅ React Router implementado
- ✅ Esquema de base de datos completo (5 tablas)
- ✅ Políticas RLS (Row Level Security) implementadas
- ✅ Layout premium con navegación lateral
- ✅ Páginas placeholder creadas

## 🚀 Quick Start

### 1. Instalar Dependencias

```bash
cd client
npm install
```

### 2. Configurar Supabase

1. **Crear proyecto en Supabase:**
   - Ve a [https://app.supabase.com](https://app.supabase.com)
   - Crea un nuevo proyecto
   - Espera a que termine la inicialización

2. **Obtener credenciales:**
   - Ve a Settings > API
   - Copia `Project URL` y `anon public` key

3. **Configurar variables de entorno:**
   ```bash
   # Edita client/.env.local
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

4. **Aplicar migraciones SQL:**
   - Ve a tu proyecto en Supabase Dashboard
   - Abre SQL Editor
   - Copia todo el contenido de `supabase/migrations/001_initial_schema.sql`
   - Pega y ejecuta el script
   - Verifica que se crearon las 5 tablas: profiles, sedes, barberos, servicios, citas

5. **Habilitar Google OAuth:**
   - Ve a Authentication > Providers
   - Habilita Google Provider
   - Configura OAuth credentials (obtener de Google Cloud Console)

6. **Habilitar Realtime:**
   - Ve a Database > Replication
   - Habilita Realtime para la tabla `citas`

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📁 Estructura del Proyecto

```
barber-premium/
├── client/                    # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   └── layout/        # Layout con sidebar
│   │   ├── pages/             # Páginas/vistas
│   │   │   ├── Landing.jsx    # Página inicial
│   │   │   ├── Login.jsx      # Autenticación
│   │   │   ├── Dashboard.jsx  # Panel admin
│   │   │   └── Booking.jsx    # Reserva pública
│   │   ├── hooks/             # Custom hooks
│   │   ├── contexts/          # React contexts
│   │   ├── lib/
│   │   │   └── supabase.js    # Cliente Supabase
│   │   ├── App.jsx            # Router principal
│   │   └── main.jsx           # Entry point
│   ├── .env.local             # Variables de entorno (NO commitear)
│   ├── .env.example           # Template de variables
│   └── package.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Esquema completo DB
└── req.md                     # Documentación de requerimientos
```

## 🗄️ Esquema de Base de Datos

### Tablas

1. **profiles** - Perfiles de dueños (vinculados a auth.users)
2. **sedes** - Sucursales/locaciones
3. **barberos** - Profesionales por sede
4. **servicios** - Catálogo de servicios por sede
5. **citas** - Reservas de clientes

### Relaciones

```
profiles (1) ──< (N) sedes
sedes (1) ──< (N) barberos
sedes (1) ──< (N) servicios
sedes (1) ──< (N) citas
barberos (1) ──< (N) citas
servicios (1) ──< (N) citas
```

### Seguridad (RLS)

- ✅ **Propietarios:** Acceso completo a sus propias sedes y recursos relacionados
- ✅ **Público:** Lectura de sedes/barberos/servicios activos (para booking)
- ✅ **Público:** Creación de citas (validadas contra recursos activos)
- ✅ **Aislamiento:** Los datos de cada propietario están completamente segregados

## 🎨 Diseño

### Tema Premium "Black & Gold"

- **Color Principal:** Gold (#D4AF37) - Para botones, acentos, highlights
- **Fondo Oscuro:** Gray-900 / Black - Para fondos principales
- **Texto:** Blanco/Gray-100 sobre fondos oscuros

### Componentes Implementados

- Sidebar con navegación
- Header con acciones rápidas
- Cards para estadísticas
- Diseño responsive mobile-first

## 🔐 Seguridad y Autenticación

### Google OAuth (Fase 2)

La autenticación está preparada pero requiere configuración en Fase 2:

1. Crear credenciales OAuth en Google Cloud Console
2. Configurar en Supabase Dashboard
3. Implementar flujo de login en la app

### Variables de Entorno

**NUNCA commitear el archivo `.env.local`** - Ya está en `.gitignore`

Usa `.env.example` como plantilla.

## 📋 Próximos Pasos (Fase 2)

- [ ] Implementar autenticación funcional con Google OAuth
- [ ] Crear AuthContext para gestión de estado de usuario
- [ ] Proteger rutas del dashboard (require auth)
- [ ] Completar integración con Supabase Auth
- [ ] Implementar "Switch de Sede" en el dashboard

## 🧪 Testing de la Base de Datos

### Verificar RLS

1. Crear un usuario de prueba en Supabase Auth
2. Ejecutar en SQL Editor:

```sql
-- Ver perfil creado automáticamente
SELECT * FROM profiles;

-- Insertar sede de prueba
INSERT INTO sedes (owner_id, nombre, slug, direccion)
VALUES (
  'uuid-del-usuario-aqui',
  'Mi Barbería',
  'mi-barberia',
  'Calle Principal 123'
);

-- Verificar que se creó
SELECT * FROM sedes;
```

3. Intentar acceder desde otro usuario → Debería fallar (RLS)

### Probar Políticas Públicas

```sql
-- Como anónimo, ver sedes activas (debería funcionar)
SELECT * FROM sedes WHERE activo = true;

-- Como anónimo, ver servicios (debería funcionar)
SELECT * FROM servicios WHERE activo = true;
```

## 🛠️ Tecnologías

- **Frontend:** React 19, Vite 7, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Routing:** React Router DOM v6
- **Autenticación:** Supabase Auth + Google OAuth
- **Base de Datos:** PostgreSQL con RLS
- **Despliegue:** Vercel/Netlify (frontend), Supabase (backend)

## 📖 Documentación

- [Requerimientos Completos](./req.md)
- [Migraciones SQL](./supabase/migrations/)
- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

Verifica que `.env.local` existe y tiene las variables correctas.

### Error: RLS policy violation

Asegúrate de estar autenticado con un usuario que tenga acceso a los recursos.

### Tailwind no aplica estilos

Verifica que el archivo `index.css` contiene las directivas `@tailwind`.

### Puerto en uso

Vite automáticamente busca otro puerto. Verifica en la consola el puerto asignado.

## 📝 Notas

- El trigger `on_auth_user_created` crea automáticamente un perfil cuando un usuario se registra
- Todas las tablas tienen campos `created_at` y `updated_at` con triggers automáticos
- El campo `slug` en sedes permite URLs amigables para booking: `/book/mi-barberia`
- Las citas tienen una constraint de exclusión para evitar overlapping de horarios
- La tabla `citas` está lista para Realtime (habilitar en Dashboard)

---

**Estado:** ✅ Fase 1 Completada - Lista para Fase 2 (Auth Centralizado)

**Próxima Fase:** Implementación de autenticación funcional y dashboard operativo

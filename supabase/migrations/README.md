# Migraciones de Base de Datos

Archivos SQL para configurar la base de datos de BarberFlow en Supabase.

## 📝 Migraciones Disponibles

### `001_initial_schema.sql` - Esquema Inicial Multi-Tenant

**Estado:** ✅ Lista para aplicar

**Incluye:**
- 5 tablas con relaciones (profiles, sedes, barberos, servicios, citas)
- Índices para optimización de queries
- Row Level Security (RLS) policies completas
- Triggers para timestamps automáticos
- Trigger para auto-crear profiles en signup
- Constraint de exclusión para prevenir overlapping de citas

## 🚀 Cómo Aplicar las Migraciones

### Método 1: Supabase Dashboard (Recomendado para MVP)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia todo el contenido del archivo `001_initial_schema.sql`
5. Pega en el editor SQL
6. Haz click en **Run** (o Ctrl/Cmd + Enter)
7. Verifica que se ejecutó sin errores

### Método 2: Supabase CLI (Para producción)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar proyecto (si no está inicializado)
supabase init

# Aplicar migraciones
supabase db push

# O aplicar una migración específica
supabase db push --file supabase/migrations/001_initial_schema.sql
```

## ✅ Verificación

Después de aplicar la migración, verifica que todo se creó correctamente:

### 1. Verifica las Tablas

En el SQL Editor, ejecuta:

```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Deberías ver: barberos, citas, profiles, sedes, servicios
```

### 2. Verifica las Políticas RLS

```sql
-- Ver políticas por tabla
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Deberías ver múltiples políticas para cada tabla
```

### 3. Verifica los Triggers

```sql
-- Ver triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Deberías ver triggers para updated_at y on_auth_user_created
```

### 4. Verifica las Relaciones

Ve a **Database > Tables** en el Dashboard y examina las relaciones FK visualizadas.

## 🧪 Test con Datos de Prueba

Una vez aplicada la migración, puedes probar con datos de ejemplo:

```sql
-- 1. Primero crea un usuario de prueba en Authentication
-- Copia el UUID del usuario creado

-- 2. Crear sede de prueba
INSERT INTO sedes (owner_id, nombre, slug, direccion, telefono)
VALUES (
  'tu-user-uuid-aqui',
  'Barbería Centro',
  'barberia-centro',
  'Calle Principal 123',
  '+1234567890'
);

-- 3. Obtener ID de la sede creada
SELECT id, nombre FROM sedes;

-- 4. Crear barbero de prueba
INSERT INTO barberos (sede_id, nombre, especialidad, activo)
VALUES (
  'sede-uuid-aqui',
  'Juan Pérez',
  'Cortes clásicos',
  true
);

-- 5. Crear servicio de prueba
INSERT INTO servicios (sede_id, nombre, descripcion, precio, duracion_minutos)
VALUES (
  'sede-uuid-aqui',
  'Corte de Cabello',
  'Corte profesional con acabado',
  15.00,
  30
);

-- 6. Ver todos los datos
SELECT * FROM sedes;
SELECT * FROM barberos;
SELECT * FROM servicios;
```

## 🔒 Seguridad RLS - Políticas Implementadas

### Profiles
- ✅ Usuarios pueden ver y actualizar su propio perfil
- ✅ Auto-creación al registrarse

### Sedes
- ✅ Owners: Full CRUD en sus propias sedes
- ✅ Público: Lectura de sedes activas (para booking)

### Barberos
- ✅ Owners: Full CRUD en barberos de sus sedes
- ✅ Público: Lectura de barberos activos en sedes activas

### Servicios
- ✅ Owners: Full CRUD en servicios de sus sedes
- ✅ Público: Lectura de servicios activos en sedes activas

### Citas
- ✅ Owners: Lectura y gestión de citas en sus sedes
- ✅ Público: Creación de citas (con validaciones estrictas)
- ✅ Validación: No overlapping de horarios por barbero

## 🔄 Rollback

Si necesitas revertir la migración:

```sql
-- CUIDADO: Esto eliminará TODOS los datos

DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS barberos CASCADE;
DROP TABLE IF EXISTS sedes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## 📋 Próximas Migraciones

Las siguientes migraciones se agregarán en fases futuras:

- `002_add_sede_configuration.sql` - Horarios de operación, configuración
- `003_add_notifications.sql` - Sistema de notificaciones
- `004_add_analytics.sql` - Tablas para analytics y reportes

## 🐛 Troubleshooting

### Error: "permission denied for schema public"

Tu usuario no tiene permisos. Verifica que estás usando las credenciales correctas del proyecto.

### Error: "relation already exists"

La tabla ya existe. Verifica si la migración ya fue aplicada anteriormente.

### Error: "function uuid_generate_v4() does not exist"

Falta la extensión UUID. Ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error con las políticas RLS

Verifica que RLS está habilitado:
```sql
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

## 📚 Recursos

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [PostgreSQL Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)

---

**Para preguntas o issues con las migraciones, consulta el [README principal](../../README.md)**

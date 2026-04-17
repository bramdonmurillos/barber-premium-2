## Plan: Features para Agendamiento de Citas (Usuario)

**Nota:** Este plan reemplaza y amplía cualquier feature anterior en este archivo. Copiar el contenido final en features/bp-1.md para consolidar los requerimientos de usuario agendando cita.

Este plan detalla los pasos para implementar los requerimientos enfocados en la experiencia del usuario que agenda una cita en la barbería. El objetivo es mejorar el flujo de autenticación, selección de barbero, horarios, y captura de datos de contacto, asegurando precisión en la reserva y usabilidad.

**Pasos**

### Fase 1: Autenticación y Perfil de Usuario
1. Agregar opción de login para usuarios reutilizando el método actual (como para barbero).
2. Al loguearse, mostrar sección de historial de citas del usuario autenticado.
	- Crear página/área “Mis Citas” con listado de reservas pasadas y futuras.
	- Permitir ver detalles, cancelar o reprogramar cada cita.

### Fase 2: Selección de Barbero y Horario
3. En la selección de barbero:
	- Si hay más de un barbero, agregar opción “Cualquier barbero disponible”.
	- Si el usuario selecciona “Cualquier barbero”, la búsqueda de horarios se hará considerando todos los barberos activos, seleccionando el que tenga más disponibilidad y usando sus horarios disponibles. La cita quedará asignada a ese barbero.
4. En la selección de fecha/hora:
	- Consultar la base de datos para mostrar solo horarios disponibles de la barbería y el barbero seleccionado.
	- Si no se seleccionó barbero, buscar el barbero con más disponibilidad y mostrar sus horarios.
	- Optimizar consulta para evitar mostrar horarios ocupados o fuera de horario laboral.

### Fase 3: Formulario de Contacto y Datos del Usuario
5. En el paso de contacto:
	- Si el usuario está logueado, ocultar los campos de nombre completo y WhatsApp (usar datos del perfil).
	- Si no está logueado, mostrar ambos campos.
6. Para el campo WhatsApp:
	- Agregar selector de país (con bandera y código).
	- Al seleccionar país, prefijar el indicativo y permitir ingresar solo el número.
	- Almacenar en la base de datos el indicativo y el número como campos separados o concatenados según modelo.

### Fase 4: Corrección de Fecha de Reserva
7. Corregir el bug donde la cita se agenda con la fecha del día anterior a la seleccionada en el calendario.
	- Revisar lógica de combinación de fecha y hora, y formato de almacenamiento.

### Fase 5: Cambios en Base de Datos (Migraciones)
8. Modificar tabla `citas`:
	- Agregar columna `cliente_id UUID NULL REFERENCES auth.users(id)` para ligar la cita al usuario autenticado (opcional para reservas sin login).
	- Agregar columna `cliente_pais_codigo TEXT` para almacenar el indicativo del país del WhatsApp.
	- (Opcional) Validar que el campo `barbero_id` pueda ser NULL o definir una convención para "cualquier barbero".
9. (Opcional) Extender tabla `profiles` para almacenar datos de clientes si se requiere un historial más detallado.

**Archivos relevantes**
- features/bp-1.md — Documentar el plan y checklist de features.
- client/src/pages/Booking.jsx — Flujo de reserva, selección de barbero, fecha/hora, contacto.
- client/src/pages/Login.jsx (nuevo o existente) — Pantalla de login.
- client/src/pages/Profile.jsx — Perfil e historial de citas.
- client/src/components/forms/Input.jsx, Select.jsx — Inputs reutilizables.
- client/src/utils/phoneNumber.js — Validación y formato de teléfono.
- client/src/contexts/AuthContext.jsx — Estado de autenticación.
- client/src/lib/supabase.js — Consultas a la base de datos.
- supabase/migrations/ — Scripts de migración para cambios de esquema.

**Verificación**
1. Probar login/logout y acceso a historial de citas.
2. Validar que la opción “Cualquier barbero” muestra horarios correctos.
3. Confirmar que solo se muestran horarios disponibles según barbero/barbería.
4. Revisar que el formulario de contacto se adapte según login.
5. Verificar selector de país y formato de WhatsApp en la base de datos.
6. Agendar citas y confirmar que la fecha/hora almacenada es la seleccionada.
7. Probar cancelar y reprogramar citas desde el historial.
8. Pruebas de usabilidad y validación de errores.

**Decisiones**
- El login es obligatorio para historial, pero la reserva puede permitirse sin login (según política).
- Se debe poder registrar citas aún si el usuario no se quiso logear.
- El selector de país debe cubrir los países de clientes potenciales.
- El bug de fecha requiere revisión de zona horaria y manipulación de objetos Date.
- El método de login se reutiliza como está actualmente para barberos.
- Por ahora no se implementan notificaciones.
- Se permite cancelar o reprogramar citas desde el historial.

**Consideraciones adicionales**
1. ¿El login será solo por WhatsApp, email, o ambos? (Recomendado: WhatsApp + email)
2. ¿Se requiere notificación al usuario al agendar/modificar cita en el futuro?
3. ¿El historial debe permitir ver detalles, cancelar o reprogramar citas?
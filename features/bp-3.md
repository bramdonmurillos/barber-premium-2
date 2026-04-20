## feature 3 - Bug Fixes (abril 2026)

### Estadísticas del dashboard por sede (abril 2026)

- Se corrigió el bug donde las estadísticas del dashboard mostraban el número total de barberos y citas de toda la aplicación en vez de solo los de las sedes del usuario.
- Ahora `useDashboardStats` primero obtiene las sedes del usuario y luego filtra las citas y barberos usando `.in('sede_id', sedeIds)`.
- Las estadísticas mostradas (Total Sedes, Citas Hoy, Barberos Activos) ahora reflejan correctamente solo los datos de las sedes que pertenecen al usuario autenticado.

### Onboarding condicional en dashboard (abril 2026)

- Se corrigió el bug donde el onboarding ("Primeros Pasos") se mostraba permanentemente incluso después de que el usuario creara su primera sede.
- Ahora el dashboard verifica si el usuario tiene sedes configuradas usando el hook `useSede()`.
- Si el usuario **no tiene sedes**, se muestra el onboarding con los pasos para crear la primera sede, agregar barberos y definir servicios.
- Si el usuario **ya tiene sedes**, se muestra un calendario con las citas de la semana actual, mostrando hasta 5 citas con información del cliente, barbero, servicio, fecha/hora y estado.
- Las citas de la semana se cargan automáticamente desde el lunes al domingo de la semana actual usando `date-fns` con locale español.
- Si no hay citas agendadas para la semana, se muestra un mensaje informativo.
- Se agregó un enlace "Ver todas →" que redirige a la página completa de citas (`/dashboard/citas`).

### Redirección correcta al login (abril 2026)

- Se corrigió el bug donde los usuarios nuevos eran redirigidos a `/mis-citas` en vez de `/dashboard` al iniciar sesión.
- Ahora todos los usuarios autenticados se redirigen directamente a `/dashboard` independientemente de si tienen sedes o no.
- El dashboard maneja la lógica de mostrar onboarding para usuarios nuevos sin sedes o el calendario de citas para usuarios existentes.
- Se eliminó la verificación innecesaria de si el usuario es admin o tiene sedes en la página de login, simplificando el flujo de autenticación.

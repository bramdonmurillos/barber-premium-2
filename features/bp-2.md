## feature 2

### Sistema multi-administrador (abril 2026)

- Se creó la página `/dashboard/admins` para gestionar administradores por sede.
- El dueño puede invitar nuevos admins por email; el sistema genera un enlace de invitación para copiar manualmente (no envía email).
- Las invitaciones pendientes se listan con opción de cancelar.
- El dueño aparece con badge "Dueño" y el usuario activo con badge "Tú"; ningún admin puede eliminarse a sí mismo.
- Se agregó el enlace "Administradores" al sidebar después de Reportes, con ruta protegida.

### Instagram en barberos (abril 2026)

- Se agregó el campo `instagram` en el formulario de barbero con validación: solo caracteres alfanuméricos, guion bajo y punto, máximo 30 caracteres, sin `@` ni espacios.
- En la tarjeta del barbero se muestra el ícono de Instagram con enlace `@usuario` que abre `https://instagram.com/usuario` en nueva pestaña.
- En la página de reservas pública (`/book/:slug`) se muestra el Instagram del barbero debajo de su especialidad.

### Subida de imagen en barberos (abril 2026)

- Se integró el componente `ImageUpload` en el formulario de barbero con soporte para drag & drop y selector de archivos.
- Valida que el archivo sea una imagen y no supere 5 MB; muestra mensajes de error específicos.
- La imagen se sube al bucket `barberos-fotos` en Supabase Storage y se guarda `foto_url` y `foto_storage_path` en la base de datos.

### Horario semanal en barberos (abril 2026)

- Se integró el componente `HorarioSemanalInput` en el formulario de barbero con toggles por cada día de la semana.
- Los días inactivos muestran "Cerrado"; los días activos permiten configurar hora de inicio y fin.
- Incluye función "Copiar horario" para replicar el horario de un día seleccionado a todos los demás.
- Valor por defecto: lunes a sábado de 9:00 a 18:00, domingo cerrado.
- El JSON del horario se guarda en la columna `horario_semanal` de la tabla `barberos`.
- Los slots de tiempo en la página de reservas (`/book/:slug`) respetan el horario del barbero: si un día está inactivo no muestra slots, y los slots disponibles van desde la hora de inicio hasta la hora de fin configurada.

### Foto de sede (abril 2026)

- Se agregó subida de foto para cada sede mediante `ImageUpload`, con vista previa y eliminación desde Supabase Storage.
- Se agregó configuración de horario semanal por sede mediante `HorarioSemanalInput`, con toggles por día y rangos de hora de apertura y cierre.
- Se eliminó la integración con Google Maps (autocomplete de dirección y mapa embebido) y se reemplazó por un campo de texto simple para evitar costos de la API.

### Teléfono internacional (abril 2026)

- Se integró `react-phone-number-input` en el perfil del administrador, en el formulario de sedes y en la página de reservas pública (`Booking`).
- El campo de teléfono ahora muestra la bandera del país y el prefijo internacional, y guarda el número en formato E.164.

### Métodos de pago (abril 2026)

- Se agregaron 5 métodos de pago en el registro de citas: Efectivo, Tarjeta, Transferencia, Nequi y Daviplata.
- El reporte de ingresos desglosa los totales por método de pago usando los mismos cinco grupos.

### Modo oscuro / claro (abril 2026)

- Se configuró Tailwind con `darkMode: 'class'` y se aplicaron variantes `dark:` en todas las páginas y componentes del panel de administración.
- El tema se detecta automáticamente desde la preferencia del sistema operativo (`prefers-color-scheme`) mediante `ThemeProvider` en `ThemeContext.jsx`.
- Se corrigió el fondo del layout principal que permanecía oscuro en modo claro (`bg-gray-100 dark:bg-gray-900`).
- Se corrigieron las tarjetas de sedes que permanecían con fondo oscuro fijo; ahora respetan el tema del sistema.
- Se eliminó el botón de toggle manual de tema (`ThemeToggle`) del header.

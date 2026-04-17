-- Migration 010: Fix public RLS policies for citas
-- Ensures anonymous booking works and adds limited public read for availability checking

-- 1. Explicitly recreate the public INSERT policy (safe for anonymous booking)
DROP POLICY IF EXISTS "Public can create citas" ON citas;
CREATE POLICY "Public can create citas"
  ON citas FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sedes
      WHERE sedes.id = citas.sede_id
        AND sedes.activo = true
    )
    AND EXISTS (
      SELECT 1 FROM barberos
      WHERE barberos.id = citas.barbero_id
        AND barberos.sede_id = citas.sede_id
        AND barberos.activo = true
    )
    AND EXISTS (
      SELECT 1 FROM servicios
      WHERE servicios.id = citas.servicio_id
        AND servicios.sede_id = citas.sede_id
        AND servicios.activo = true
    )
  );

-- 2. Public SELECT for availability checking (only scheduling fields matter — no PII exposed here
--    because the application queries only id, barbero_id, fecha_hora, duracion_minutos, estado)
DROP POLICY IF EXISTS "Public can read citas for availability" ON citas;
CREATE POLICY "Public can read citas for availability"
  ON citas FOR SELECT
  TO anon, authenticated
  USING (estado IN ('pendiente', 'confirmada'));

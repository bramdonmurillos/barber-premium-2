-- Migration 004: Barber Enhancements
-- Adds Instagram, custom schedules, and unavailability tracking for barbers

-- =====================================================
-- 1. Add Instagram field to barberos table
-- =====================================================

ALTER TABLE barberos
ADD COLUMN IF NOT EXISTS instagram TEXT;

COMMENT ON COLUMN barberos.instagram IS 'Instagram username (without @)';

-- =====================================================
-- 2. Add weekly schedule to barberos table
-- =====================================================
-- Stores per-day work hours as JSONB
-- Structure: {
--   lunes: {activo: true, inicio: "09:00", fin: "18:00"},
--   martes: {activo: true, inicio: "09:00", fin: "18:00"},
--   ...
-- }

ALTER TABLE barberos
ADD COLUMN IF NOT EXISTS horario_semanal JSONB DEFAULT '{
  "lunes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "martes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "miercoles": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "jueves": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "viernes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "sabado": {"activo": true, "inicio": "09:00", "fin": "14:00"},
  "domingo": {"activo": false, "inicio": "09:00", "fin": "18:00"}
}'::jsonb;

COMMENT ON COLUMN barberos.horario_semanal IS 'Weekly work schedule per day (JSONB)';

-- Create index for JSONB field
CREATE INDEX IF NOT EXISTS idx_barberos_horario_semanal ON barberos USING GIN (horario_semanal);

-- =====================================================
-- 3. Create barbero_indisponibilidad table
-- =====================================================
-- Tracks both full-day and time-block unavailability

CREATE TABLE IF NOT EXISTS barbero_indisponibilidad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbero_id UUID NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('dia_completo', 'bloque_horas')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  hora_inicio TIME, -- Required if tipo = 'bloque_horas'
  hora_fin TIME,    -- Required if tipo = 'bloque_horas'
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Validation: fecha_fin must be >= fecha_inicio
  CONSTRAINT valid_date_range CHECK (fecha_fin >= fecha_inicio),
  
  -- Validation: if tipo is bloque_horas, hora_inicio and hora_fin are required
  CONSTRAINT valid_time_block CHECK (
    (tipo = 'dia_completo') OR 
    (tipo = 'bloque_horas' AND hora_inicio IS NOT NULL AND hora_fin IS NOT NULL)
  ),
  
  -- Validation: hora_fin must be > hora_inicio for time blocks
  CONSTRAINT valid_time_range CHECK (
    tipo = 'dia_completo' OR hora_fin > hora_inicio
  )
);

COMMENT ON TABLE barbero_indisponibilidad IS 'Tracks barber unavailability (days off, blocked time slots)';
COMMENT ON COLUMN barbero_indisponibilidad.tipo IS 'Type: dia_completo (full day) or bloque_horas (time block)';
COMMENT ON COLUMN barbero_indisponibilidad.fecha_inicio IS 'Start date of unavailability';
COMMENT ON COLUMN barbero_indisponibilidad.fecha_fin IS 'End date of unavailability (inclusive)';
COMMENT ON COLUMN barbero_indisponibilidad.hora_inicio IS 'Start time (required for bloque_horas)';
COMMENT ON COLUMN barbero_indisponibilidad.hora_fin IS 'End time (required for bloque_horas)';

-- Indexes for performance
CREATE INDEX idx_indisponibilidad_barbero_id ON barbero_indisponibilidad(barbero_id);
CREATE INDEX idx_indisponibilidad_fechas ON barbero_indisponibilidad(fecha_inicio, fecha_fin);
CREATE INDEX idx_indisponibilidad_tipo ON barbero_indisponibilidad(tipo);

-- Composite index for date range queries
CREATE INDEX idx_indisponibilidad_barbero_dates ON barbero_indisponibilidad(barbero_id, fecha_inicio, fecha_fin);

-- =====================================================
-- 4. RLS Policies for barbero_indisponibilidad
-- =====================================================

-- Enable RLS
ALTER TABLE barbero_indisponibilidad ENABLE ROW LEVEL SECURITY;

-- Admins can view indisponibilidad for barberos in their sedes
CREATE POLICY "Admins can view indisponibilidad in their sedes"
  ON barbero_indisponibilidad FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM barberos
      JOIN sedes ON barberos.sede_id = sedes.id
      WHERE barberos.id = barbero_indisponibilidad.barbero_id
      AND is_sede_admin(sedes.id)
    )
  );

-- Admins can create indisponibilidad for barberos in their sedes
CREATE POLICY "Admins can create indisponibilidad in their sedes"
  ON barbero_indisponibilidad FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM barberos
      JOIN sedes ON barberos.sede_id = sedes.id
      WHERE barberos.id = barbero_id
      AND is_sede_admin(sedes.id)
    )
  );

-- Admins can update indisponibilidad for barberos in their sedes
CREATE POLICY "Admins can update indisponibilidad in their sedes"
  ON barbero_indisponibilidad FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM barberos
      JOIN sedes ON barberos.sede_id = sedes.id
      WHERE barberos.id = barbero_indisponibilidad.barbero_id
      AND is_sede_admin(sedes.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM barberos
      JOIN sedes ON barberos.sede_id = sedes.id
      WHERE barberos.id = barbero_id
      AND is_sede_admin(sedes.id)
    )
  );

-- Admins can delete indisponibilidad for barberos in their sedes
CREATE POLICY "Admins can delete indisponibilidad in their sedes"
  ON barbero_indisponibilidad FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM barberos
      JOIN sedes ON barberos.sede_id = sedes.id
      WHERE barberos.id = barbero_indisponibilidad.barbero_id
      AND is_sede_admin(sedes.id)
    )
  );

-- Public can view indisponibilidad for active barberos in active sedes (for booking availability)
CREATE POLICY "Public can view indisponibilidad for active barberos"
  ON barbero_indisponibilidad FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM barberos
      JOIN sedes ON barberos.sede_id = sedes.id
      WHERE barberos.id = barbero_indisponibilidad.barbero_id
      AND barberos.activo = true
      AND sedes.activo = true
    )
  );

-- =====================================================
-- 5. Updated_at trigger for barbero_indisponibilidad
-- =====================================================

CREATE TRIGGER update_barbero_indisponibilidad_updated_at
  BEFORE UPDATE ON barbero_indisponibilidad
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Helper function to check barber availability
-- =====================================================
-- Returns whether a barber is available on a specific date/time

CREATE OR REPLACE FUNCTION is_barbero_available(
  p_barbero_id UUID,
  p_fecha DATE,
  p_hora_inicio TIME,
  p_hora_fin TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_unavailable_count INTEGER;
BEGIN
  -- Count any unavailability records that conflict with the requested slot
  SELECT COUNT(*) INTO v_unavailable_count
  FROM barbero_indisponibilidad
  WHERE barbero_id = p_barbero_id
  AND fecha_inicio <= p_fecha
  AND fecha_fin >= p_fecha
  AND (
    -- Full day unavailability
    tipo = 'dia_completo'
    OR
    -- Time block that overlaps with requested time
    (tipo = 'bloque_horas' AND (
      (hora_inicio < p_hora_fin AND hora_fin > p_hora_inicio)
    ))
  );
  
  RETURN v_unavailable_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_barbero_available IS 'Checks if barber is available for a specific date and time range';

-- =====================================================
-- Migration complete
-- =====================================================
-- Barberos now support:
-- - Instagram usernames
-- - Custom weekly schedules
-- - Full-day and time-block unavailability tracking

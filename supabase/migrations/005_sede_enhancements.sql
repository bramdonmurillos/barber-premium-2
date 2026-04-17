-- Migration 005: Sede Enhancements
-- Adds location coordinates, weekly schedule, and image for sedes

-- =====================================================
-- 1. Add location coordinates to sedes table
-- =====================================================

ALTER TABLE sedes
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

COMMENT ON COLUMN sedes.latitud IS 'Latitude coordinate for Google Maps (-90 to 90)';
COMMENT ON COLUMN sedes.longitud IS 'Longitude coordinate for Google Maps (-180 to 180)';

-- Add constraint to validate latitude range
ALTER TABLE sedes
ADD CONSTRAINT valid_latitud CHECK (latitud IS NULL OR (latitud >= -90 AND latitud <= 90));

-- Add constraint to validate longitude range
ALTER TABLE sedes
ADD CONSTRAINT valid_longitud CHECK (longitud IS NULL OR (longitud >= -180 AND longitud <= 180));

-- Create index for geospatial queries (future feature)
CREATE INDEX IF NOT EXISTS idx_sedes_coordinates ON sedes(latitud, longitud) WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

-- =====================================================
-- 2. Add weekly schedule to sedes table
-- =====================================================
-- Stores per-day operating hours as JSONB
-- Structure: {
--   lunes: {activo: true, inicio: "09:00", fin: "18:00"},
--   martes: {activo: true, inicio: "09:00", fin: "18:00"},
--   ...
-- }

ALTER TABLE sedes
ADD COLUMN IF NOT EXISTS horario_semanal JSONB DEFAULT '{
  "lunes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "martes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "miercoles": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "jueves": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "viernes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "sabado": {"activo": true, "inicio": "09:00", "fin": "14:00"},
  "domingo": {"activo": false, "inicio": "09:00", "fin": "18:00"}
}'::jsonb;

COMMENT ON COLUMN sedes.horario_semanal IS 'Weekly operating hours per day (JSONB)';

-- Create index for JSONB field
CREATE INDEX IF NOT EXISTS idx_sedes_horario_semanal ON sedes USING GIN (horario_semanal);

-- =====================================================
-- 3. Add image field to sedes table (temporary)
-- =====================================================
-- This will be migrated to Supabase Storage in migration 007
-- For now, we keep the URL field for backward compatibility

ALTER TABLE sedes
ADD COLUMN IF NOT EXISTS foto_url TEXT;

COMMENT ON COLUMN sedes.foto_url IS 'URL or path to sede photo (will be migrated to Storage)';

-- =====================================================
-- 4. Helper function to get sede operating hours for a day
-- =====================================================
-- Returns the operating hours for a specific day of the week

CREATE OR REPLACE FUNCTION get_sede_horario(
  p_sede_id UUID,
  p_dia_semana TEXT -- 'lunes', 'martes', etc.
)
RETURNS TABLE(activo BOOLEAN, inicio TIME, fin TIME) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (horario_semanal->p_dia_semana->>'activo')::BOOLEAN as activo,
    (horario_semanal->p_dia_semana->>'inicio')::TIME as inicio,
    (horario_semanal->p_dia_semana->>'fin')::TIME as fin
  FROM sedes
  WHERE id = p_sede_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_sede_horario IS 'Gets operating hours for a sede on a specific day of week';

-- =====================================================
-- 5. Function to check if sede is open on a specific day/time
-- =====================================================

CREATE OR REPLACE FUNCTION is_sede_open(
  p_sede_id UUID,
  p_dia_semana TEXT,
  p_hora TIME DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_activo BOOLEAN;
  v_inicio TIME;
  v_fin TIME;
BEGIN
  -- Get the schedule for the day
  SELECT 
    (horario_semanal->p_dia_semana->>'activo')::BOOLEAN,
    (horario_semanal->p_dia_semana->>'inicio')::TIME,
    (horario_semanal->p_dia_semana->>'fin')::TIME
  INTO v_activo, v_inicio, v_fin
  FROM sedes
  WHERE id = p_sede_id;
  
  -- If sede is not active on this day, return false
  IF NOT v_activo THEN
    RETURN FALSE;
  END IF;
  
  -- If no specific time is provided, just check if sede is open that day
  IF p_hora IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if the specific time falls within operating hours
  RETURN p_hora >= v_inicio AND p_hora < v_fin;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_sede_open IS 'Checks if sede is open on a specific day and optionally at a specific time';

-- =====================================================
-- 6. Backfill existing sedes with default schedule
-- =====================================================
-- All existing sedes get the default schedule (already done via DEFAULT value)
-- This is just to ensure any NULLs are filled

UPDATE sedes
SET horario_semanal = '{
  "lunes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "martes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "miercoles": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "jueves": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "viernes": {"activo": true, "inicio": "09:00", "fin": "18:00"},
  "sabado": {"activo": true, "inicio": "09:00", "fin": "14:00"},
  "domingo": {"activo": false, "inicio": "09:00", "fin": "18:00"}
}'::jsonb
WHERE horario_semanal IS NULL;

-- =====================================================
-- Migration complete
-- =====================================================
-- Sedes now support:
-- - Geographic coordinates (latitud/longitud) for Google Maps
-- - Custom weekly operating hours
-- - Photo URL field (will be migrated to Storage in migration 007)

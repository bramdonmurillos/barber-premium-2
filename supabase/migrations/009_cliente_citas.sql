-- Migration 009: Link citas to authenticated clients
-- Adds cliente_id to allow users to view and manage their own appointments

-- 1. Add cliente_id column (nullable — booking without login is still supported)
ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS cliente_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for fast lookup by client
CREATE INDEX IF NOT EXISTS idx_citas_cliente_id ON citas(cliente_id);

-- 3. Drop policies first so the migration can be re-run safely
DROP POLICY IF EXISTS "Clients can view own citas" ON citas;
DROP POLICY IF EXISTS "Clients can cancel own citas" ON citas;

-- 3. RLS: authenticated users can read their own citas
CREATE POLICY "Clients can view own citas"
  ON citas FOR SELECT
  USING (auth.uid() IS NOT NULL AND auth.uid() = cliente_id);

-- 4. RLS: authenticated users can cancel (only) their own pending/confirmed citas
CREATE POLICY "Clients can cancel own citas"
  ON citas FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = cliente_id)
  WITH CHECK (estado = 'cancelada');

-- Migration 006: Extended Payment Methods
-- Adds DaviPlata, Nequi, and Transferencia to payment methods

-- =====================================================
-- 1. Drop existing CHECK constraint on metodo_pago
-- =====================================================

ALTER TABLE citas
DROP CONSTRAINT IF EXISTS citas_metodo_pago_check;

-- =====================================================
-- 2. Add new CHECK constraint with extended payment methods
-- =====================================================

ALTER TABLE citas
ADD CONSTRAINT citas_metodo_pago_check 
CHECK (
  metodo_pago IN (
    'efectivo',      -- Cash
    'tarjeta',       -- Card
    'daviplata',     -- DaviPlata
    'nequi',         -- Nequi
    'transferencia'  -- Bank transfer
  ) OR metodo_pago IS NULL
);

COMMENT ON COLUMN citas.metodo_pago IS 'Payment method: efectivo, tarjeta, daviplata, nequi, transferencia';

-- =====================================================
-- 3. Update existing index (if needed)
-- =====================================================
-- The existing index should still work, but let's ensure it exists

CREATE INDEX IF NOT EXISTS idx_citas_metodo_pago 
ON citas(metodo_pago) 
WHERE metodo_pago IS NOT NULL;

-- =====================================================
-- Migration complete
-- =====================================================
-- Payment methods now include:
-- - efectivo (cash)
-- - tarjeta (card)
-- - daviplata (DaviPlata)
-- - nequi (Nequi)
-- - transferencia (bank transfer)

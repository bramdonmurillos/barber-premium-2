-- ============================================================================
-- Migration: Add metodo_pago column to citas table
-- Date: 2026-02-27
-- Description: Add payment method tracking for completed appointments
-- ============================================================================

-- Add metodo_pago column to citas table
ALTER TABLE citas 
ADD COLUMN metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta') OR metodo_pago IS NULL);

-- Add index for reporting queries
CREATE INDEX idx_citas_metodo_pago ON citas(metodo_pago) WHERE metodo_pago IS NOT NULL;

-- Add comment
COMMENT ON COLUMN citas.metodo_pago IS 'Payment method: efectivo (cash) or tarjeta (card), required when estado = completada';

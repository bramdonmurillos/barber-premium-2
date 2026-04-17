-- ============================================================================
-- BarberFlow - Multi-Tenant Database Schema
-- Phase 1: Core Infrastructure with Row Level Security (RLS)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- TABLE: profiles (Dueños/Owners)
-- Stores owner profile information linked to Supabase Auth
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for email lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- TABLE: sedes (Locations/Branches)
-- Each owner can have multiple locations
-- ============================================================================

CREATE TABLE sedes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  direccion TEXT,
  telefono TEXT,
  whatsapp TEXT,
  slug TEXT UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Indexes
CREATE INDEX idx_sedes_owner_id ON sedes(owner_id);
CREATE INDEX idx_sedes_slug ON sedes(slug);
CREATE INDEX idx_sedes_activo ON sedes(activo);

-- ============================================================================
-- TABLE: barberos (Barbers)
-- Professionals linked to specific locations
-- ============================================================================

CREATE TABLE barberos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  foto_url TEXT,
  especialidad TEXT,
  activo BOOLEAN DEFAULT true NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_barberos_sede_id ON barberos(sede_id);
CREATE INDEX idx_barberos_activo ON barberos(activo);
CREATE INDEX idx_barberos_orden ON barberos(orden);

-- ============================================================================
-- TABLE: servicios (Services)
-- Service catalog per location
-- ============================================================================

CREATE TABLE servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
  activo BOOLEAN DEFAULT true NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_servicios_sede_id ON servicios(sede_id);
CREATE INDEX idx_servicios_activo ON servicios(activo);
CREATE INDEX idx_servicios_orden ON servicios(orden);

-- ============================================================================
-- TABLE: citas (Appointments)
-- Booking records with customer information
-- ============================================================================

CREATE TABLE citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  barbero_id UUID NOT NULL REFERENCES barberos(id) ON DELETE RESTRICT,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
  cliente_nombre TEXT NOT NULL,
  cliente_whatsapp TEXT NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  estado TEXT DEFAULT 'pendiente' NOT NULL 
    CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_citas_sede_id ON citas(sede_id);
CREATE INDEX idx_citas_barbero_id ON citas(barbero_id);
CREATE INDEX idx_citas_fecha_hora ON citas(fecha_hora);
CREATE INDEX idx_citas_estado ON citas(estado);
CREATE INDEX idx_citas_cliente_whatsapp ON citas(cliente_whatsapp);

-- Note: Overlapping appointment prevention is handled at application level
-- Alternative: Use a unique partial index or implement in booking logic
-- This avoids IMMUTABLE function requirement issues with EXCLUDE constraints

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES Policies
-- ----------------------------------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- SEDES Policies (Owner Access)
-- ----------------------------------------------------------------------------

-- Owners can view their own sedes
CREATE POLICY "Owners can view own sedes"
  ON sedes FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can insert their own sedes
CREATE POLICY "Owners can insert own sedes"
  ON sedes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own sedes
CREATE POLICY "Owners can update own sedes"
  ON sedes FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own sedes
CREATE POLICY "Owners can delete own sedes"
  ON sedes FOR DELETE
  USING (auth.uid() = owner_id);

-- Public can view active sedes by slug (for booking pages)
CREATE POLICY "Public can view active sedes by slug"
  ON sedes FOR SELECT
  USING (activo = true);

-- ----------------------------------------------------------------------------
-- BARBEROS Policies
-- ----------------------------------------------------------------------------

-- Owners can manage barberos in their sedes
CREATE POLICY "Owners can view barberos in their sedes"
  ON barberos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = barberos.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert barberos in their sedes"
  ON barberos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = barberos.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update barberos in their sedes"
  ON barberos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = barberos.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete barberos in their sedes"
  ON barberos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = barberos.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

-- Public can view active barberos in active sedes (for booking pages)
CREATE POLICY "Public can view active barberos"
  ON barberos FOR SELECT
  USING (
    activo = true AND
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = barberos.sede_id 
      AND sedes.activo = true
    )
  );

-- ----------------------------------------------------------------------------
-- SERVICIOS Policies
-- ----------------------------------------------------------------------------

-- Owners can manage servicios in their sedes
CREATE POLICY "Owners can view servicios in their sedes"
  ON servicios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = servicios.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert servicios in their sedes"
  ON servicios FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = servicios.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update servicios in their sedes"
  ON servicios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = servicios.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete servicios in their sedes"
  ON servicios FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = servicios.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

-- Public can view active servicios in active sedes (for booking pages)
CREATE POLICY "Public can view active servicios"
  ON servicios FOR SELECT
  USING (
    activo = true AND
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = servicios.sede_id 
      AND sedes.activo = true
    )
  );

-- ----------------------------------------------------------------------------
-- CITAS Policies
-- ----------------------------------------------------------------------------

-- Owners can view citas in their sedes
CREATE POLICY "Owners can view citas in their sedes"
  ON citas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = citas.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

-- Owners can update citas in their sedes
CREATE POLICY "Owners can update citas in their sedes"
  ON citas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = citas.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

-- Owners can delete citas in their sedes
CREATE POLICY "Owners can delete citas in their sedes"
  ON citas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = citas.sede_id 
      AND sedes.owner_id = auth.uid()
    )
  );

-- Public can insert citas (for booking flow)
-- Validates that sede, barbero, and servicio are active and properly related
CREATE POLICY "Public can create citas"
  ON citas FOR INSERT
  WITH CHECK (
    -- Sede must be active
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE sedes.id = citas.sede_id 
      AND sedes.activo = true
    )
    AND
    -- Barbero must be active and belong to the sede
    EXISTS (
      SELECT 1 FROM barberos 
      WHERE barberos.id = citas.barbero_id 
      AND barberos.sede_id = citas.sede_id
      AND barberos.activo = true
    )
    AND
    -- Servicio must be active and belong to the sede
    EXISTS (
      SELECT 1 FROM servicios 
      WHERE servicios.id = citas.servicio_id 
      AND servicios.sede_id = citas.sede_id
      AND servicios.activo = true
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sedes_updated_at
  BEFORE UPDATE ON sedes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barberos_updated_at
  BEFORE UPDATE ON barberos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at
  BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_updated_at
  BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REALTIME CONFIGURATION
-- Enable realtime for citas table (for dashboard notifications)
-- ============================================================================

-- Note: Realtime must be enabled in Supabase Dashboard for the citas table
-- Go to: Database > Replication > Enable for 'citas'

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to add sample data for development/testing
/*
-- Insert test owner (use actual auth.users id after creating a test account)
INSERT INTO profiles (id, email, nombre_completo) 
VALUES ('your-test-user-uuid-here', 'test@example.com', 'Test Owner');

-- Insert test sede
INSERT INTO sedes (owner_id, nombre, slug, direccion) 
VALUES ('your-test-user-uuid-here', 'Barbería Centro', 'barberia-centro', 'Calle Principal 123');
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

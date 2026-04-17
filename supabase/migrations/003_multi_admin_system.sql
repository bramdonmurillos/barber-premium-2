-- Migration 003: Multi-Administrator System
-- Enables multiple administrators per barbershop with invitation system

-- =====================================================
-- 1. Create barberia_admins table
-- =====================================================
-- This table tracks all administrators for each sede
-- The original owner_id in sedes table remains the creator

CREATE TABLE IF NOT EXISTS barberia_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' NOT NULL CHECK (role IN ('admin', 'owner')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a user can only be admin once per sede
  CONSTRAINT unique_sede_user UNIQUE (sede_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_barberia_admins_sede_id ON barberia_admins(sede_id);
CREATE INDEX idx_barberia_admins_user_id ON barberia_admins(user_id);

-- =====================================================
-- 2. Create admin_invitations table
-- =====================================================
-- Tracks pending invitations to become an administrator

CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sede_id UUID NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_admin_invitations_sede_id ON admin_invitations(sede_id);
CREATE INDEX idx_admin_invitations_token ON admin_invitations(token);
CREATE INDEX idx_admin_invitations_email ON admin_invitations(invited_email);
CREATE INDEX idx_admin_invitations_status ON admin_invitations(status);

-- =====================================================
-- 3. Function to check if user is admin of a sede
-- =====================================================
-- This function will be used in RLS policies

CREATE OR REPLACE FUNCTION is_sede_admin(p_sede_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is in barberia_admins table OR is the original owner
  RETURN EXISTS (
    SELECT 1 FROM barberia_admins 
    WHERE sede_id = p_sede_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM sedes 
    WHERE id = p_sede_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. Function to automatically add creator as admin
-- =====================================================
-- This trigger function adds the sede creator to barberia_admins

CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO barberia_admins (sede_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after sede creation
DROP TRIGGER IF EXISTS on_sede_created_add_admin ON sedes;
CREATE TRIGGER on_sede_created_add_admin
  AFTER INSERT ON sedes
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_admin();

-- =====================================================
-- 5. Backfill existing sedes with creator as admin
-- =====================================================
-- Add all existing sede owners to barberia_admins table

INSERT INTO barberia_admins (sede_id, user_id, role, invited_by)
SELECT id, owner_id, 'owner', owner_id
FROM sedes
ON CONFLICT (sede_id, user_id) DO NOTHING;

-- =====================================================
-- 6. RLS Policies for barberia_admins
-- =====================================================

-- Enable RLS
ALTER TABLE barberia_admins ENABLE ROW LEVEL SECURITY;

-- Admins can view all admins in their sedes
CREATE POLICY "Admins can view admins in their sedes"
  ON barberia_admins FOR SELECT
  USING (is_sede_admin(sede_id));

-- Admins can add new admins to their sedes (via accepting invitations)
CREATE POLICY "Admins can add admins to their sedes"
  ON barberia_admins FOR INSERT
  WITH CHECK (is_sede_admin(sede_id));

-- Only owners can remove admins (not themselves)
CREATE POLICY "Owners can remove admins from their sedes"
  ON barberia_admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sedes 
      WHERE id = sede_id AND owner_id = auth.uid()
    )
    AND user_id != auth.uid() -- Can't remove yourself
  );

-- =====================================================
-- 7. RLS Policies for admin_invitations
-- =====================================================

-- Enable RLS
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations for their sedes
CREATE POLICY "Admins can view invitations in their sedes"
  ON admin_invitations FOR SELECT
  USING (is_sede_admin(sede_id));

-- Admins can create invitations for their sedes
CREATE POLICY "Admins can create invitations for their sedes"
  ON admin_invitations FOR INSERT
  WITH CHECK (is_sede_admin(sede_id));

-- Admins can update invitations (cancel, mark as expired)
CREATE POLICY "Admins can update invitations in their sedes"
  ON admin_invitations FOR UPDATE
  USING (is_sede_admin(sede_id))
  WITH CHECK (is_sede_admin(sede_id));

-- Invited users can view their own invitations
CREATE POLICY "Users can view invitations sent to their email"
  ON admin_invitations FOR SELECT
  USING (
    invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- =====================================================
-- 8. Update existing RLS policies to use is_sede_admin
-- =====================================================

-- Update sedes policies
DROP POLICY IF EXISTS "Owners can view their sedes" ON sedes;
CREATE POLICY "Admins can view their sedes"
  ON sedes FOR SELECT
  USING (is_sede_admin(id));

DROP POLICY IF EXISTS "Owners can update their sedes" ON sedes;
CREATE POLICY "Admins can update their sedes"
  ON sedes FOR UPDATE
  USING (is_sede_admin(id))
  WITH CHECK (is_sede_admin(id));

DROP POLICY IF EXISTS "Owners can delete their sedes" ON sedes;
CREATE POLICY "Owners can delete their sedes"
  ON sedes FOR DELETE
  USING (owner_id = auth.uid()); -- Only original owner can delete

-- Update barberos policies
DROP POLICY IF EXISTS "Owners can view barberos in their sedes" ON barberos;
CREATE POLICY "Admins can view barberos in their sedes"
  ON barberos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = barberos.sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can create barberos in their sedes" ON barberos;
CREATE POLICY "Admins can create barberos in their sedes"
  ON barberos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can update barberos in their sedes" ON barberos;
CREATE POLICY "Admins can update barberos in their sedes"
  ON barberos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = barberos.sede_id AND is_sede_admin(sedes.id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = barberos.sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can delete barberos in their sedes" ON barberos;
CREATE POLICY "Admins can delete barberos in their sedes"
  ON barberos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = barberos.sede_id AND is_sede_admin(sedes.id))
  );

-- Update servicios policies
DROP POLICY IF EXISTS "Owners can view servicios in their sedes" ON servicios;
CREATE POLICY "Admins can view servicios in their sedes"
  ON servicios FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = servicios.sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can create servicios in their sedes" ON servicios;
CREATE POLICY "Admins can create servicios in their sedes"
  ON servicios FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can update servicios in their sedes" ON servicios;
CREATE POLICY "Admins can update servicios in their sedes"
  ON servicios FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = servicios.sede_id AND is_sede_admin(sedes.id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = servicios.sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can delete servicios in their sedes" ON servicios;
CREATE POLICY "Admins can delete servicios in their sedes"
  ON servicios FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = servicios.sede_id AND is_sede_admin(sedes.id))
  );

-- Update citas policies
DROP POLICY IF EXISTS "Owners can view citas in their sedes" ON citas;
CREATE POLICY "Admins can view citas in their sedes"
  ON citas FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = citas.sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can update citas in their sedes" ON citas;
CREATE POLICY "Admins can update citas in their sedes"
  ON citas FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = citas.sede_id AND is_sede_admin(sedes.id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = citas.sede_id AND is_sede_admin(sedes.id))
  );

DROP POLICY IF EXISTS "Owners can delete citas in their sedes" ON citas;
CREATE POLICY "Admins can delete citas in their sedes"
  ON citas FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM sedes WHERE sedes.id = citas.sede_id AND is_sede_admin(sedes.id))
  );

-- =====================================================
-- 9. Updated_at trigger for new tables
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_barberia_admins_updated_at
  BEFORE UPDATE ON barberia_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_invitations_updated_at
  BEFORE UPDATE ON admin_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration complete
-- =====================================================
-- All sedes now support multiple administrators
-- Existing owners have been added as admins
-- RLS policies updated to check admin membership

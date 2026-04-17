import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useSede } from './SedeContext';

const AdminContext = createContext();

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const { selectedSede } = useSede();
  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch admins for the selected sede
   */
  const fetchAdmins = async (sedeId) => {
    if (!sedeId) {
      setAdmins([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('barberia_admins')
        .select(`
          id,
          role,
          created_at,
          user_id,
          invited_by,
          profiles:user_id (
            id,
            email,
            nombre_completo
          ),
          inviter:invited_by (
            email,
            nombre_completo
          )
        `)
        .eq('sede_id', sedeId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch pending invitations for the selected sede
   */
  const fetchInvitations = async (sedeId) => {
    if (!sedeId) {
      setInvitations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('admin_invitations')
        .select(`
          id,
          invited_email,
          status,
          expires_at,
          created_at,
          invited_by,
          inviter:invited_by (
            email,
            nombre_completo
          )
        `)
        .eq('sede_id', sedeId)
        .in('status', ['pending', 'expired'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Invite a new admin by email
   * Creates an invitation record and sends email (email sending to be implemented)
   */
  const inviteAdmin = async (sedeId, email) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user already exists as admin
      const { data: existingAdmin } = await supabase
        .from('barberia_admins')
        .select('id, profiles:user_id(email)')
        .eq('sede_id', sedeId);

      const emailExists = existingAdmin?.some(admin => admin.profiles?.email === email);
      if (emailExists) {
        throw new Error('Este usuario ya es administrador de esta sede');
      }

      // Check for pending invitation
      const { data: pendingInvitation } = await supabase
        .from('admin_invitations')
        .select('id')
        .eq('sede_id', sedeId)
        .eq('invited_email', email)
        .eq('status', 'pending')
        .single();

      if (pendingInvitation) {
        throw new Error('Ya existe una invitación pendiente para este correo');
      }

      // Generate invitation token
      const token = crypto.randomUUID();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation record
      const { data, error: insertError } = await supabase
        .from('admin_invitations')
        .insert({
          sede_id: sedeId,
          invited_email: email,
          token,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          invited_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // TODO: Send invitation email via Supabase Edge Function or email service
      // For now, we'll just log the invitation link
      const invitationLink = `${window.location.origin}/accept-invitation?token=${token}`;
      console.log('Invitation link (email sending not implemented):', invitationLink);
      console.log('Send this link to:', email);

      // Refresh invitations list
      await fetchInvitations(sedeId);

      return {
        success: true,
        invitationLink,
        message: 'Invitación creada. Por favor, envía el enlace al nuevo administrador.'
      };
    } catch (err) {
      console.error('Error inviting admin:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove an admin from the sede
   * Only the owner can remove admins (except themselves)
   */
  const removeAdmin = async (sedeId, adminId, adminUserId) => {
    try {
      setLoading(true);
      setError(null);

      // Prevent removing yourself
      if (adminUserId === user.id) {
        throw new Error('No puedes eliminarte a ti mismo como administrador');
      }

      const { error: deleteError } = await supabase
        .from('barberia_admins')
        .delete()
        .eq('id', adminId)
        .eq('sede_id', sedeId);

      if (deleteError) throw deleteError;

      // Refresh admins list
      await fetchAdmins(sedeId);

      return { success: true };
    } catch (err) {
      console.error('Error removing admin:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a pending invitation
   */
  const cancelInvitation = async (sedeId, invitationId) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('admin_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('sede_id', sedeId);

      if (updateError) throw updateError;

      // Refresh invitations list
      await fetchInvitations(sedeId);

      return { success: true };
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Accept an invitation (called when user clicks invitation link)
   */
  const acceptInvitation = async (token) => {
    try {
      setLoading(true);
      setError(null);

      // Get invitation by token
      const { data: invitation, error: fetchError } = await supabase
        .from('admin_invitations')
        .select('*, sedes(id, nombre)')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError) throw new Error('Invitación no encontrada o ya ha sido utilizada');

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('admin_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        throw new Error('Esta invitación ha expirado');
      }

      // Check if user's email matches invitation
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile.email !== invitation.invited_email) {
        throw new Error('Esta invitación fue enviada a otro correo electrónico');
      }

      // Add user as admin
      const { error: insertError } = await supabase
        .from('barberia_admins')
        .insert({
          sede_id: invitation.sede_id,
          user_id: user.id,
          role: 'admin',
          invited_by: invitation.invited_by
        });

      if (insertError) throw insertError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('admin_invitations')
        .update({ 
          status: 'accepted',
          accepted_by: user.id
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      return {
        success: true,
        sede: invitation.sedes
      };
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect: Fetch admins and invitations when selected sede changes
   */
  useEffect(() => {
    if (selectedSede && user) {
      fetchAdmins(selectedSede.id);
      fetchInvitations(selectedSede.id);
    } else {
      setAdmins([]);
      setInvitations([]);
    }
  }, [selectedSede, user]);

  const value = {
    admins,
    invitations,
    loading,
    error,
    fetchAdmins,
    fetchInvitations,
    inviteAdmin,
    removeAdmin,
    cancelInvitation,
    acceptInvitation
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

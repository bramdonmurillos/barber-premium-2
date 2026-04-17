import { useState } from 'react';
import { Shield, Mail, X, Clock, CheckCircle, XCircle, Loader2, UserPlus, Copy } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAdminContext } from '../contexts/AdminContext';
import { useSede } from '../contexts/SedeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Admins() {
  const { selectedSede } = useSede();
  const { user } = useAuth();
  const { admins, invitations, loading, inviteAdmin, removeAdmin, cancelInvitation } = useAdminContext();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [invitationLink, setInvitationLink] = useState(null);

  /**
   * Handle invite submission
   */
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setInvitationLink(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setInviteLoading(true);
    const result = await inviteAdmin(selectedSede.id, inviteEmail);
    setInviteLoading(false);

    if (result.success) {
      setInviteSuccess(result.message);
      setInvitationLink(result.invitationLink);
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteForm(false);
        setInviteSuccess(null);
      }, 5000);
    } else {
      setInviteError(result.error);
    }
  };

  /**
   * Handle remove admin with confirmation
   */
  const handleRemoveAdmin = async (admin) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${admin.profiles.nombre_completo || admin.profiles.email} como administrador?`)) {
      return;
    }

    const result = await removeAdmin(selectedSede.id, admin.id, admin.user_id);
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  /**
   * Handle cancel invitation with confirmation
   */
  const handleCancelInvitation = async (invitation) => {
    if (!window.confirm(`¿Estás seguro de cancelar la invitación a ${invitation.invited_email}?`)) {
      return;
    }

    const result = await cancelInvitation(selectedSede.id, invitation.id);
    if (!result.success) {
      alert(`Error: ${result.error}`);
    }
  };

  /**
   * Copy invitation link to clipboard
   */
  const copyInvitationLink = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      alert('Enlace copiado al portapapeles');
    }
  };

  /**
   * Get formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Check if invitation is expired
   */
  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (!selectedSede) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Por favor selecciona una sede para ver los administradores</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Administradores</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona quién tiene acceso a {selectedSede.nombre}</p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-600 transition-colors font-medium flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Invitar Administrador
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Invitar Nuevo Administrador</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@ejemplo.com"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold focus:border-transparent"
                  required
                  disabled={inviteLoading}
                />
              </div>

              {inviteError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <XCircle className="w-4 h-4" />
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {inviteSuccess}
                  </div>
                  {invitationLink && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enlace de invitación (enviar al nuevo administrador):</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 px-3 py-2 rounded overflow-x-auto">
                          {invitationLink}
                        </code>
                        <button
                          type="button"
                          onClick={copyInvitationLink}
                          className="px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Nota: El envío automático de emails se implementará próximamente. Por ahora, copia y envía este enlace manualmente.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {inviteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar Invitación
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteError(null);
                    setInviteSuccess(null);
                    setInvitationLink(null);
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Current Admins */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Administradores Actuales</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && admins.length === 0 ? (
              <div className="p-6 text-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
              </div>
            ) : admins.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No hay administradores registrados
              </div>
            ) : (
              admins.map((admin) => {
                const isOwner = admin.role === 'owner';
                const isCurrentUser = admin.user_id === user.id;

                return (
                  <div key={admin.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-gray-900 dark:text-white font-medium">
                            {admin.profiles.nombre_completo || admin.profiles.email}
                          </h3>
                          {isOwner && (
                            <span className="px-2 py-0.5 bg-gold text-black text-xs font-semibold rounded">
                              Creador
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{admin.profiles.email}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Unido el {formatDate(admin.created_at)}
                          {admin.inviter && ` • Invitado por ${admin.inviter.nombre_completo || admin.inviter.email}`}
                        </p>
                      </div>
                    </div>
                    {!isOwner && !isCurrentUser && (
                      <button
                        onClick={() => handleRemoveAdmin(admin)}
                        className="px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invitaciones Pendientes</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {invitations.map((invitation) => {
                const expired = isExpired(invitation.expires_at);

                return (
                  <div key={invitation.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-gray-900 dark:text-white font-medium">{invitation.invited_email}</h3>
                          {expired ? (
                            <span className="px-2 py-0.5 bg-red-900 text-red-200 text-xs font-semibold rounded">
                              Expirada
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-900 text-yellow-200 text-xs font-semibold rounded">
                              Pendiente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {expired ? 'Expiró' : 'Expira'} el {formatDate(invitation.expires_at)}
                          {invitation.inviter && ` • Invitado por ${invitation.inviter.nombre_completo || invitation.inviter.email}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation)}
                      className="px-3 py-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

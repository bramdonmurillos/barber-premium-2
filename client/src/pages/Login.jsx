import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { user, signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  console.log('🔐 Login page - user:', user?.id)

  useEffect(() => {
    if (!user) return
    const checkAndRedirect = async () => {
      const [{ data: ownedSedes }, { data: adminSedes }] = await Promise.all([
        supabase.from('sedes').select('id').eq('owner_id', user.id).limit(1),
        supabase.from('barberia_admins').select('id').eq('user_id', user.id).limit(1),
      ])
      const isAdmin = (ownedSedes?.length > 0) || (adminSedes?.length > 0)
      navigate(isAdmin ? '/dashboard' : '/mis-citas')
    }
    checkAndRedirect()
  }, [user, navigate])

  async function handleGoogleLogin() {
    try {
      console.log('🔐 Login - Starting Google OAuth')
      setLoading(true)
      setError(null)
      await signInWithGoogle()
      console.log('🔐 Login - Google OAuth completed')
    } catch (err) {
      console.error('🔐 Login - Error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-gold mb-6 text-center">
          Iniciar Sesión
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Accede con tu cuenta de Google
        </p>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
              </svg>
              Continuar con Google
            </>
          )}
        </button>
        <p className="text-gray-400 text-sm text-center mt-6">
          Inicia sesión para revisar las citas de barbería
        </p>
      </div>
    </div>
  )
}

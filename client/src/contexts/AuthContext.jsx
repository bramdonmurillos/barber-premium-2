import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔑 AuthContext - Initializing')
    
    // Safety timeout - force loading to false after 5 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ AuthContext - Safety timeout reached, forcing loading=false')
      setLoading(false)
    }, 5000)
    
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔑 AuthContext - Initial session check:', session?.user?.id || 'No session')
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => clearTimeout(safetyTimeout))
      } else {
        console.log('🔑 AuthContext - No session, setting loading to false')
        setLoading(false)
        clearTimeout(safetyTimeout)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔑 AuthContext - Auth state changed:', _event, session?.user?.id || 'No user')
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    try {
      console.log('🔍 Fetching profile for userId:', userId)
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      })
      
      // Race between the query and timeout
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (error) {
        console.error('❌ Error fetching profile:', error)
        // Don't throw, just set profile to null and continue
        setProfile(null)
        return
      }
      
      if (!data) {
        console.warn('⚠️ Profile not found, creating placeholder')
        // Profile doesn't exist yet, trigger should create it
        // For now, create a basic placeholder to avoid blocking
        setProfile({ 
          id: userId, 
          email: null,
          nombre_completo: null 
        })
      } else {
        console.log('✅ Profile loaded:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('❌ Error fetching profile (caught):', error.message)
      // Set a basic profile to avoid blocking the app
      setProfile({ 
        id: userId, 
        email: null,
        nombre_completo: null 
      })
    } finally {
      console.log('✅ fetchProfile finally - setting loading to false')
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    fetchProfile, // Exponer fetchProfile para recargar el perfil manualmente
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

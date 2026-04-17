import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  console.log('🔒 ProtectedRoute - loading:', loading, 'user:', user?.id)

  if (loading) {
    console.log('🔒 ProtectedRoute - Showing loading spinner')
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🔒 ProtectedRoute - No user, redirecting to login')
    return <Navigate to="/login" replace />
  }
  
  console.log('🔒 ProtectedRoute - User authenticated, rendering children')
  return children
}

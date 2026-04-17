import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SedeProvider } from './contexts/SedeContext'
import { AdminProvider } from './contexts/AdminContext'
import { BarberoProvider } from './contexts/BarberoContext'
import { ServicioProvider } from './contexts/ServicioContext'
import { CitaProvider } from './contexts/CitaContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sedes from './pages/Sedes'
import Admins from './pages/Admins'
import Barberos from './pages/Barberos'
import Servicios from './pages/Servicios'
import Profile from './pages/Profile'
import Citas from './pages/Citas'
import Reportes from './pages/Reportes'
import Booking from './pages/Booking'
import MisCitas from './pages/MisCitas'

function App() {
  return (
    <AuthProvider>
      <SedeProvider>
        <AdminProvider>
          <BarberoProvider>
            <ServicioProvider>
              <CitaProvider>
                <BrowserRouter>
                  <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/sedes" 
                    element={
                      <ProtectedRoute>
                        <Sedes />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/admins" 
                    element={
                      <ProtectedRoute>
                        <Admins />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/barberos" 
                    element={
                      <ProtectedRoute>
                        <Barberos />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/servicios" 
                    element={
                      <ProtectedRoute>
                        <Servicios />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/perfil" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/citas" 
                    element={
                      <ProtectedRoute>
                        <Citas />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/reportes" 
                    element={
                      <ProtectedRoute>
                        <Reportes />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/book/:sedeSlug" element={<Booking />} />
                  <Route
                    path="/mis-citas"
                    element={
                      <ProtectedRoute>
                        <MisCitas />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </CitaProvider>
          </ServicioProvider>
        </BarberoProvider>
      </AdminProvider>
    </SedeProvider>
  </AuthProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Services from './pages/Services'
import Testimonials from './pages/Testimonials'
import Homepage from './pages/Homepage'
import SiteSettings from './pages/SiteSettings'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import MediaLibrary from './pages/MediaLibrary'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/homepage"
            element={
              <ProtectedRoute>
                <Homepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            }
          />
          <Route
            path="/testimonials"
            element={
              <ProtectedRoute>
                <Testimonials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <MediaLibrary initialType="image" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/images"
            element={
              <ProtectedRoute>
                <MediaLibrary initialType="image" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media/videos"
            element={
              <ProtectedRoute>
                <MediaLibrary initialType="video" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SiteSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/seo"
            element={
              <ProtectedRoute>
                <SiteSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/navigation"
            element={
              <ProtectedRoute>
                <SiteSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/security"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

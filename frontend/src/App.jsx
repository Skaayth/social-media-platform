import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Landing from './pages/Landing.jsx'
import Main from './pages/Main.jsx'
import Profile from './pages/Profile.jsx'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  
  // Check for token in URL (OAuth callback)
  const params = new URLSearchParams(location.search)
  const tokenInUrl = params.get('token')
  
  // Allow access if user is set OR if there's a token in localStorage OR token in URL
  const hasToken = localStorage.getItem('authToken')
  const hasStoredUser = localStorage.getItem('loggedInUser')
  
  return (user || hasToken || hasStoredUser || tokenInUrl) ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/main"
          element={
            <PrivateRoute>
              <Main />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

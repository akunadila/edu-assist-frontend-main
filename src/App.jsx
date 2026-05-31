import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import OnboardingPage from './pages/OnboardingPage'
import AuthCallback from './pages/AuthCallback'
import ChatPage from './pages/ChatPage'
import NotFoundPage from './pages/NotFoundPage'
import PersonalizationPage from './pages/PersonalizationPage'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken')
  const guestSessionId = localStorage.getItem('guestSessionId')
  if (!token && !guestSessionId) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/personalization" element={
          <ProtectedRoute>
            <PersonalizationPage />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
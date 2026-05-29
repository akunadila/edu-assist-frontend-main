import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../services/api'
import { clearGuestChatState } from '../services/chatSessionIdentity'
import { setAccessToken, setUserProfile } from '../services/authStorage'
import '../styles/authcallback.css'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (!token) {
        navigate('/')
        return
      }

      setAccessToken(token)
      clearGuestChatState()

      try {
        const data = await getMe()
        const user = data.user || data
        setUserProfile({
          nama: user.name || user.nama || user.displayName || 'User',
          email: user.email || '',
          foto: user.picture || user.foto || '',
          userId: user.id || user.userId || '',
          levelPendidikan: user.levelPendidikan || '',
          preferensiTone: user.preferensiTone || '',
        })
      } catch (err) {
        console.error('Gagal fetch user profile:', err)
      }

      navigate('/chat')
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="callback-root">
      <div className="callback-grid" />
      <div className="callback-card">
        <div className="callback-spinner" />
        <p className="callback-text">Sedang masuk...</p>
        <p className="callback-sub">Mohon tunggu sebentar</p>
      </div>
    </div>
  )
}

export default AuthCallback

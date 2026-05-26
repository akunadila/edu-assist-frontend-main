import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

      localStorage.setItem('accessToken', token)

      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://edu-assist-be.onrender.com'
        const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          const user = data.user || data
          localStorage.setItem('userProfile', JSON.stringify({
            nama: user.name || user.nama || user.displayName || 'User',
            email: user.email || '',
            foto: user.picture || user.foto || '',
            userId: user.id || user.userId || '',
            levelPendidikan: user.levelPendidikan || '',
            preferensiTone: user.preferensiTone || '',
          }))
        }
      } catch (err) {
        console.error('Gagal fetch user profile:', err)
      }

      navigate('/chat')
    }

    handleCallback()
  }, [])

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
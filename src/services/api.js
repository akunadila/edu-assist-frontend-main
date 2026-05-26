import api from './axiosInstance'

/* =========================
   AUTH
========================= */
export function loginWithGoogle() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://edu-assist-be.onrender.com'
  window.location.href = `${BASE_URL}/api/v1/auth/google`
}

export async function getMe() {
  return await api.get('/api/v1/auth/me')
}

export async function logout() {
  await api.post('/api/v1/auth/logout')
  localStorage.removeItem('accessToken')
  window.location.href = '/'
}

/* =========================
   CHAT SESSIONS
========================= */
export async function createChatSession(payload = {}) {
  try {
    return await api.post('/api/v1/chat/sessions', {
      title: payload.title || 'New Chat',
      linkedDocumentIds: payload.linkedDocumentIds || [],
      studentProfile: payload.studentProfile || {
        educationLevel: 'undergraduate',
        difficultyPreference: 'medium',
        favouriteSubjects: [],
        pace: 'medium',        // ← fix dari 'normal' ke 'medium'
        explanationStyle: 'concise',
      },
      guestSessionId: payload.guestSessionId || undefined,
      initialContext: payload.initialContext || undefined,
    })
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal membuat sesi chat')
  }
}

export async function listChatSessions(guestSessionId = null) {
  try {
    const params = guestSessionId ? `?guestSessionId=${guestSessionId}` : ''
    return await api.get(`/api/v1/chat/sessions${params}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil sesi chat')
  }
}

export async function resumeChatSession(sessionId, guestSessionId = null) {
  try {
    const params = guestSessionId ? `?guestSessionId=${guestSessionId}` : ''
    return await api.get(`/api/v1/chat/sessions/${sessionId}${params}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil sesi chat')
  }
}

export async function getChatHistory(sessionId, guestSessionId = null) {
  try {
    const params = guestSessionId ? `?guestSessionId=${guestSessionId}` : ''
    return await api.get(`/api/v1/chat/sessions/${sessionId}/messages${params}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil history pesan')
  }
}

export async function sendMessage(sessionId, content, guestSessionId = null) {
  try {
    const params = guestSessionId ? `?guestSessionId=${guestSessionId}` : ''
    return await api.post(`/api/v1/chat/sessions/${sessionId}/messages${params}`, {
      content,
      stream: false,
    })
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengirim pesan')
  }
}

/* =========================
   UPLOAD SOURCE (RAG)
========================= */
export async function uploadFile(file, userId) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    return await api.post('/api/v1/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Upload file gagal')
  }
}

export async function uploadURL(url, userId) {
  try {
    return await api.post('/api/v1/upload/url', { url, userId })
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Upload URL gagal')
  }
}

export async function uploadDrive(driveUrl, userId) {
  try {
    return await api.post('/api/v1/upload/drive', { driveUrl, userId })
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Upload Drive gagal')
  }
}

export async function uploadText(text, userId) {
  try {
    return await api.post('/api/v1/upload/text', { text, userId })
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Upload text gagal')
  }
}

export async function getSources(userId) {
  try {
    return await api.get(`/api/v1/sources/${userId}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal mengambil sources')
  }
}

export async function deleteSource(sourceId) {
  try {
    return await api.delete(`/api/v1/sources/${sourceId}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gagal menghapus source')
  }
}
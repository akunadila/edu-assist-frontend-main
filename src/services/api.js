import apiClient from './axiosInstance'
import { clearAuthState } from './authStorage'

function guestParams(guestSessionId) {
  return guestSessionId ? { params: { guestSessionId } } : undefined
}

/* =========================
   AUTH
========================= */
export function loginWithGoogle() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://edu-assist-be.onrender.com'
  window.location.href = `${BASE_URL}/api/v1/auth/google`
}

export async function getMe() {
  return await apiClient.get('/api/v1/auth/me')
}

export async function signOut() {
  try {
    await apiClient.post('/api/v1/auth/logout')
  } catch (error) {
    console.warn('Logout request failed:', error)
  } finally {
    clearAuthState()
  }
}

export async function logout() {
  await signOut()
  window.location.href = '/'
}

/* =========================
   CHAT SESSIONS
========================= */
export async function createChatSession(payload = {}) {
  try {
    const body = {
      title: payload.title || 'New Chat',
      linkedDocumentIds: payload.linkedDocumentIds || [],
      //studentProfile: payload.studentProfile || 
      /*{
        educationLevel: 'undergraduate',
        difficultyPreference: 'medium',
        favouriteSubjects: [],
        pace: 'medium',
        explanationStyle: 'concise',
      },*/
    }

    if (payload.guestSessionId) body.guestSessionId = payload.guestSessionId
    if (payload.initialContext) body.initialContext = payload.initialContext

    return await apiClient.post('/api/v1/chat/sessions', body)
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Gagal membuat sesi chat')
  }
}

export async function listChatSessions(guestSessionId = null) {
  try {
    return await apiClient.get('/api/v1/chat/sessions', guestParams(guestSessionId))
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Gagal mengambil sesi chat')
  }
}

export async function resumeChatSession(sessionId, guestSessionId = null) {
  try {
    return await apiClient.get(`/api/v1/chat/sessions/${sessionId}`, guestParams(guestSessionId))
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Gagal mengambil sesi chat')
  }
}

export async function getChatHistory(sessionId, guestSessionId = null) {
  try {
    return await apiClient.get(`/api/v1/chat/sessions/${sessionId}/messages`, guestParams(guestSessionId))
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Gagal mengambil history pesan')
  }
}

const DEFAULT_SEND_MESSAGE_TIMEOUT = 75_000

export async function sendMessage(sessionId, content = null, requestConfig = {}) {
  const { timeout = DEFAULT_SEND_MESSAGE_TIMEOUT, ...restConfig } = requestConfig

  try {

    console.log('SESSION ID:', sessionId)
    console.log('CONTENT:', content)

    return await apiClient.post(
      `/api/v1/chat/sessions/${sessionId}/messages`,
      { content, stream: false, attachmentIds: [], locale: "en-US" },
      { timeout, ...restConfig },
    )
  } catch (error) {
  console.log('STATUS:', error.response?.status)
  console.log('DATA:', error.response?.data)
  console.error(error)

  throw new Error(
    error.response?.data?.message ||
    error.response?.data?.error ||
    'Gagal mengirim pesan'
  )
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
    
    

    return await apiClient.post('/api/v1/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Upload file gagal')
  }
}

export async function uploadURL(url, userId) {
  try {
    return await apiClient.post('/api/v1/upload/url', { url, userId })
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Upload URL gagal')
  }
}

export async function uploadDrive(driveUrl, userId) {
  try {
    return await apiClient.post('/api/v1/upload/drive', { driveUrl, userId })
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Upload Drive gagal')
  }
}

export async function uploadText(text, userId) {
  try {
    return await apiClient.post('/api/v1/upload/text', { text, userId })
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Upload text gagal')
  }
}

export async function getSources(userId) {
  try {
    return await apiClient.get(`/api/v1/sources/${userId}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Gagal mengambil sources')
  }
}

export async function deleteSource(sourceId) {
  try {
    return await apiClient.delete(`/api/v1/sources/${sourceId}`)
  } catch (error) {
    throw new Error(error.response?.data?.message || error.response?.data?.error || 'Gagal menghapus source')
  }
}

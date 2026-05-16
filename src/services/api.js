
// src/services/api.js

import api from './axiosInstance'

/* =========================
   ONBOARDING
========================= */
export async function submitOnboarding(profileData) {
  try {
    return await api.post('/onboarding', profileData)
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Onboarding gagal'
    )
  }
}

/* =========================
   CHAT STREAM
========================= */
export async function sendMessageStream(
  payload,
  onChunk,
  onDone,
  onError
) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      throw new Error('Gagal connect ke server')
    }

    if (!response.body) {
      throw new Error('Response body tidak tersedia')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value)

      onChunk(chunk)
    }

    onDone()
  } catch (error) {
    onError(error.message)
  }
}

/* =========================
   UPLOAD FILE
========================= */
export async function uploadFile(file, userId) {
  try {
    const formData = new FormData()

    formData.append('file', file)
    formData.append('userId', userId)

    return await api.post(
      '/upload/file',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Upload file gagal'
    )
  }
}

/* =========================
   UPLOAD URL
========================= */
export async function uploadURL(url, userId) {
  try {
    return await api.post('/upload/url', {
      url,
      userId,
    })
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Upload URL gagal'
    )
  }
}

/* =========================
   UPLOAD DRIVE
========================= */
export async function uploadDrive(driveUrl, userId) {
  try {
    return await api.post('/upload/drive', {
      driveUrl,
      userId,
    })
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Upload Drive gagal'
    )
  }
}

/* =========================
   UPLOAD TEXT
========================= */
export async function uploadText(text, userId) {
  try {
    return await api.post('/upload/text', {
      text,
      userId,
    })
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Upload text gagal'
    )
  }
}

/* =========================
   GET SOURCES
========================= */
export async function getSources(userId) {
  try {
    return await api.get(`/sources/${userId}`)
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Gagal mengambil sources'
    )
  }
}

/* =========================
   DELETE SOURCE
========================= */
export async function deleteSource(sourceId) {
  try {
    return await api.delete(`/sources/${sourceId}`)
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      'Gagal menghapus source'
    )
  }
}
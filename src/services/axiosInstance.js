import axios from 'axios'
import { clearAuthState, getAccessToken, setAccessToken } from './authStorage'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

let refreshPromise = null

function shouldSkipRefresh(url = '') {
  return url.includes('/api/v1/auth/refresh')
}

async function rotateAccessToken() {
  if (!refreshPromise) {
    console.log('Initiating token refresh...')

    refreshPromise = apiClient
      .post('/api/v1/auth/refresh')
      .then((data) => {
        const nextAccessToken = data?.accessToken

        if (!nextAccessToken) {
          throw new Error('Refresh endpoint did not return an access token')
        }

        console.log('Token refresh successful. New Access Token:', nextAccessToken)
        setAccessToken(nextAccessToken)
        return nextAccessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const requestUrl = originalRequest?.url || ''

    if (status !== 401 || !originalRequest || shouldSkipRefresh(requestUrl)) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      clearAuthState()
      window.location.href = '/'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await rotateAccessToken()
      return apiClient(originalRequest)
    } catch (refreshError) {
      clearAuthState()
      window.location.href = '/'
      return Promise.reject(refreshError)
    }
  }
)

export default apiClient

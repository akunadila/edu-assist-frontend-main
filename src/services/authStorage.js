const ACCESS_TOKEN_KEY = 'accessToken'
const USER_PROFILE_KEY = 'userProfile'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function setUserProfile(profile) {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile))
}

export function clearAuthState() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
}
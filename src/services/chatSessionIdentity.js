const GUEST_SESSION_KEY = 'guestSessionId'
const LEGACY_SESSION_KEY = 'sessionId'
const CHAT_SESSION_PREFIX = 'eduAssistChatSession'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createFallbackUuid() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function createUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : createFallbackUuid()
}

export function isAuthenticatedUser() {
  const accessToken = localStorage.getItem('accessToken')
  return !!accessToken
}

export function getOrCreateGuestSessionId() {
  let guestSessionId = localStorage.getItem(GUEST_SESSION_KEY)

  if (!guestSessionId || !UUID_PATTERN.test(guestSessionId)) {
    guestSessionId = createUuid()
    localStorage.setItem(GUEST_SESSION_KEY, guestSessionId)
  }

  return guestSessionId
}

export function getGuestSessionIdForChatRequest() {
  return isAuthenticatedUser() ? null : getOrCreateGuestSessionId()
}

export function getChatSessionStorageKey(userProfile = {}) {
  if (isAuthenticatedUser()) {
    const userKey = userProfile.userId || userProfile.email || 'authenticated-user'
    return `${CHAT_SESSION_PREFIX}:user:${userKey}`
  }

  return `${CHAT_SESSION_PREFIX}:guest:${getOrCreateGuestSessionId()}`
}

export function clearLegacyChatSession() {
  sessionStorage.removeItem(LEGACY_SESSION_KEY)
}

export function clearGuestChatState() {
  const guestSessionId = localStorage.getItem(GUEST_SESSION_KEY)

  if (guestSessionId) {
    sessionStorage.removeItem(`${CHAT_SESSION_PREFIX}:guest:${guestSessionId}`)
  }

  localStorage.removeItem(GUEST_SESSION_KEY)
  clearLegacyChatSession()
}

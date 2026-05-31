import { useState, useRef, useEffect } from 'react'
import '../styles/chat.css'
import { sendMessage, createChatSession, uploadDocument, uploadURL, uploadDrive, uploadText, listChatSessions, getChatHistory, logout, getStudentProfile, updateStudentProfile } from '../services/api'
import {
  clearGuestChatState,
  getChatSessionStorageKey,
  getGuestSessionIdForChatRequest,
  getOrCreateGuestSessionId,
  isAuthenticatedUser,
} from '../services/chatSessionIdentity'
import { SiGoogledrive } from 'react-icons/si'

const SUGGESTIONS = [
  { emoji: '📚', label: 'Bantu belajar' },
  { emoji: '✏️', label: 'Rangkumin materi' },
  { emoji: '🧠', label: 'Latihan soal' },
  { emoji: '🔍', label: 'Jelaskan konsep' },
]

const SOURCE_TYPES = [
  { id: 'file', label: 'Upload File' },
  { id: 'drive', label: 'Google Drive' },
  { id: 'url', label: 'Website URL' },
  { id: 'text', label: 'Copied Text' },
]

function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMenu, setActiveMenu] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sources, setSources] = useState([])
  const [showAddSource, setShowAddSource] = useState(false)
  const [activeSourceType, setActiveSourceType] = useState('file')
  const [sourceInput, setSourceInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
  const [theme, setTheme] = useState('light')
  const [sessionsList, setSessionsList] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('eduAssistHistory')
    return saved ? JSON.parse(saved) : []
  })
  const [showEditPreferences, setShowEditPreferences] = useState(false)
  const [editProfile, setEditProfile] = useState({})
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [studentProfile, setStudentProfile] = useState(null)

  const [sourceDocumentIds, setSourceDocumentIds] = useState([])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const dragCounterRef = useRef(0)

  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
  const isNewChat = messages.length === 0
  const isLoggedIn = !!userProfile.nama

  const initials = userProfile.nama
    ? userProfile.nama.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const assistantInitials = 'EA'

  // Init guest/auth session
  useEffect(() => {
    if (isAuthenticatedUser()) {
      clearGuestChatState()
      return
    }
    getOrCreateGuestSessionId()
  }, [])

  // Load student profile dari backend
  useEffect(() => {
    async function loadStudentProfile() {
      if (!isAuthenticatedUser()) return
      try {
        const data = await getStudentProfile()
        setStudentProfile(data.profile)
      } catch (err) {
        console.log('Gagal load student profile:', err.message)
      }
    }
    loadStudentProfile()
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleGlobalDragEnter = (e) => {
      e.preventDefault()
      dragCounterRef.current += 1
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingGlobal(true)
      }
    }

    const handleGlobalDragOver = (e) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingGlobal(true)
      }
    }

    const handleGlobalDragLeave = (e) => {
      e.preventDefault()
      dragCounterRef.current -= 1
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0
        setIsDraggingGlobal(false)
      }
    }

    const handleGlobalDrop = async (e) => {
      e.preventDefault()
      setIsDraggingGlobal(false)
      dragCounterRef.current = 0
      const isInFileDropZone = e.target?.closest?.('.file-drop-zone')
      if (isInFileDropZone) return
      const file = e.dataTransfer?.files[0]
      if (!file) return
      await uploadSourceFile(file)
    }

    window.addEventListener('dragenter', handleGlobalDragEnter)
    window.addEventListener('dragover', handleGlobalDragOver)
    window.addEventListener('dragleave', handleGlobalDragLeave)
    window.addEventListener('drop', handleGlobalDrop)

    return () => {
      window.removeEventListener('dragenter', handleGlobalDragEnter)
      window.removeEventListener('dragover', handleGlobalDragOver)
      window.removeEventListener('dragleave', handleGlobalDragLeave)
      window.removeEventListener('drop', handleGlobalDrop)
    }
  }, [])

  // Load sessions list
  useEffect(() => {
    async function loadSessions() {
      try {
        const guestSessionId = getGuestSessionIdForChatRequest()
        const data = await listChatSessions(guestSessionId)
        setSessionsList(data.sessions || [])
      } catch (err) {
        console.log('Gagal load sessions:', err.message)
      }
    }
    loadSessions()
  }, [])

  // Restore last session
  useEffect(() => {
    async function restoreLastSession() {
      const sessionId = sessionStorage.getItem(getChatSessionStorageKey(userProfile))
      if (!sessionId) return
      try {
        const guestSessionId = getGuestSessionIdForChatRequest()
        const data = await getChatHistory(sessionId, guestSessionId)
        const formattedMessages = (data.messages || []).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))
        setMessages(formattedMessages)
      } catch (err) {
        console.log('Failed restore session:', err)
      }
    }
    restoreLastSession()
  }, [])

  function saveChatToHistory(currentMessages) {
    if (currentMessages.length < 2) return
    const title = currentMessages[0].content.slice(0, 30) + (currentMessages[0].content.length > 30 ? '...' : '')
    const newHistoryItem = {
      id: Date.now(),
      title,
      messages: currentMessages,
      timestamp: new Date().toLocaleString(),
    }
    const updatedHistory = [newHistoryItem, ...chatHistory.filter((h) => h.title !== title)]
    setChatHistory(updatedHistory)
    localStorage.setItem('eduAssistHistory', JSON.stringify(updatedHistory))
  }

  function handleOpenEditPreferences() {
    const profile = studentProfile || userProfile
    setEditProfile({
      educationLevel: profile.educationLevel || 'undergraduate',
      difficultyPreference: profile.difficultyPreference || 'medium',
      pace: profile.pace || 'medium',
      explanationStyle: profile.explanationStyle || 'concise',
      favouriteSubjects: profile.favouriteSubjects || [],
    })
    setShowEditPreferences(true)
  }

  async function handleSavePreferences() {
    setIsSavingProfile(true)
    try {
      const updated = await updateStudentProfile(editProfile)
      setStudentProfile(updated.profile)
      setShowEditPreferences(false)
    } catch (err) {
      alert('Gagal update profil: ' + err.message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    const sessionStorageKey = getChatSessionStorageKey(userProfile)
    let sessionId = sessionStorage.getItem(sessionStorageKey)
    const authenticated = isAuthenticatedUser()
    const guestSessionId = authenticated ? null : getOrCreateGuestSessionId()

    async function createSession() {
      let profile = studentProfile
      if (authenticated && !profile) {
        try {
          const data = await getStudentProfile()
          profile = data.profile
          setStudentProfile(data.profile)
        } catch {
          profile = null
        }
      }

      // Create chat session using only the documented fields.
      // Do NOT send `studentProfile` here — profile snapshot is managed
      // by the backend and stored as `profileSnapshot` when needed.
      const session = await createChatSession({
  title: input.trim().slice(0, 50),
  guestSessionId,
  linkedDocumentIds: sourceDocumentIds, 
})

      const newSessionId = session.conversationId || session.id || session.sessionId
      if (!newSessionId) throw new Error('Response sesi chat tidak valid')
      sessionStorage.setItem(sessionStorageKey, newSessionId)
      const data = await listChatSessions(guestSessionId)
      setSessionsList(data.sessions || [])
      return newSessionId
    }

    try {
      if (!sessionId) {
        sessionId = await createSession()
      }

      let result
      try {
        result = await sendMessage(sessionId, userMsg.content,
      {
      attachmentIds: sourceDocumentIds
    }
  )
    } catch (sendErr) {
        const invalidSession = String(sendErr.message || '').toLowerCase().includes('invalid chat session payload')
        if (invalidSession) {
          sessionStorage.removeItem(sessionStorageKey)
          sessionId = await createSession()
          result = await sendMessage(sessionId, userMsg.content)
        } else {
          throw sendErr
        }
      }

      const assistantMsg = {
        role: 'assistant',
        content: result.assistantMessage?.content || result.content || result.message || result.reply || 'Tidak ada response.',
      }
      setMessages((prev) => {
        const updated = [...prev, assistantMsg]
        saveChatToHistory(updated)
        return updated
      })
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSuggestion(label) {
    setInput(label)
    inputRef.current?.focus()
  }

  function handleOpenSourceOption(type) {
    if (type === 'file') {
      fileInputRef.current?.click()
      setShowAddSource(false)
      return
    }

    setActiveSourceType(type)
    setSourceInput('')
    setShowAddSource(true)
    setActiveMenu('chat')
  }

  function handleNewChat() {
    if (messages.length >= 2) saveChatToHistory(messages)
    setMessages([])
    setInput('')
    sessionStorage.removeItem(getChatSessionStorageKey(userProfile))
    setShowAddSource(false)
    setActiveMenu('chat')
  }

  async function loadHistory(session) {
    try {
      setIsLoadingHistory(true)
      const guestSessionId = getGuestSessionIdForChatRequest()
      if (session.id || session.conversationId) {
        const sessionId = session.id || session.conversationId
        const data = await getChatHistory(sessionId, guestSessionId)
        const formattedMessages = (data.messages || []).map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))
        setMessages(formattedMessages)
        sessionStorage.setItem(getChatSessionStorageKey(userProfile), sessionId)
      } else {
        setMessages(session.messages || [])
      }
      setActiveMenu('chat')
    } catch (err) {
      console.log('Gagal load history:', err.message)
      if (session.messages) {
        setMessages(session.messages)
        setActiveMenu('chat')
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }

  function addSource(source) {
    setSources((prev) => [...prev, source])
    setShowAddSource(false)
    setSourceInput('')
  }

  async function uploadSourceFile(file) {
    if (!file) return
    const tempId = Date.now()
    setSources((prev) => [...prev, { id: tempId, type: 'file', name: file.name, meta: 'Uploading...' }])
    setShowAddSource(false)
    try {
      const result = await uploadDocument(file)
      const documentId = result.document?.id
      setSources((prev) => prev.map((s) => s.id === tempId
        ? { ...s, documentId, meta: `${(file.size / 1024).toFixed(0)} KB` }
        : s
      ))
      if (documentId) {
        setSourceDocumentIds((prev) => [...prev, documentId])
      }
    } catch (err) {
      setSources((prev) => prev.filter((s) => s.id !== tempId))
      alert(`Upload gagal: ${err.message}`)
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    await uploadSourceFile(file)
  }

  async function handleAddSourceInput() {
    if (!sourceInput.trim()) return
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    const userId = profile.userId || 'guest'
    try {
      if (activeSourceType === 'drive') {
        await uploadDrive(sourceInput, userId)
        addSource({ id: Date.now(), type: 'drive', name: 'Google Drive', meta: sourceInput })
      } else if (activeSourceType === 'url') {
        await uploadURL(sourceInput, userId)
        addSource({ id: Date.now(), type: 'url', name: sourceInput, meta: 'Website' })
      } else if (activeSourceType === 'text') {
        await uploadText(sourceInput, userId)
        addSource({ id: Date.now(), type: 'text', name: sourceInput.slice(0, 40) + (sourceInput.length > 40 ? '...' : ''), meta: `${sourceInput.length} karakter` })
      }
    } catch (err) {
      alert(`Gagal tambah sumber: ${err.message}`)
    }
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    setIsDraggingGlobal(false)
    dragCounterRef.current = 0
    const file = e.dataTransfer.files[0]
    if (!file) return
    await uploadSourceFile(file)
  }

  function deleteSource(id) {
  const source = sources.find((s) => s.id === id)
  if (source?.documentId) {
    setSourceDocumentIds((prev) => prev.filter((d) => d !== source.documentId))
  }
  setSources((prev) => prev.filter((s) => s.id !== id))
}

  const displayProfile = studentProfile || userProfile

  return (
    <div className={`chat-root ${theme}`}>
      <div className={`global-drop-overlay ${isDraggingGlobal ? 'active' : ''}`}>
        <div className="global-drop-overlay-content">Drop file untuk upload</div>
      </div>

      {/* ===== SIDEBAR — UI dari teman ===== */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <img src="/icons/logo-eduassist.svg" alt="EduAssist" className="sidebar-logo-img" />
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        <button className="sidebar-new-chat" onClick={handleNewChat}>
          <svg width="20" height="20" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24.3924 2.71373C22.9427 1.26396 21.2886 0.567388 20.6981 1.15791L16.7051 5.15095L21.9552 10.4011L25.9483 6.40804C26.5388 5.81752 25.8422 4.16356 24.3924 2.71373Z" fill="#FF6E83"/>
            <path d="M21.8613 5.24484C20.2072 3.59072 18.3201 2.79602 17.6464 3.46975L13.5574 7.55877L19.5474 13.5488L23.6364 9.4598C24.3101 8.78606 23.5154 6.89896 21.8613 5.24484Z" fill="#BFBCAF"/>
            <path d="M6.09324 23.7293L2.49175 25.2957C2.22966 25.4098 1.92475 25.2897 1.81079 25.0276C1.78261 24.9624 1.76807 24.8922 1.76807 24.8212C1.76807 24.7502 1.78261 24.6799 1.81079 24.6148L3.37726 21.0133C3.83194 19.9679 5.04794 19.4891 6.09329 19.9438C7.13865 20.3985 7.61748 21.6145 7.1628 22.6598C6.94648 23.1571 6.55372 23.5279 6.09324 23.7293Z" fill="#2B2622"/>
            <path d="M21.2738 11.8103C21.2777 11.8048 21.2815 11.7993 21.2852 11.7937C21.8047 11.0492 21.0098 9.2572 19.4296 7.67702C17.8494 6.09678 16.0573 5.30191 15.3129 5.82145C15.3074 5.82511 15.3019 5.82885 15.2965 5.83268C15.2898 5.83764 15.2828 5.84233 15.2763 5.8475C15.2579 5.86164 15.24 5.87656 15.2232 5.89338L15.2147 5.90187H15.2146L5.7204 15.3962C5.7204 15.3962 3.03211 22.0487 4.04503 23.0616C5.05795 24.0745 11.7104 21.3862 11.7104 21.3862L21.2132 11.8835C21.23 11.8667 21.245 11.8487 21.2591 11.8303C21.2642 11.8238 21.2689 11.8169 21.2738 11.8103Z" fill="#FFD469"/>
            <path d="M5.7205 15.396L5.50945 16.7112C5.47839 16.9046 5.64593 17.0716 5.83926 17.0401L6.78178 16.8862C6.96793 16.8558 7.1323 17.01 7.11379 17.1977L7.00885 18.2616C6.99045 18.4484 7.15319 18.6023 7.3386 18.5735L8.29114 18.4257C8.48589 18.3955 8.65253 18.566 8.61783 18.76L8.45488 19.6714C8.42134 19.8591 8.57664 20.0268 8.76633 20.0076L9.83842 19.8995C10.0193 19.8813 10.1714 20.0336 10.1529 20.2144L10.0423 21.296C10.0233 21.4821 10.1845 21.6364 10.3696 21.6093L11.7339 21.4094L4.04523 24.6267C4.65859 24.0133 3.07044 22.4251 2.45703 23.0385L5.7205 15.396Z" fill="#E5AA6E"/>
          </svg>
          <span>New Chat</span>
        </button>

        <nav className="sidebar-nav">
          {[
            {
              id: 'chat', label: 'Chat',
              icon: (
                <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.92 0.500001C10.6736 0.5009 8.46958 1.11102 6.54252 2.26539C4.61546 3.41976 3.03755 5.07516 1.97683 7.05531C0.916103 9.03546 0.412275 11.2662 0.518995 13.51C0.625715 15.7539 1.33899 17.9267 2.58286 19.7973L0.5 25.34L7.47564 24.0806C9.15506 24.9007 10.9979 25.3311 12.8668 25.3399C14.7357 25.3486 16.5825 24.9355 18.2695 24.1313C19.9566 23.3271 21.4403 22.1525 22.6103 20.6951C23.7803 19.2377 24.6063 17.5351 25.0267 15.7141C25.4472 13.893 25.4512 12.0006 25.0386 10.1778C24.6259 8.35502 23.8073 6.64885 22.6435 5.18644C21.4798 3.72404 20.0011 2.54312 18.3175 1.73169C16.6339 0.920257 14.7889 0.499236 12.92 0.500001Z" fill="#D7E0FF" stroke="#4147D5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.9278 13.4023C12.7999 13.4023 12.6773 13.3515 12.5869 13.2611C12.4965 13.1706 12.4457 13.048 12.4457 12.9201C12.4457 12.7923 12.4965 12.6696 12.5869 12.5792C12.6773 12.4888 12.7999 12.438 12.9278 12.438M12.9278 13.4023C13.0557 13.4023 13.1783 13.3515 13.2687 13.2611C13.3592 13.1706 13.4099 13.048 13.4099 12.9201C13.4099 12.7923 13.3592 12.6696 13.2687 12.5792C13.1783 12.4888 13.0557 12.438 12.9278 12.438M7.62423 13.4023C7.49636 13.4023 7.37373 13.3515 7.28331 13.2611C7.19289 13.1706 7.14209 13.048 7.14209 12.9201C7.14209 12.7923 7.19289 12.6696 7.28331 12.5792C7.37373 12.4888 7.49636 12.438 7.62423 12.438M7.62423 13.4023C7.7521 13.4023 7.87474 13.3515 7.96516 13.2611C8.05558 13.1706 8.10638 13.048 8.10638 12.9201C8.10638 12.7923 8.05558 12.6696 7.96516 12.5792C7.87474 12.4888 7.7521 12.438 7.62423 12.438M18.2314 13.4023C18.1035 13.4023 17.9809 13.3515 17.8904 13.2611C17.8 13.1706 17.7492 13.048 17.7492 12.9201C17.7492 12.7923 17.8 12.6696 17.8904 12.5792C17.9809 12.4888 18.1035 12.438 18.2314 12.438M18.2314 13.4023C18.3592 13.4023 18.4819 13.3515 18.5723 13.2611C18.6627 13.1706 18.7135 13.048 18.7135 12.9201C18.7135 12.7923 18.6627 12.6696 18.5723 12.5792C18.4819 12.4888 18.3592 12.438 18.2314 12.438" stroke="#4147D5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
            },
            {
              id: 'history', label: 'History',
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.74689 1.14704C7.82954 0.284348 10.1696 0.28432 12.2523 1.14696C14.3349 2.0096 15.9896 3.66425 16.8523 5.74689C17.715 7.82954 17.715 10.1696 16.8524 12.2523C15.9897 14.3349 14.3351 15.9896 12.2524 16.8523C10.1698 17.715 7.82975 17.715 5.74708 16.8524C3.66441 15.9897 2.00973 14.3351 1.14704 12.2524C0.284348 10.1698 0.28432 7.82975 1.14696 5.74708C2.0096 3.66441 3.66425 2.00973 5.74689 1.14704Z" fill="#F2F2F2" stroke="#BDBDBD" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.019 6.00056C12.1097 5.87931 12.149 5.72714 12.1282 5.57713C12.1074 5.42711 12.0282 5.29135 11.9079 5.19934C11.7876 5.10733 11.6359 5.06649 11.4857 5.0857C11.3355 5.10491 11.1989 5.18262 11.1056 5.30194L12.019 6.00056ZM9.24231 7.73706C9.15157 7.85832 9.11233 8.01048 9.13312 8.1605C9.15391 8.31052 9.23305 8.44628 9.35335 8.53829C9.47364 8.6303 9.62538 8.67114 9.77561 8.65193C9.92584 8.63272 10.0624 8.55501 10.1557 8.43569L9.24231 7.73706ZM14.0464 12.5314C14.179 12.6069 14.3361 12.6266 14.4832 12.5862C14.6303 12.5458 14.7553 12.4486 14.8307 12.3161C14.9062 12.1835 14.9259 12.0264 14.8855 11.8793C14.8451 11.7322 14.748 11.6072 14.6154 11.5318L14.0464 12.5314ZM10.2848 9.0679C10.2191 9.03056 10.1468 9.00652 10.0719 8.99714C9.99694 8.98776 9.92089 8.99323 9.84808 9.01324C9.77526 9.03325 9.7071 9.0674 9.64749 9.11375C9.58787 9.16011 9.53797 9.21775 9.50063 9.28338C9.46329 9.34902 9.43924 9.42137 9.42986 9.4963C9.42048 9.57123 9.42595 9.64727 9.44596 9.72009C9.46597 9.7929 9.50013 9.86107 9.54648 9.92068C9.59283 9.9803 9.65047 10.0302 9.71611 10.0675L10.2848 9.0679ZM8.42466 8.99976C8.42466 8.84726 8.48524 8.70101 8.59307 8.59318C8.7009 8.48534 8.84716 8.42476 8.99966 8.42476V7.27476C8.54216 7.27476 8.1034 7.4565 7.7799 7.78C7.4564 8.1035 7.27466 8.54227 7.27466 8.99976H8.42466ZM8.99966 9.57476C8.84716 9.57476 8.7009 9.51418 8.59307 9.40635C8.48524 9.29852 8.42466 9.15226 8.42466 8.99976H7.27466C7.27466 9.45726 7.4564 9.89602 7.7799 10.2195C8.1034 10.543 8.54216 10.7248 8.99966 10.7248V9.57476ZM9.57466 8.99976C9.57466 9.15226 9.51408 9.29852 9.40624 9.40635C9.29841 9.51418 9.15216 9.57476 8.99966 9.57476V10.7248C9.45716 10.7248 9.89592 10.543 10.2194 10.2195C10.5429 9.89602 10.7247 9.45726 10.7247 8.99976H9.57466ZM8.99966 8.42476C9.15216 8.42476 9.29841 8.48534 9.40624 8.59318C9.51408 8.70101 9.57466 8.84726 9.57466 8.99976H10.7247C10.7247 8.54227 10.5429 8.1035 10.2194 7.78C9.89592 7.4565 9.45716 7.27476 8.99966 7.27476V8.42476ZM11.1056 5.30194L9.24202 7.73706L10.1557 8.43569L12.019 6.00056L11.1056 5.30194ZM14.6154 11.5318L10.2842 9.0679L9.71553 10.0675L14.0464 12.5314L14.6154 11.5318Z" fill="#EB5757"/>
                </svg>
              ),
            },
            {
              id: 'settings', label: 'Settings',
              icon: (
                <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.2" d="M21 12.25C21 13.9806 20.4868 15.6723 19.5254 17.1112C18.5639 18.5502 17.1973 19.6717 15.5985 20.3339C13.9996 20.9962 12.2403 21.1695 10.543 20.8319C8.84563 20.4943 7.28653 19.6609 6.06282 18.4372C4.83911 17.2135 4.00575 15.6544 3.66813 13.957C3.33051 12.2597 3.50379 10.5004 4.16606 8.90152C4.82832 7.30267 5.94983 5.9361 7.38876 4.97464C8.82769 4.01318 10.5194 3.5 12.25 3.5C14.5706 3.5 16.7962 4.42187 18.4372 6.06282C20.0781 7.70376 21 9.92936 21 12.25Z" fill="#BDBDBD"/>
                  <path d="M23.625 11.375H21.8345C21.7361 10.2812 21.4497 9.21265 20.988 8.21625L22.5389 7.32047C22.7399 7.20444 22.8866 7.0133 22.9467 6.78911C23.0068 6.56491 22.9754 6.32603 22.8594 6.125C22.7433 5.92397 22.5522 5.77728 22.328 5.71718C22.1038 5.65708 21.8649 5.6885 21.6639 5.80453L20.1108 6.70141C19.4763 5.80554 18.6945 5.02374 17.7986 4.38922L18.6955 2.83609C18.8115 2.63507 18.8429 2.39618 18.7828 2.17199C18.7227 1.94779 18.576 1.75666 18.375 1.64062C18.174 1.52459 17.9351 1.49317 17.7109 1.55327C17.4867 1.61337 17.2956 1.76007 17.1795 1.96109L16.2838 3.51203C15.2874 3.0503 14.2188 2.76391 13.125 2.66547V0.875C13.125 0.642936 13.0328 0.420376 12.8687 0.256282C12.7046 0.0921872 12.4821 0 12.25 0C12.0179 0 11.7954 0.0921872 11.6313 0.256282C11.4672 0.420376 11.375 0.642936 11.375 0.875V2.66547C10.2812 2.76391 9.21265 3.0503 8.21625 3.51203L7.32047 1.96109C7.20444 1.76007 7.0133 1.61337 6.78911 1.55327C6.56491 1.49317 6.32603 1.52459 6.125 1.64062C5.92397 1.75666 5.77728 1.94779 5.71718 2.17199C5.65708 2.39618 5.6885 2.63507 5.80453 2.83609L6.70141 4.38922C5.80554 5.02374 5.02374 5.80554 4.38922 6.70141L2.83609 5.80453C2.63507 5.6885 2.39618 5.65708 2.17199 5.71718C1.94779 5.77728 1.75666 5.92397 1.64062 6.125C1.52459 6.32603 1.49317 6.56491 1.55327 6.78911C1.61337 7.0133 1.76007 7.20444 1.96109 7.32047L3.51203 8.21625C3.0503 9.21265 2.76391 10.2812 2.66547 11.375H0.875C0.642936 11.375 0.420376 11.4672 0.256282 11.6313C0.0921872 11.7954 0 12.0179 0 12.25C0 12.4821 0.0921872 12.7046 0.256282 12.8687C0.420376 13.0328 0.642936 13.125 0.875 13.125H2.66547C2.76391 14.2188 3.0503 15.2874 3.51203 16.2838L1.96109 17.1795C1.76007 17.2956 1.61337 17.4867 1.55327 17.7109C1.49317 17.9351 1.52459 18.174 1.64062 18.375C1.75666 18.576 1.94779 18.7227 2.17199 18.7828C2.39618 18.8429 2.63507 18.8115 2.83609 18.6955L4.38922 17.7986C5.02374 18.6945 5.80554 19.4763 6.70141 20.1108L5.80453 21.6639C5.6885 21.8649 5.65708 22.1038 5.71718 22.328C5.77728 22.5522 5.92397 22.7433 6.125 22.8594C6.32603 22.9754 6.56491 23.0068 6.78911 22.9467C7.0133 22.8866 7.20444 22.7399 7.32047 22.5389L8.21625 20.988C9.21265 21.4497 10.2812 21.7361 11.375 21.8345V23.625C11.375 23.8571 11.4672 24.0796 11.6313 24.2437C11.7954 24.4078 12.0179 24.5 12.25 24.5C12.4821 24.5 12.7046 24.4078 12.8687 24.2437C13.0328 24.0796 13.125 23.8571 13.125 23.625V21.8345C14.2188 21.7361 15.2874 21.4497 16.2838 20.988L17.1795 22.5389C17.2956 22.7399 17.4867 22.8866 17.7109 22.9467C17.9351 23.0068 18.174 22.9754 18.375 22.8594C18.576 22.7433 18.7227 22.5522 18.7828 22.328C18.8429 22.1038 18.8115 21.8649 18.6955 21.6639L17.7986 20.1108C18.6945 19.4763 19.4763 18.6945 20.1108 17.7986L21.6639 18.6955C21.8649 18.8115 22.1038 18.8429 22.328 18.7828C22.5522 18.7227 22.7433 18.576 22.8594 18.375C22.9754 18.174 23.0068 17.9351 22.9467 17.7109C22.8866 17.4867 22.7399 17.2956 22.5389 17.1795L20.9891 16.2838C21.4504 15.2873 21.7364 14.2187 21.8345 13.125H23.625C23.8571 13.125 24.0796 13.0328 24.2437 12.8687C24.4078 12.7046 24.5 12.4821 24.5 12.25C24.5 12.0179 24.4078 11.7954 24.2437 11.6313C24.0796 11.4672 23.8571 11.375 23.625 11.375Z" fill="#BDBDBD"/>
                </svg>
              ),
            },
          ].map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-recent">
          <p className="sidebar-recent-label">RECENT</p>
          {sessionsList.length > 0 ? (
            sessionsList.slice(0, 5).map((session) => (
              <button key={session.id || session.conversationId} className="sidebar-recent-item" onClick={() => loadHistory(session)}>
                {session.title || 'Percakapan'}
              </button>
            ))
          ) : chatHistory.length > 0 ? (
            chatHistory.slice(0, 5).map((item) => (
              <button key={item.id} className="sidebar-recent-item" onClick={() => loadHistory(item)}>
                {item.title}
              </button>
            ))
          ) : (
            <p className="sidebar-recent-empty">Belum ada percakapan</p>
          )}
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar-circle">
            {isLoggedIn ? initials : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>
          {sidebarOpen && (
            isLoggedIn ? (
              <div className="profile-text">
                <span className="profile-name">{userProfile.nama}</span>
                <span className="profile-email">{userProfile.email || ''}</span>
              </div>
            ) : (
              <div className="profile-text">
                <span className="profile-name">Sign In</span>
              </div>
            )
          )}
        </div>
      </aside>

      {/* ===== SOURCES PANEL — UI dari teman ===== */}
      {activeMenu === 'chat' && (
        <div className="sources-panel">
          <h2 className="sources-title">Sources</h2>
          <button className="add-source-btn" onClick={() => setShowAddSource(!showAddSource)}>
            + Tambah Sumber
          </button>
          {showAddSource && (
            <div className="add-source-form">
              <div className="source-type-tabs">
                {SOURCE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={`source-type-tab ${activeSourceType === t.id ? 'active' : ''}`}
                    onClick={() => setActiveSourceType(t.id)}
                    title={t.label}
                  >
                    {t.id === 'file' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    )}
                    {t.id === 'drive' && <SiGoogledrive size={16} />}
                    {t.id === 'url' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    )}
                    {t.id === 'text' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                  </button>
                ))}
              </div>
              {activeSourceType === 'file' && (
                <div
                  className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p className="file-drop-text">Drop file atau klik untuk upload</p>
                  <p className="file-drop-meta">PDF, DOCX, TXT</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              )}
              {activeSourceType !== 'file' && (
                <div className="source-input-group">
                  <input
                    className="source-text-input"
                    placeholder={
                      activeSourceType === 'drive' ? 'Paste URL drive....' :
                      activeSourceType === 'url' ? 'Paste URL website....' :
                      'Paste teks di sini....'
                    }
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                  />
                  <button className="source-submit-btn" onClick={handleAddSourceInput}>Tambah</button>
                </div>
              )}
            </div>
          )}
          {sources.length === 0 ? (
            <div className="sources-empty">
              <div className="sources-empty-folder">
                <img src="/icons/folder.svg" alt="Folder" width="48" height="48" />
              </div>
              <p className="sources-empty-text">Belum ada sumber</p>
              <p className="sources-empty-sub">Tambah file, link, atau teks.</p>
            </div>
          ) : (
            <div className="sources-list">
              {sources.map((source) => (
                <div key={source.id} className="source-card">
                  <div className="source-card-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="source-card-info">
                    <p className="source-card-name">{source.name}</p>
                    <p className="source-card-meta">{source.meta}</p>
                  </div>
                  <button className="source-card-delete" onClick={() => deleteSource(source.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="chat-main">

        {/* HISTORY */}
        {activeMenu === 'history' && (
          <div className="panel-content">
            <div className="panel-header">
              <h2 className="panel-title">Riwayat Percakapan</h2>
              <p className="panel-sub">Klik percakapan untuk melanjutkan</p>
            </div>
            <div className="history-list">
              {isLoadingHistory ? (
                <div className="sources-empty"><p className="sources-empty-text">Memuat riwayat...</p></div>
              ) : sessionsList.length > 0 ? (
                sessionsList.map((session) => (
                  <div key={session.id || session.conversationId} className="history-item" onClick={() => loadHistory(session)}>
                    <div className="history-item-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="history-item-info">
                      <p className="history-item-title">{session.title || 'Percakapan'}</p>
                      <p className="history-item-date">{session.createdAt ? new Date(session.createdAt).toLocaleString() : ''}</p>
                    </div>
                    <span className="history-item-arrow">→</span>
                  </div>
                ))
              ) : chatHistory.length > 0 ? (
                chatHistory.map((h) => (
                  <div key={h.id} className="history-item" onClick={() => loadHistory(h)}>
                    <div className="history-item-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="history-item-info">
                      <p className="history-item-title">{h.title}</p>
                      <p className="history-item-date">{h.timestamp}</p>
                    </div>
                    <span className="history-item-arrow">→</span>
                  </div>
                ))
              ) : (
                <div className="sources-empty">
                  <p className="sources-empty-text">Belum ada riwayat</p>
                  <p className="sources-empty-sub">Mulai chat untuk menyimpan riwayat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeMenu === 'settings' && (
          <div className="panel-content">
            <div className="panel-header">
              <h2 className="panel-title">Pengaturan</h2>
              <p className="panel-sub">Kelola profil dan tampilan aplikasi</p>
            </div>

            <div className="settings-section">
              <h3 className="settings-section-title">Profil</h3>
              <div className="settings-profile-card">
                <div className="settings-avatar-placeholder">{initials}</div>
                <div className="settings-profile-info">
                  <p className="settings-profile-name">{userProfile.nama || 'User'}</p>
                  <p className="settings-profile-email">{userProfile.email || 'email@gmail.com'}</p>
                  <span className="settings-profile-badge">Dari Google Account</span>
                </div>
              </div>
            </div>

            {/* Learning Preferences — dari branch kamu */}
            <div className="settings-section">
              <h3 className="settings-section-title">Learning Preferences</h3>
              <div className="settings-learn-card">
                <div className="settings-learn-item">
                  <span className="learn-label">Education Level</span>
                  <span className="learn-value">{displayProfile.educationLevel || '-'}</span>
                </div>
                <div className="settings-learn-item">
                  <span className="learn-label">Difficulty</span>
                  <span className="learn-value">{displayProfile.difficultyPreference || '-'}</span>
                </div>
                <div className="settings-learn-item">
                  <span className="learn-label">Pace</span>
                  <span className="learn-value">{displayProfile.pace || '-'}</span>
                </div>
                <div className="settings-learn-item">
                  <span className="learn-label">Explanation Style</span>
                  <span className="learn-value">{displayProfile.explanationStyle || '-'}</span>
                </div>
                <div className="settings-learn-item">
                  <span className="learn-label">Favourite Subjects</span>
                  <span className="learn-value">
                    {displayProfile.favouriteSubjects?.length > 0 ? displayProfile.favouriteSubjects.join(', ') : '-'}
                  </span>
                </div>
                <button className="settings-edit-btn" onClick={handleOpenEditPreferences}>
                   Edit Learning Preferences
                </button>
              </div>
            </div>


            <div className="settings-section">
              <h3 className="settings-section-title">Akun</h3>
              <button className="settings-logout-btn" onClick={logout}>
                Log out
              </button>
            </div>
          </div>
        )}

        {/* MODAL EDIT PREFERENCES — dari branch kamu */}
        {showEditPreferences && (
          <div className="modal-overlay" onClick={() => setShowEditPreferences(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Learning Preferences</h2>
              <div className="modal-field">
                <label className="modal-label">Education Level</label>
                <select className="modal-select" value={editProfile.educationLevel}
                  onChange={(e) => setEditProfile({ ...editProfile, educationLevel: e.target.value })}>
                  <option value="high_school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Difficulty Preference</label>
                <select className="modal-select" value={editProfile.difficultyPreference}
                  onChange={(e) => setEditProfile({ ...editProfile, difficultyPreference: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="adaptive">Adaptive</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Learning Pace</label>
                <select className="modal-select" value={editProfile.pace}
                  onChange={(e) => setEditProfile({ ...editProfile, pace: e.target.value })}>
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Explanation Style</label>
                <select className="modal-select" value={editProfile.explanationStyle}
                  onChange={(e) => setEditProfile({ ...editProfile, explanationStyle: e.target.value })}>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="step_by_step">Step by Step</option>
                  <option value="analogy">Analogy</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Favourite Subjects</label>
                <input
                  type="text"
                  className="modal-select"
                  value={(editProfile.favouriteSubjects || []).join(', ')}
                  placeholder="e.g. Math, Physics, Biology"
                  onChange={(e) => setEditProfile({
                    ...editProfile,
                    favouriteSubjects: e.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })}
                />
              </div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowEditPreferences(false)}>Cancel</button>
                <button className="modal-save" onClick={handleSavePreferences} disabled={isSavingProfile}>
                  {isSavingProfile ? 'Menyimpan...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT */}
        {activeMenu === 'chat' && (
          <>
            {isNewChat ? (
              <div className="chat-landing">
                <h1 className="chat-landing-title">
                  Halo, <span className="chat-landing-accent">{userProfile.nama || 'Pelajar'}</span>
                </h1>
                <p className="chat-landing-sub">Ada yang bisa EduAssist bantu hari ini?</p>
                <div className="chat-input-wrapper landing">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder="Tanya apa saja...."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                  />
                  <div className="chat-input-actions">
                    <button type="button" className="chat-action-plus" onClick={() => setShowAddSource((prev) => !prev)} aria-label="Tambah sumber">
                      +
                    </button>
                    <div className="chat-action-right">
                      <button className="chat-action-model">Model <span>▾</span></button>
                      <button className="chat-action-mic">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                      </button>
                      <button
                        className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                    </div>
                  </div>
                  {showAddSource && (
                    <div className="chat-source-menu">
                      {SOURCE_TYPES.map((type) => (
                        <button key={type.id} type="button" className="chat-source-option" onClick={() => handleOpenSourceOption(type.id)}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((item) => (
                    <button key={item.label} className="suggestion-chip" onClick={() => handleSuggestion(item.label)}>
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="chat-messages">
                  {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble-row ${msg.role}`}>
                      {msg.role === 'assistant' && <div className="assistant-avatar">{assistantInitials}</div>}
                      <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="chat-bubble-row assistant">
                      <div className="chat-bubble assistant loading">
                        <span className="dot"/><span className="dot"/><span className="dot"/>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-bar">
                  <div className="chat-input-wrapper">
                    <textarea
                      ref={inputRef}
                      className="chat-input"
                      placeholder="Tanya apa saja...."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <div className="chat-input-actions">
                      <button type="button" className="chat-action-plus" onClick={() => setShowAddSource((prev) => !prev)} aria-label="Tambah sumber">
                        +
                      </button>
                      <div className="chat-action-right">
                        <button className="chat-action-model">Model <span>▾</span></button>
                        <button className="chat-action-mic">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        </button>
                        <button
                          className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                          onClick={handleSend}
                          disabled={!input.trim() || isLoading}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  {showAddSource && (
                    <div className="chat-source-menu">
                      {SOURCE_TYPES.map((type) => (
                        <button key={type.id} type="button" className="chat-source-option" onClick={() => handleOpenSourceOption(type.id)}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ChatPage
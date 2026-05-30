import { useState, useRef, useEffect } from 'react'
import '../styles/chat.css'
import { sendMessage, createChatSession, uploadFile, uploadURL, uploadDrive, uploadText, listChatSessions, getChatHistory, logout } from '../services/api'
import {
  clearGuestChatState,
  getChatSessionStorageKey,
  getGuestSessionIdForChatRequest,
  getOrCreateGuestSessionId,
  isAuthenticatedUser,
} from '../services/chatSessionIdentity'
import {
  BookOpen,
  FileText,
  Brain,
  Search,
  MessageCircle,
  FolderKanban,
  History,
  Settings,
  Globe,
  ClipboardList,
} from 'lucide-react'

import { SiGoogledrive } from 'react-icons/si'

const SUGGESTIONS = [
  { icon: <BookOpen size={18} />, label: 'Bantu belajar' },
  { icon: <FileText size={18} />, label: 'Rangkumin materi' },
  { icon: <Brain size={18} />, label: 'Latihan soal' },
  { icon: <Search size={18} />, label: 'Jelaskan konsep' },
]

const SOURCE_TYPES = [
  { id: 'file', icon: <FileText size={18} />, label: 'Upload File', desc: 'PDF, DOCX, TXT' },

  {
    id: 'drive',
    icon: <SiGoogledrive size={18} />,
    label: 'Google Drive',
    desc: 'Paste link Drive',
  },

  { id: 'url', icon: <Globe size={18} />, label: 'Website URL', desc: 'Paste link website' },

  { id: 'text', icon: <ClipboardList size={18} />, label: 'Copied Text', desc: 'Paste teks langsung' },
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
  const [theme, setTheme] = useState('light')
  const [sessionsList, setSessionsList] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('eduAssistHistory')
    return saved ? JSON.parse(saved) : []
  })

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isAuthenticatedUser()) {
      clearGuestChatState()
      return
    }

    getOrCreateGuestSessionId()
  }, [])
  
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
  const isNewChat = messages.length === 0

  const initials = userProfile.nama
    ? userProfile.nama.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMsg = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const sessionStorageKey = getChatSessionStorageKey(userProfile)
      let sessionId = sessionStorage.getItem(sessionStorageKey)
      
      const authenticated = isAuthenticatedUser()

      const guestSessionId = authenticated ? null : getOrCreateGuestSessionId()

      console.log('Authenticated user ID:', userProfile.userId)
      console.log('Guest Session ID for Chat Request:', guestSessionId)

      if (!sessionId) {
        const session = await createChatSession({
          title: input.trim().slice(0, 50),
          guestSessionId,
          studentProfile: {
            educationLevel: userProfile.levelPendidikan || 'undergraduate',
            difficultyPreference: 'medium',
            favouriteSubjects: [],
            pace: 'medium',        // ← fix dari 'normal' ke 'medium'
            explanationStyle: userProfile.preferensiTone || 'concise',
          },
        })
        sessionId = session.conversationId
        sessionStorage.setItem(sessionStorageKey, sessionId)

        const data = await listChatSessions(guestSessionId)
        setSessionsList(data.sessions || [])
      }

      const result = await sendMessage(sessionId, userMsg.content)

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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: ` Error: ${err.message}` },
      ])
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

  function handleNewChat() {
    if (messages.length >= 2) saveChatToHistory(messages)
    setMessages([])
    setInput('')
    sessionStorage.removeItem(getChatSessionStorageKey(userProfile))
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

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    const tempId = Date.now()
    setSources((prev) => [...prev, { id: tempId, type: 'file', icon: '📄', name: file.name, meta: 'Uploading...' }])
    setShowAddSource(false)
    try {
      await uploadFile(file, profile.userId || 'guest')
      setSources((prev) => prev.map((s) => s.id === tempId ? { ...s, meta: `${(file.size / 1024).toFixed(1)} KB` } : s))
    } catch (err) {
      setSources((prev) => prev.filter((s) => s.id !== tempId))
      alert(`Upload gagal: ${err.message}`)
    }
  }

  async function handleAddSourceInput() {
    if (!sourceInput.trim()) return
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    const userId = profile.userId || 'guest'
    try {
      if (activeSourceType === 'drive') {
        await uploadDrive(sourceInput, userId)
        addSource({ id: Date.now(), type: 'drive', icon: '📁', name: 'Google Drive', meta: sourceInput })
      } else if (activeSourceType === 'url') {
        await uploadURL(sourceInput, userId)
        addSource({ id: Date.now(), type: 'url', icon: '🌐', name: sourceInput, meta: 'Website' })
      } else if (activeSourceType === 'text') {
        await uploadText(sourceInput, userId)
        addSource({ id: Date.now(), type: 'text', icon: '📋', name: sourceInput.slice(0, 40) + (sourceInput.length > 40 ? '...' : ''), meta: `${sourceInput.length} karakter` })
      }
    } catch (err) {
      alert(`Gagal tambah sumber: ${err.message}`)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const tempId = Date.now()
    setSources((prev) => [...prev, { id: tempId, type: 'file', icon: '📄', name: file.name, meta: 'Uploading...' }])
    setShowAddSource(false)
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    uploadFile(file, profile.userId || 'guest')
      .then(() => setSources((prev) => prev.map((s) => s.id === tempId ? { ...s, meta: `${(file.size / 1024).toFixed(1)} KB` } : s)))
      .catch((err) => { setSources((prev) => prev.filter((s) => s.id !== tempId)); alert(`Upload gagal: ${err.message}`) })
  }

  function deleteSource(id) {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className={`chat-root ${theme}`}>
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
  <img
    src="/icons/image1.png"
    alt="EduAssist"
    className="sidebar-full-logo"
  />
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
        </div>
        <button className="sidebar-new-chat" onClick={handleNewChat}>
          <span>✏️</span>
          <span>New Chat</span>
        </button>
        <nav className="sidebar-nav">
        {[
  { 
    id: 'chat', 
    icon: <MessageCircle size={18} />, 
    label: 'Chat' 
  },


  { 
    id: 'history', 
    icon: <History size={18}  />, 
    label: 'History' 
  },

  { 
    id: 'settings', 
    icon: <Settings size={18} color="#d1d5db" />, 
    label: 'Settings' 
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
        <div className="sidebar-history">
          <p className="sidebar-history-title">Recent</p>
          {sessionsList.length > 0 ? (
            sessionsList.slice(0, 5).map((session) => (
              <button
                key={session.id || session.conversationId}
                className="sidebar-history-item"
                onClick={() => loadHistory(session)}
              >
                <span>💬</span>
                <span>{session.title || 'Percakapan'}</span>
              </button>
            ))
          ) : chatHistory.length > 0 ? (
            chatHistory.map((item) => (
              <button key={item.id} className="sidebar-history-item" onClick={() => loadHistory(item)}>
                <span>💬</span>
                <span>{item.title}</span>
              </button>
            ))
          ) : (
            <p className="sidebar-history-empty">Belum ada percakapan</p>
          )}
        </div>
        <div className="sidebar-profile">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <p className="profile-name">{userProfile.nama || 'User'}</p>
            <p className="profile-meta">{userProfile.levelPendidikan} · {userProfile.preferensiTone}</p>
          </div>
        </div>
      </aside>

      {activeMenu === 'chat' && (
        <div className="sources-panel">
          <div className="sources-header">
            <h2 className="sources-title">Sources</h2>
            <span className="sources-count">{sources.length}</span>
          </div>
          <button className="add-source-btn" onClick={() => setShowAddSource(!showAddSource)}>
            <span>+</span>
            <span>Tambah Sumber</span>
          </button>
          {showAddSource && (
            <div className="add-source-form">
              <div className="source-type-tabs">
                {SOURCE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    className={`source-type-tab ${activeSourceType === t.id ? 'active' : ''}`}
                    onClick={() => setActiveSourceType(t.id)}
                  >
                    {t.icon}
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
                  <span className="file-drop-icon">📄</span>
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
                      activeSourceType === 'drive' ? 'Paste link Google Drive...' :
                      activeSourceType === 'url' ? 'Paste URL website...' :
                      'Paste teks di sini...'
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
              <p className="sources-empty-icon">📂</p>
              <p className="sources-empty-text">Belum ada sumber</p>
              <p className="sources-empty-sub">Tambah file, link, atau teks sebagai konteks RAG</p>
            </div>
          ) : (
            <div className="sources-grid">
              {sources.map((source) => (
                <div key={source.id} className="source-card">
                  <div className="source-card-icon">{source.icon}</div>
                  <div className="source-card-info">
                    <p className="source-card-name">{source.name}</p>
                    <p className="source-card-meta">{source.meta}</p>
                  </div>
                  <button className="source-card-delete" onClick={() => deleteSource(source.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <main className="chat-main">
        {activeMenu === 'history' && (
          <div className="panel-content">
            <div className="panel-header">
              <h2 className="panel-title">🕘 Riwayat Percakapan</h2>
              <p className="panel-sub">Klik percakapan untuk melanjutkan</p>
            </div>
            <div className="history-list">
              {isLoadingHistory ? (
                <div className="sources-empty">
                  <p className="sources-empty-icon">⏳</p>
                  <p className="sources-empty-text">Memuat riwayat...</p>
                </div>
              ) : sessionsList.length > 0 ? (
                sessionsList.map((session) => (
                  <div key={session.id || session.conversationId} className="history-item" onClick={() => loadHistory(session)}>
                    <div className="history-item-icon">💬</div>
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
                    <div className="history-item-icon">💬</div>
                    <div className="history-item-info">
                      <p className="history-item-title">{h.title}</p>
                      <p className="history-item-date">{h.timestamp}</p>
                    </div>
                    <span className="history-item-arrow">→</span>
                  </div>
                ))
              ) : (
                <div className="sources-empty">
                  <p className="sources-empty-icon">🕘</p>
                  <p className="sources-empty-text">Belum ada riwayat</p>
                  <p className="sources-empty-sub">Mulai chat untuk menyimpan riwayat</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMenu === 'settings' && (
          <div className="panel-content">
            <div className="panel-header">
              <h2 className="panel-title">⚙️Pengaturan</h2>
              <p className="panel-sub">Kelola profil dan tampilan aplikasi</p>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">Profil</h3>
              <div className="settings-profile-card">
                <div className="settings-avatar">
                  {userProfile.foto ? (
                    <img src={userProfile.foto} alt="foto" className="settings-avatar-img" />
                  ) : (
                    <div className="settings-avatar-placeholder">{initials}</div>
                  )}
                </div>
                <div className="settings-profile-info">
                  <p className="settings-profile-name">{userProfile.nama || 'User'}</p>
                  <p className="settings-profile-email">{userProfile.email || 'email@gmail.com'}</p>
                  <span className="settings-profile-badge">Dari Google Account</span>
                </div>
              </div>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">Tema Tampilan</h3>
              <div className="settings-theme-options">
                <button className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  <span className="theme-preview light-preview" />
                  <span>Light</span>
                </button>
                <button className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  <span className="theme-preview dark-preview" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
            <div className="settings-section">
              <h3 className="settings-section-title">Akun</h3>
              <button className="settings-logout-btn" onClick={logout}>
                Keluar dari EduAssist
              </button>
            </div>
          </div>
        )}


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
                    placeholder="Tanya apa saja..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <button
                    className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                  >↑</button>
                </div>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s.label} className="suggestion-chip" onClick={() => handleSuggestion(s.label)}>
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="chat-messages">
                  {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble-row ${msg.role}`}>
                      {msg.role === 'assistant' && <div className="assistant-avatar">EA</div>}
                      <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="chat-bubble-row assistant">
                      <div className="assistant-avatar">EA</div>
                      <div className="chat-bubble assistant loading">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
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
                      placeholder="Lanjutkan percakapan..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <button
                      className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                    >↑</button>
                  </div>
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

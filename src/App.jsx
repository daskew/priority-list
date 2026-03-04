import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'
import PriorityList from './components/PriorityList'
import AddPriority from './components/AddPriority'
import StorageIndicator from './components/StorageIndicator'

const STORAGE_KEY = 'priority-list-data'

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (isLogin) {
        await onLogin(email, password)
      } else {
        if (!name) {
          setError('Name is required')
          setLoading(false)
          return
        }
        // Call register - for now just call onLogin which will use the register
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', email, password, name })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        // Auto login after register
        await onLogin(email, password)
      }
    } catch (err) {
      setError(err.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Priority List</h1>
        <h2>{isLogin ? 'Sign in to your account' : 'Create an account'}</h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          
          {error && <p className="error">{error}</p>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <p className="toggle-auth">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

function PriorityApp() {
  const { user, logout, getToken } = useAuth()
  const [priorities, setPriorities] = useState([])
  const [saving, setSaving] = useState(false)
  const [useApi, setUseApi] = useState(true)

  // Load from API on mount
  useEffect(() => {
    loadPriorities()
  }, [])

  const getAuthHeaders = () => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function loadPriorities() {
    if (useApi) {
      try {
        const res = await fetch('/api/priorities', {
          headers: getAuthHeaders()
        })
        if (res.status === 401) {
          logout()
          return
        }
        const data = await res.json()
        setPriorities(data)
      } catch (e) {
        console.error('Failed to load from API:', e)
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) setPriorities(JSON.parse(saved))
      }
    } else {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          setPriorities(JSON.parse(saved))
        } catch (e) {
          console.error('Failed to parse saved data:', e)
        }
      }
    }
  }

  // Save to localStorage on change (if not using API)
  useEffect(() => {
    if (!useApi) {
      setSaving(true)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(priorities))
      setTimeout(() => setSaving(false), 500)
    }
  }, [priorities, useApi])

  const addPriority = (title) => {
    const newPriority = {
      id: crypto.randomUUID(),
      title,
      notes: '',
      order: priorities.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (useApi) {
      fetch('/api/priorities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ title })
      }).then(() => loadPriorities()).catch(console.error)
    } else {
      setPriorities([...priorities, newPriority])
    }
  }

  const updatePriority = (id, updates) => {
    if (useApi) {
      fetch(`/api/priorities/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updates)
      }).then(() => loadPriorities()).catch(console.error)
    } else {
      setPriorities(prev => prev.map(p => 
        p.id === id 
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      ))
    }
  }

  const deletePriority = (id) => {
    if (useApi) {
      fetch(`/api/priorities/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      })
        .then(() => loadPriorities())
        .catch(console.error)
    } else {
      setPriorities(prev => prev.filter(p => p.id !== id))
    }
  }

  const reorderPriorities = (newOrder) => {
    const reordered = newOrder.map((p, i) => ({ ...p, order: i, updatedAt: new Date().toISOString() }))
    
    if (useApi) {
      fetch('/api/priorities/reorder', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ ids: reordered.map(p => p.id) })
      }).then(() => loadPriorities()).catch(console.error)
    } else {
      setPriorities(reordered)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>Priority List</h1>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
        <p className="tagline">Focus on what matters</p>
      </header>

      <main className="main">
        <AddPriority onAdd={addPriority} />
        <PriorityList 
          priorities={priorities}
          onUpdate={updatePriority}
          onDelete={deletePriority}
          onReorder={reorderPriorities}
        />
      </main>

      <footer className="footer">
        <StorageIndicator 
          saving={saving} 
          count={priorities.length}
          useApi={useApi}
          onToggleApi={() => setUseApi(!useApi)}
        />
      </footer>
    </div>
  )
}

function App() {
  const { user, loading, login, register } = useAuth()

  async function handleLogin(email, password) {
    // Try login first, if fails try register (for demo)
    try {
      await login(email, password)
    } catch (err) {
      // For demo: if login fails, try to register
      await register(email, password, email.split('@')[0])
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <AuthProvider>
      {user ? <PriorityApp /> : <AuthPage onLogin={handleLogin} />}
    </AuthProvider>
  )
}

export default App

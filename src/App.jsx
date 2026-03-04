import { useState, useEffect } from 'react'
import './App.css'
import PriorityList from './components/PriorityList'
import AddPriority from './components/AddPriority'
import StorageIndicator from './components/StorageIndicator'

const STORAGE_KEY = 'priority-list-data'

function App() {
  const [priorities, setPriorities] = useState([])
  const [saving, setSaving] = useState(false)
  const [useApi, setUseApi] = useState(false)

  // Load from localStorage or API on mount
  useEffect(() => {
    loadPriorities()
  }, [useApi])

  async function loadPriorities() {
    if (useApi) {
      try {
        const res = await fetch('/api/priorities')
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      fetch(`/api/priorities/${id}`, { method: 'DELETE' })
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map(p => p.id) })
      }).then(() => loadPriorities()).catch(console.error)
    } else {
      setPriorities(reordered)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Priority List</h1>
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

export default App

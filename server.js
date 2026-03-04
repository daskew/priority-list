import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const DATA_FILE = './data.json'

app.use(cors())
app.use(express.json())

// In-memory store
let priorities = []

// Load data from file
function loadData() {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8')
      priorities = JSON.parse(data)
    }
  } catch {
    priorities = []
  }
}

// Save data to file
function saveData() {
  writeFileSync(DATA_FILE, JSON.stringify(priorities, null, 2))
}

// Initialize
loadData()

// GET all priorities
app.get('/api/priorities', (req, res) => {
  res.json(priorities.sort((a, b) => a.order - b.order))
})

// POST create new priority
app.post('/api/priorities', (req, res) => {
  const { title, notes = '' } = req.body
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' })
  }

  const newPriority = {
    id: crypto.randomUUID(),
    title,
    notes,
    order: priorities.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  priorities.push(newPriority)
  saveData()
  
  res.status(201).json(newPriority)
})

// PUT update priority
app.put('/api/priorities/:id', (req, res) => {
  const { id } = req.params
  const { title, notes, order } = req.body

  const index = priorities.findIndex(p => p.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Priority not found' })
  }

  priorities[index] = {
    ...priorities[index],
    ...(title !== undefined && { title }),
    ...(notes !== undefined && { notes }),
    ...(order !== undefined && { order }),
    updatedAt: new Date().toISOString()
  }

  saveData()
  res.json(priorities[index])
})

// DELETE priority
app.delete('/api/priorities/:id', (req, res) => {
  const { id } = req.params

  const index = priorities.findIndex(p => p.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Priority not found' })
  }

  priorities.splice(index, 1)
  
  // Reorder remaining items
  priorities = priorities.map((p, i) => ({ ...p, order: i }))
  saveData()
  
  res.status(204).send()
})

// PATCH reorder priorities
app.patch('/api/priorities/reorder', (req, res) => {
  const { ids } = req.body

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' })
  }

  const reordered = ids.map((id, index) => {
    const priority = priorities.find(p => p.id === id)
    if (priority) {
      return { ...priority, order: index, updatedAt: new Date().toISOString() }
    }
    return null
  }).filter(Boolean)

  priorities = reordered
  saveData()
  
  res.json(priorities.sort((a, b) => a.order - b.order))
})

// Serve static files from Vite build in production
const staticPath = join(__dirname, 'dist')
if (existsSync(staticPath)) {
  app.use(express.static(staticPath))
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(staticPath, 'index.html'))
    }
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

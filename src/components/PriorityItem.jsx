import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function PriorityItem({ priority, isExpanded, onToggle, onUpdate, onDelete }) {
  const [title, setTitle] = useState(priority.title)
  const [notes, setNotes] = useState(priority.notes)
  const notesRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: priority.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  useEffect(() => {
    setNotes(priority.notes)
  }, [priority.notes])

  const handleTitleBlur = () => {
    if (title.trim() && title !== priority.title) {
      onUpdate(priority.id, { title: title.trim() })
    }
  }

  const handleNotesBlur = () => {
    if (notes !== priority.notes) {
      onUpdate(priority.id, { notes })
    }
  }

  useEffect(() => {
    if (isExpanded && notesRef.current) {
      notesRef.current.focus()
    }
  }, [isExpanded])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`priority-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="priority-main" onClick={onToggle}>
        <div className="drag-handle" {...attributes} {...listeners}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </div>

        <input
          type="text"
          className="priority-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onClick={e => e.stopPropagation()}
          placeholder="Priority title..."
        />

        <button
          className="delete-btn"
          onClick={e => {
            e.stopPropagation()
            onDelete(priority.id)
          }}
          title="Delete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>

        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </span>
      </div>

      {isExpanded && (
        <div className="notes-panel">
          <textarea
            ref={notesRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add notes here... (auto-saves)"
          />
          <div className="char-count">{notes.length} characters</div>
        </div>
      )}
    </div>
  )
}

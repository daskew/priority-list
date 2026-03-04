import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import PriorityItem from './PriorityItem'

export default function PriorityList({ priorities, onUpdate, onDelete, onReorder }) {
  const [expandedId, setExpandedId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = priorities.findIndex(p => p.id === active.id)
      const newIndex = priorities.findIndex(p => p.id === over.id)
      const newOrder = arrayMove(priorities, oldIndex, newIndex)
      onReorder(newOrder)
    }
  }

  if (priorities.length === 0) {
    return (
      <div className="empty-state">
        <p>No priorities yet</p>
        <p>Add your first priority above!</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={priorities.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="priority-list">
          {priorities.map(priority => (
            <PriorityItem
              key={priority.id}
              priority={priority}
              isExpanded={expandedId === priority.id}
              onToggle={() => setExpandedId(expandedId === priority.id ? null : priority.id)}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

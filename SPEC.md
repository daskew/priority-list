# Priority List App - Specification

## Project Overview
- **Name:** Priority List
- **Type:** Web Application (React + Vite)
- **Core Functionality:** A priority management tool with add/remove/reorder capabilities, expandable notes, local storage, and API for AI integration
- **Target Users:** Dave (personal use)

## UI/UX Specification

### Layout Structure
- **Header:** App title + tagline
- **Main Content:** Priority list with drag-to-reorder
- **Footer:** Storage status indicator
- **Responsive:** Mobile-first, works on all screen sizes

### Visual Design
- **Color Palette:**
  - Background: `#0f0f0f` (near black)
  - Surface: `#1a1a1a` (dark gray)
  - Primary: `#f59e0b` (amber/gold)
  - Secondary: `#3b82f6` (blue)
  - Text Primary: `#fafafa` (off-white)
  - Text Secondary: `#a1a1aa` (gray)
  - Danger: `#ef4444` (red)
  - Success: `#22c55e` (green)
- **Typography:**
  - Font: System UI (San Francisco, Segoe UI, Roboto)
  - Headings: Bold, 1.5rem-2rem
  - Body: Regular, 1rem
- **Spacing:** 8px base unit (0.5rem, 1rem, 1.5rem, etc.)
- **Effects:**
  - Cards have subtle border glow on hover
  - Smooth transitions (200ms ease)
  - Drag preview with opacity

### Components
1. **PriorityItem**
   - Title (editable inline)
   - Drag handle (left side)
   - Delete button (right side, appears on hover)
   - Expand/collapse for notes
   - States: default, hover, dragging, expanded

2. **AddPriorityForm**
   - Text input with placeholder
   - Add button
   - Keyboard: Enter to submit

3. **NotePanel** (expanded view)
   - Textarea for notes
   - Auto-save on blur
   - Character count

4. **StorageIndicator**
   - Shows "Saved locally" / "Syncing"
   - Subtle pulse animation when saving

## Functionality Specification

### Core Features
1. **Add Priority** - Input field + button, Enter key support
2. **Remove Priority** - Delete button with confirmation
3. **Reorder Priorities** - Drag and drop using @dnd-kit
4. **View/Edit Notes** - Click to expand, textarea for notes
5. **Local Storage** - Auto-save to localStorage on every change
6. **API Endpoints** - RESTful API for CRUD operations

### API Specification
```
GET    /api/priorities     - Get all priorities
POST   /api/priorities     - Create new priority
PUT    /api/priorities/:id - Update priority (title, notes, order)
DELETE /api/priorities/:id - Delete priority
PATCH  /api/priorities/reorder - Reorder priorities
```

### Data Structure
```json
{
  "id": "uuid",
  "title": "string",
  "notes": "string",
  "order": "number",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Future Considerations
- Web-based database (Firebase, Supabase, or similar)
- Authentication for public hosting
- API authentication

## Acceptance Criteria
1. ✅ Can add a new priority
2. ✅ Can delete a priority
3. ✅ Can drag to reorder priorities
4. ✅ Can click to expand and view/edit notes
5. ✅ Data persists in localStorage
6. ✅ API is functional for all CRUD operations
7. ✅ Responsive on mobile and desktop
8. ✅ Clean, modern dark UI

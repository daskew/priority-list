export default function StorageIndicator({ saving, count, useApi, onToggleApi }) {
  return (
    <div>
      <div className={`storage-indicator ${saving ? 'saving' : ''}`}>
        <span className="dot"></span>
        <span>{saving ? 'Saving...' : useApi ? 'Using API' : 'Saved locally'}</span>
      </div>
      <div className="api-status">
        <button onClick={onToggleApi}>
          {useApi ? 'Switch to localStorage' : 'Use API instead'}
        </button>
        {' | '}
        <a href="/api/priorities" target="_blank" rel="noopener">REST API</a>
      </div>
    </div>
  )
}

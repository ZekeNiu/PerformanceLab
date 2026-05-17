export default function Settings() {
  return (
    <div className="flex flex-1 items-center justify-center" style={{ color: 'var(--text-muted)' }}>
      <div className="text-center">
        <img src="/empty-state-data.svg" alt="" className="mx-auto mb-4 h-24 w-24 opacity-60" />
        <h2 className="text-h2" style={{ color: 'var(--text-secondary)' }}>Settings</h2>
        <p className="mt-2 text-body">Theme, body map configuration, and system preferences coming soon.</p>
      </div>
    </div>
  )
}

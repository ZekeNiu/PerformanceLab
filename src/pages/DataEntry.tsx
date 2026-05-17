export default function DataEntry() {
  return (
    <div className="flex flex-1 items-center justify-center" style={{ color: 'var(--text-muted)' }}>
      <div className="text-center">
        <img src={`${import.meta.env.BASE_URL}excel-import-illustration.svg`} alt="" className="mx-auto mb-4 h-24 w-24 opacity-60" />
        <h2 className="text-h2" style={{ color: 'var(--text-secondary)' }}>Data Entry</h2>
        <p className="mt-2 text-body">Manual data input & Excel import coming soon.</p>
      </div>
    </div>
  )
}

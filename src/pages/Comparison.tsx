export default function Comparison() {
  return (
    <div className="flex flex-1 items-center justify-center" style={{ color: 'var(--text-muted)' }}>
      <div className="text-center">
        <img src={`${import.meta.env.BASE_URL}empty-state-data.svg`} alt="" className="mx-auto mb-4 h-24 w-24 opacity-60" />
        <h2 className="text-h2" style={{ color: 'var(--text-secondary)' }}>Comparison</h2>
        <p className="mt-2 text-body">Longitudinal & Cross-sectional comparison analysis coming soon.</p>
      </div>
    </div>
  )
}

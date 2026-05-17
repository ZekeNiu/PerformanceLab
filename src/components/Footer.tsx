export default function Footer() {
  return (
    <footer
      className="flex h-10 items-center justify-between border-t px-6 text-xs"
      style={{
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <span>SportPulse v1.0</span>
      <span className="font-mono text-[11px]">Performance Analytics Platform</span>
    </footer>
  )
}

import { useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  GitCompare,
  ScatterChart,
  Upload,
  Database,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Comparison', path: '/comparison', icon: GitCompare },
  { label: 'Correlation', path: '/correlation', icon: ScatterChart },
  { label: 'Data Entry', path: '/data-entry', icon: Upload },
  { label: 'Admin', path: '/admin', icon: Database },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
      }
      return next
    })
  }, [])

  return (
    <motion.aside
      className="fixed left-0 top-0 z-50 flex h-full flex-col border-r"
      style={{
        width: collapsed ? 64 : 240,
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-subtle)',
      }}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.45, 0, 0.55, 1] as [number, number, number, number] }}
    >
      {/* Logo area */}
      <div
        className="flex h-14 items-center border-b px-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}logo-icon.svg`} alt="SportPulse" className="h-7 w-7" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="ml-3 whitespace-nowrap text-h3 font-semibold"
              style={{ color: 'var(--text-primary)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              SportPulse
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-2 pt-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative flex h-10 items-center rounded-lg px-3 transition-colors duration-200"
              style={{
                backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
                className="shrink-0 transition-colors duration-200 group-hover:text-[var(--text-primary)]"
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="ml-3 whitespace-nowrap text-[13px] font-medium"
                    style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div
                  className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {item.label}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom area: theme toggle + user */}
      <div
        className="flex flex-col gap-1 border-t px-2 pb-3 pt-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          onClick={toggleTheme}
          className="group relative flex h-10 items-center rounded-lg px-3 transition-colors duration-200"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {isDark ? (
            <Sun size={20} strokeWidth={1.5} />
          ) : (
            <Moon size={20} strokeWidth={1.5} />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="ml-3 whitespace-nowrap text-[13px] font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div
          className="group relative flex h-10 items-center rounded-lg px-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--accent-cyan)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--bg-primary)' }}>
              PA
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="ml-3 flex flex-col items-start overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <span className="truncate text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                  Performance Analyst
                </span>
                <span className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Admin
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 768) {
        setSidebarCollapsed(true)
      } else if (window.innerWidth >= 1440) {
        setSidebarCollapsed(false)
      }
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return (
    <div className="flex min-h-[100dvh]">
      <Navbar />
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
      >
        <main className="flex flex-1 flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [contentOffset, setContentOffset] = useState(() => {
    if (typeof window === 'undefined') return 240
    if (window.innerWidth < 768) return 0
    if (window.innerWidth < 1280) return 64
    return 240
  })

  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 768) {
        setContentOffset(0)
      } else if (window.innerWidth < 1280) {
        setContentOffset(64)
      } else {
        setContentOffset(240)
      }
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden">
      <Navbar />
      <div
        className="flex min-w-0 flex-1 flex-col pb-16 transition-all duration-300 md:pb-0"
        style={{ marginLeft: contentOffset }}
      >
        <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function ResponsiveLayout({ children, sidebar, header, footer }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (typeof window === 'undefined') return

    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  // Return a default layout during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-themed-background">
        {header}
        <div className="flex">
          {sidebar && <aside className="w-80 bg-themed-surface border-r border-themed-border">{sidebar}</aside>}
          <main className="flex-1 p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {children}
            </motion.div>
          </main>
        </div>
        {footer}
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-themed-background">
        {header}
        <main className="relative">{children}</main>
        {footer}
      </div>
    )
  }

  if (isTablet) {
    return (
      <div className="min-h-screen bg-themed-background">
        {header}
        <div className="flex">
          {sidebar && <aside className="w-64 bg-themed-surface border-r border-themed-border">{sidebar}</aside>}
          <main className="flex-1 p-6">{children}</main>
        </div>
        {footer}
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-themed-background">
      {header}
      <div className="flex">
        {sidebar && <aside className="w-80 bg-themed-surface border-r border-themed-border">{sidebar}</aside>}
        <main className="flex-1 p-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {children}
          </motion.div>
        </main>
      </div>
      {footer}
    </div>
  )
}

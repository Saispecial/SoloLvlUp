"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Sword, MessageSquare, BarChart3, Award, Settings, Menu, X } from "lucide-react"

interface MobileNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "quests", label: "Quests", icon: Sword },
    { id: "reflection", label: "Reflection", icon: MessageSquare },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    setIsMenuOpen(false)

    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  if (!isMobile) {
    // Desktop horizontal tabs
    return (
      <div className="tabs-themed rounded-lg mb-6">
        <div className="grid grid-cols-6 p-1 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`tab-trigger px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === id
                  ? "bg-themed-primary text-white shadow-lg"
                  : "text-themed-text opacity-70 hover:opacity-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Mobile navigation
  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-themed-surface/95 backdrop-blur-md border-b border-themed-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-themed-text">
            {tabs.find((tab) => tab.id === activeTab)?.label || "SoloLvlUp"}
          </h1>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg bg-themed-primary/20 text-themed-primary"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 h-full w-80 bg-themed-surface border-r border-themed-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pt-20">
                <div className="space-y-2">
                  {tabs.map(({ id, label, icon: Icon }, index) => (
                    <motion.button
                      key={id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleTabChange(id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all ${
                        activeTab === id
                          ? "bg-themed-primary text-white shadow-lg"
                          : "text-themed-text hover:bg-themed-primary/10"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="font-medium">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-themed-surface/95 backdrop-blur-md border-t border-themed-border">
        <div className="grid grid-cols-4 p-2">
          {tabs.slice(0, 4).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                activeTab === id ? "text-themed-primary bg-themed-primary/10" : "text-themed-text opacity-60"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

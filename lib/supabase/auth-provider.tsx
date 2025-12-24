"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "./client"
import type { User } from "@supabase/supabase-js"
import { loadUserData, initializeNewUser } from "./data-service"
import { usePlayerStore } from "@/stores/player-store"
import { ACHIEVEMENTS } from "@/lib/achievements"

interface AuthContextType {
  user: User | null
  loading: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isInitialized: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await syncUserData(currentUser.id, currentUser.user_metadata?.display_name || "Hunter")
      }

      setLoading(false)
      setIsInitialized(true)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === "SIGNED_IN" && currentUser) {
        // Clear localStorage and sync fresh data from Supabase
        await syncUserData(currentUser.id, currentUser.user_metadata?.display_name || "Hunter")
      } else if (event === "SIGNED_OUT") {
        // Reset to default state on logout
        usePlayerStore.getState().resetPlayer()
        usePlayerStore.getState().setUserId(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const syncUserData = async (userId: string, displayName: string) => {
    try {
      console.log("[v0] Syncing user data for:", userId)

      // Set user ID in store
      usePlayerStore.getState().setUserId(userId)

      // Load user data from Supabase
      const userData = await loadUserData(userId)
      console.log("[v0] Loaded user data:", userData)

      if (!userData.stats) {
        // New user - initialize data and reset local store
        console.log("[v0] New user detected, initializing...")
        await initializeNewUser(userId, displayName)

        // Reset local store to fresh state
        usePlayerStore.getState().resetPlayer()
        usePlayerStore.getState().updatePlayerName(displayName)
        usePlayerStore.getState().setUserId(userId)
      } else {
        // Existing user - load their data from Supabase
        console.log("[v0] Existing user, loading data from Supabase...")

        const store = usePlayerStore.getState()

        // This ensures data doesn't get wiped out by the persist middleware
        const loadedQuests = userData.quests || []
        const loadedReflections = userData.reflections || []

        console.log("[v0] Loading quests:", loadedQuests.length)
        console.log("[v0] Loading reflections:", loadedReflections.length)

        const activeQuests = loadedQuests.filter((q: any) => !q.completed)
        const completedQuests = loadedQuests.filter((q: any) => q.completed)

        usePlayerStore.setState({
          quests: activeQuests,
          completedQuests: completedQuests,
          reflections: loadedReflections,
          currentReflection: loadedReflections[0] || null,
        })

        // Update player profile with Supabase data
        store.updatePlayer({
          name: userData.profile?.display_name || displayName,
          level: userData.stats.level || 1,
          xp: userData.stats.xp || 0,
          totalXp: userData.stats.xp || 0,
          streak: userData.stats.streak || 0,
          stats: userData.stats.stats || store.player.stats,
        })

        // Load achievements from Supabase or use defaults
        if (userData.stats.achievements && userData.stats.achievements.length > 0) {
          usePlayerStore.setState({
            achievements: userData.stats.achievements,
          })
        } else {
          usePlayerStore.setState({
            achievements: ACHIEVEMENTS,
          })
        }
      }

      console.log("[v0] User data sync complete")
    } catch (error) {
      console.error("[v0] Error syncing user data:", error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, isInitialized }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

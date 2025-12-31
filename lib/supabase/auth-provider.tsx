"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "./client"
import type { User } from "@supabase/supabase-js"
import { loadUserData, initializeNewUser } from "./data-service"
import { usePlayerStore } from "@/stores/player-store"
import { calculateNextLevelXp, calculateCurrentLevelXp } from "@/lib/rpg-engine"

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
      console.log("[v0] syncUserData - READ-ONLY hydration for:", userId)

      const store = usePlayerStore.getState()

      store.setUserId(userId)

      // Load user data from Supabase - THIS IS THE SOURCE OF TRUTH
      const userData = await loadUserData(userId)
      console.log("[v0] Loaded from DB:", JSON.stringify(userData, null, 2))

      if (!userData.stats) {
        // New user - initialize in DB first
        console.log("[v0] New user - initializing in DB first")
        await initializeNewUser(userId, displayName)

        // Reset local store and re-fetch from DB
        store.resetPlayer()
        store.setUserId(userId)
        store.updatePlayerName(displayName)
      } else {
        console.log("[v0] Existing user - READ-ONLY hydration from DB")

        // Set quests and reflections directly from DB
        store.setQuestsFromDb(userData.quests || [])
        store.setReflectionsFromDb(userData.reflections || [])

        const dbTotalXp = userData.stats.xp || 0
        const dbLevel = userData.stats.level || 1
        const currentLevelXp = calculateCurrentLevelXp(dbTotalXp, dbLevel)

        store.setPlayerFromDb({
          name: userData.profile?.display_name || displayName,
          level: dbLevel,
          xp: currentLevelXp, // Display XP within current level
          totalXp: dbTotalXp,
          streak: userData.stats.streak || 0,
          stats: userData.stats.stats || store.player.stats,
          nextLevelXp: calculateNextLevelXp(dbLevel),
        })

        // Load achievements from DB
        if (userData.stats.achievements?.length > 0) {
          usePlayerStore.setState({ achievements: userData.stats.achievements })
        }

        console.log("[v0] READ-ONLY hydration complete - DB values set directly")
      }
    } catch (error) {
      console.error("[v0] Error in syncUserData:", error)
    }
  }

  return <AuthContext.Provider value={{ user, loading, isInitialized }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

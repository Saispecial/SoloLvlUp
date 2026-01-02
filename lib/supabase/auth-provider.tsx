"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "./client"
import type { User } from "@supabase/supabase-js"
import { usePlayerStore } from "@/stores/player-store"

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
        onLoginSuccess(currentUser.id, currentUser.user_metadata?.display_name || "Hunter")
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
        onLoginSuccess(currentUser.id, currentUser.user_metadata?.display_name || "Hunter")
      } else if (event === "SIGNED_OUT") {
        usePlayerStore.getState().setUserId(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, isInitialized }}>{children}</AuthContext.Provider>
}

function onLoginSuccess(userId: string, displayName: string) {
  console.log("[v0] onLoginSuccess - AUTH-ONLY mode")

  const store = usePlayerStore.getState()

  store.setUserId(userId)

  if (store.player.name === "Hunter" && displayName !== "Hunter") {
    store.updatePlayerName(displayName)
  }

  console.log("[v0] Auth identity set, RPG state preserved")
}

export const useAuth = () => useContext(AuthContext)

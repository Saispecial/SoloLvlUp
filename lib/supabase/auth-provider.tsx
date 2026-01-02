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

    const initAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000))

        const sessionPromise = supabase.auth.getSession()

        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as any

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          console.log("[v0] User authenticated:", currentUser.id)

          // Try to fetch display name but don't block on it
          try {
            const profilePromise = supabase.from("profiles").select("display_name").eq("id", currentUser.id).single()

            const profileTimeout = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Profile fetch timeout")), 2000),
            )

            const { data: profileData } = (await Promise.race([profilePromise, profileTimeout])) as any

            const displayName = profileData?.display_name || currentUser.user_metadata?.display_name || "Hunter"
            onLoginSuccess(currentUser.id, displayName)
          } catch (profileError) {
            console.log("[v0] Profile fetch failed, using default:", profileError)
            // Still proceed with login using metadata or default name
            onLoginSuccess(currentUser.id, currentUser.user_metadata?.display_name || "Hunter")
          }
        }
      } catch (error) {
        console.log("[v0] Auth initialization failed:", error)
        // Proceed without auth - user can still use app in guest mode
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)

      try {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (event === "SIGNED_IN" && currentUser) {
          // Try to get display name, but don't block on it
          const displayName = currentUser.user_metadata?.display_name || "Hunter"
          onLoginSuccess(currentUser.id, displayName)

          // Attempt async profile fetch without blocking
          supabase
            .from("profiles")
            .select("display_name")
            .eq("id", currentUser.id)
            .single()
            .then(({ data }) => {
              if (data?.display_name && data.display_name !== displayName) {
                usePlayerStore.getState().updatePlayerName(data.display_name)
              }
            })
            .catch(() => {
              console.log("[v0] Profile fetch in background failed")
            })
        } else if (event === "SIGNED_OUT") {
          usePlayerStore.getState().setUserId(null)
        }
      } catch (error) {
        console.log("[v0] Auth state change error:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, isInitialized }}>{children}</AuthContext.Provider>
}

function onLoginSuccess(userId: string, displayName: string) {
  console.log("[v0] onLoginSuccess - AUTH-ONLY mode")
  console.log("[v0] Setting username for user:", userId, "name:", displayName)

  const store = usePlayerStore.getState()

  store.setUserId(userId)
  store.updatePlayerName(displayName)

  console.log("[v0] Auth identity set, RPG state preserved")
}

export const useAuth = () => useContext(AuthContext)

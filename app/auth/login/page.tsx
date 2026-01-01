"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,188,212,0.05),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(0,188,212,0.05),transparent_50%)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 bg-cyan-400/30 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-75" />

        <Card className="relative border-2 border-cyan-500/50 bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 rounded-2xl">
          <CardHeader className="border-b border-cyan-500/20 pb-4">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">
              SoloLvlUp
            </CardTitle>
            <CardDescription className="text-cyan-200/60 mt-1">Awaken your power. Enter the dungeon.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cyan-100 font-medium text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hunter@sololevel.up"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/60 border-cyan-500/30 border text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 rounded-lg transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-cyan-100 font-medium text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/60 border-cyan-500/30 border text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20 rounded-lg transition-all"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-950/20 p-2 rounded border border-red-500/20">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-bold text-base py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 uppercase tracking-wider"
                disabled={isLoading}
              >
                {isLoading ? "Entering..." : "Enter Dungeon"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-cyan-200/70">
              Not awakened yet?{" "}
              <Link href="/auth/signup" className="text-cyan-300 font-semibold hover:text-cyan-200 transition-colors">
                Become a Hunter
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

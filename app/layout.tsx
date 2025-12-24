import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { TalkingAgent } from "../components/talking-agent"
import { AuthProvider } from "@/lib/supabase/auth-provider"

export const metadata: Metadata = {
  title: "SoloLvlUp - Level Up Your Life",
  description: "Gamify your personal growth with AI-powered quests",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <TalkingAgent />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

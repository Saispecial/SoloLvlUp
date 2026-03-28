import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { TalkingAgent } from "../components/talking-agent"
import { AuthProvider } from "@/lib/supabase/auth-provider"

export const metadata: Metadata = {
  title: "SoloLvlUp - Level Up Your Life",
  description: "Gamify your personal growth with AI-powered quests",
  generator: "v0.dev",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SoloLvlUp",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000a2e" />
      </head>
      <body>
        <AuthProvider>
          <TalkingAgent />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

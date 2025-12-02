import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { TalkingAgent } from "../components/talking-agent"
import { CapacitorInitializer } from "../components/capacitor-initializer"

export const metadata: Metadata = {
  title: "RPG Engine",
  description: "Level up your life through quests and personal growth",
  generator: "v0.dev",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icon.svg" />
      </head>
      <body>
        <CapacitorInitializer />
        <TalkingAgent />
        {children}
      </body>
    </html>
  )
}

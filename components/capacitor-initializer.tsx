"use client"

import { useEffect } from "react"
import { initializeCapacitor } from "../lib/capacitor-init"

export function CapacitorInitializer() {
  useEffect(() => {
    initializeCapacitor()
  }, [])

  return null
}

"use client"

import type React from "react"
import { motion } from "framer-motion"

interface HolographicDisplayProps {
  children: React.ReactNode
  className?: string
  scanlineEffect?: boolean
  glitchEffect?: boolean
}

export function HolographicDisplay({
  children,
  className = "",
  scanlineEffect = true,
  glitchEffect = false,
}: HolographicDisplayProps) {
  return (
    <motion.div
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-cyan-900/20 to-blue-900/20
        border border-cyan-400/30
        backdrop-blur-sm
        ${className}
      `}
      style={{
        background: `
          linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 100, 255, 0.1) 100%),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.03) 2px,
            rgba(0, 255, 255, 0.03) 4px
          )
        `,
      }}
      animate={{
        boxShadow: [
          "0 0 20px rgba(0, 255, 255, 0.3)",
          "0 0 30px rgba(0, 255, 255, 0.5)",
          "0 0 20px rgba(0, 255, 255, 0.3)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {scanlineEffect && (
        <motion.div
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 z-10"
          animate={{
            y: ["-100%", "100vh"],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{ top: "-1px" }}
        />
      )}

      {glitchEffect && (
        <motion.div
          className="absolute inset-0"
          animate={{
            x: [0, 2, -2, 0],
            filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
          }}
          transition={{
            duration: 0.1,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: Math.random() * 5 + 2,
          }}
        />
      )}

      <div className="relative z-20">{children}</div>
    </motion.div>
  )
}

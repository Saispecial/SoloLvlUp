"use client"

import type React from "react"
import { motion } from "framer-motion"

interface FuturisticButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "danger"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
  glowEffect?: boolean
}

export function FuturisticButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  glowEffect = true,
}: FuturisticButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }

  return (
    <div className="relative inline-block">
      {glowEffect && (
        <motion.div
          className={`absolute inset-0 ${variants[variant]} rounded-lg blur-md opacity-30`}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{ zIndex: -1 }}
        />
      )}
      <motion.button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative ${variants[variant]} ${sizes[size]}
          rounded-lg font-semibold text-white
          border border-white/20 backdrop-blur-sm
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
          ${className}
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10">{children}</span>
      </motion.button>
    </div>
  )
}

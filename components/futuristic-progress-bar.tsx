"use client"

import { motion } from "framer-motion"

interface FuturisticProgressBarProps {
  value: number
  max: number
  className?: string
  color?: string
  animated?: boolean
  showPercentage?: boolean
  label?: string
}

export function FuturisticProgressBar({
  value,
  max,
  className = "",
  color = "cyan",
  animated = true,
  showPercentage = true,
  label,
}: FuturisticProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    cyan: "from-cyan-400 to-blue-500",
    green: "from-green-400 to-emerald-500",
    purple: "from-purple-400 to-pink-500",
    orange: "from-orange-400 to-red-500",
    yellow: "from-yellow-400 to-orange-500",
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-themed-text">{label}</span>
          {showPercentage && <span className="text-sm text-themed-accent font-mono">{Math.round(percentage)}%</span>}
        </div>
      )}

      <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden border border-gray-600/30">
        <motion.div
          className={`
            h-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses] || colorClasses.cyan}
            rounded-full transition-all duration-300
            relative overflow-hidden
          `}
          initial={{ width: animated ? "0%" : `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
        >
          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0"
            animate={{
              boxShadow: [
                `0 0 10px ${color === "cyan" ? "rgba(0, 255, 255, 0.5)" : "rgba(168, 85, 247, 0.5)"}`,
                `0 0 20px ${color === "cyan" ? "rgba(0, 255, 255, 0.8)" : "rgba(168, 85, 247, 0.8)"}`,
                `0 0 10px ${color === "cyan" ? "rgba(0, 255, 255, 0.5)" : "rgba(168, 85, 247, 0.5)"}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 10px,
              rgba(255, 255, 255, 0.1) 10px,
              rgba(255, 255, 255, 0.1) 11px
            )`,
          }}
        />
      </div>
    </div>
  )
}

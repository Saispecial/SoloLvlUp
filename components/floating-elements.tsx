"use client"

import { motion } from "framer-motion"

interface FloatingElementsProps {
  count?: number
  className?: string
}

export function FloatingElements({ count = 20, className = "" }: FloatingElementsProps) {
  const elements = Array.from({ length: count }, (_, i) => i)

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      {elements.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200],
            y: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200],
            scale: [0.5, 1.5, 0.5],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

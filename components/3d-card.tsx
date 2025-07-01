"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"

interface Card3DProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
  hoverScale?: number
  rotateIntensity?: number
}

export function Card3D({
  children,
  className = "",
  glowColor = "rgb(var(--color-primary))",
  hoverScale = 1.05,
  rotateIntensity = 15,
}: Card3DProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const newRotateX = ((y - centerY) / centerY) * rotateIntensity
    const newRotateY = ((centerX - x) / centerX) * rotateIntensity

    setRotateX(newRotateX)
    setRotateY(newRotateY)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <motion.div
      className={`card-3d ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      animate={{
        rotateX: rotateX,
        rotateY: rotateY,
        scale: isHovered ? hoverScale : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
        boxShadow: isHovered ? `0 20px 40px ${glowColor}40, 0 0 20px ${glowColor}60` : `0 10px 20px rgba(0,0,0,0.3)`,
      }}
    >
      {children}
    </motion.div>
  )
}

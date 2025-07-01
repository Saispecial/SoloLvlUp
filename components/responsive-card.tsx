"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  mobileClassName?: string
  desktopClassName?: string
  padding?: "sm" | "md" | "lg"
  hover3D?: boolean
}

export function ResponsiveCard({
  children,
  className = "",
  mobileClassName = "",
  desktopClassName = "",
  padding = "md",
  hover3D = true,
}: ResponsiveCardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  const paddingClasses = {
    sm: isMobile ? "p-3" : "p-4",
    md: isMobile ? "p-4" : "p-6",
    lg: isMobile ? "p-6" : "p-8",
  }

  const baseClasses = `
    card-themed rounded-xl transition-all duration-300
    ${paddingClasses[padding]}
    ${isMobile ? mobileClassName : desktopClassName}
    ${className}
  `

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    hover:
      hover3D && !isMobile
        ? {
            scale: 1.02,
            rotateY: 5,
            transition: { duration: 0.2 },
          }
        : {},
  }

  return (
    <motion.div
      className={baseClasses}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {children}
    </motion.div>
  )
}

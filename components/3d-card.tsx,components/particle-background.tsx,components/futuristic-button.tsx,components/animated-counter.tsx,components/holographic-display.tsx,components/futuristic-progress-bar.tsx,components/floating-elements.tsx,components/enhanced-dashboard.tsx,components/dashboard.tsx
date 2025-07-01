"use client"

const ThreeDCard = () => {
  return (
    <div className="relative w-64 h-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-25"></div>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white">3D Card</h2>
        <p className="text-gray-300">A cool card with a 3D effect.</p>
      </div>
    </div>
  )
}

export default ThreeDCard

// components/particle-background.tsx
import { useEffect, useRef } from "react"

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particlesArray: { x: number; y: number; size: number; color: string; speedX: number; speedY: number }[] = []
    const numberOfParticles = 100

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 1,
        color: "rgba(255,255,255,0.8)",
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 3 - 1.5,
      })
    }

    function drawParticles() {
      if (!ctx) return
      particlesArray.forEach((particle) => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      })
    }

    function updateParticles() {
      particlesArray.forEach((particle) => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX = -particle.speedX
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY = -particle.speedY
        }
      })
    }

    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      updateParticles()
      drawParticles()
      requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    })
  }, [])

  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: -1 }} />
}

export default ParticleBackground;

const FuturisticButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <button
      className="relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-indigo-500 rounded-full shadow-md group"
      onClick={handleClick}
    >
      <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-indigo-500 group-hover:translate-x-0 ease">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
      </span>
      <span className="absolute flex items-center justify-center w-full h-full text-indigo-500 transition-all duration-300 transform group-hover:translate-x-full ease">
        {children}
      </span>
      <span className="relative invisible">{children}</span>
    </button>
  )
}

export default FuturisticButton;

// components/animated-counter.tsx
import { useState, useEffect } from "react"
import anime from "animejs/lib/anime.es.js"

const AnimatedCounter = ({ start, end, duration }: { start: number; end: number; duration: number }) => {
  const [count, setCount] = useState(start)

  useEffect(() => {
    anime({
      targets: [count],
      value: [start, end],
      round: 1,
      duration: duration,
      easing: "linear",
      update: (anim) => {
        setCount(anim.animations[0].currentValue)
      },
    })
  }, [start, end, duration, count])

  return <span className="text-3xl font-bold text-blue-500">{count}</span>
}

export default AnimatedCounter;

// components/holographic-display.tsx
import { useRef, useEffect } from "react"
import anime from "animejs/lib/anime.es.js"

const HolographicDisplay = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Example animation (replace with your holographic effect)
    anime({
      targets: container,
      rotate: "1turn",
      loop: true,
      duration: 5000,
      easing: "linear",
    })
  }, [])

  return (
    <div ref={containerRef} className="relative w-64 h-64 bg-black rounded-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
        Hologram
      </div>
    </div>
  )
}

export default HolographicDisplay;

// components/futuristic-progress-bar.tsx
import { useState, useEffect } from "react"
import anime from "animejs/lib/anime.es.js"

const FuturisticProgressBar = ({ progress, duration }: { progress: number; duration: number }) => {
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    anime({
      targets: [barWidth],
      value: [0, progress],
      round: 1,
      duration: duration,
      easing: "easeInOutSine",
      update: (anim) => {
        setBarWidth(anim.animations[0].currentValue)
      },
    })
  }, [progress, duration, barWidth])

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${barWidth}%` }}></div>
    </div>
  )
}

export default FuturisticProgressBar;

// components/floating-elements.tsx
import { useEffect, useRef } from "react"
import anime from "animejs/lib/anime.es.js"

const FloatingElements = () => {
  const elementsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    elementsRef.current.forEach((element, index) => {
      if (element) {
        anime({
          targets: element,
          translateY: [0, -20],
          translateX: [0, Math.random() * 20 - 10],
          direction: "alternate",
          loop: true,
          easing: "easeInOutSine",
          duration: 2000 + index * 200,
        })
      }
    })
  }, [])

  return (
    <div className="relative w-full h-64">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          ref={(el) => (elementsRef.current[index] = el)}
          className="absolute w-8 h-8 bg-purple-500 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        ></div>
      ))}
    </div>
  )
}

export default FloatingElements;
import ThreeDCard from "./3d-card"
import ParticleBackground from "./particle-background"
import FuturisticButton from "./futuristic-button"
import AnimatedCounter from "./animated-counter"
import HolographicDisplay from "./holographic-display"
import FuturisticProgressBar from "./futuristic-progress-bar"
import FloatingElements from "./floating-elements"

const EnhancedDashboard = () => {
  return (
    <div className="relative">
      <ParticleBackground />
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Enhanced Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ThreeDCard />
          <div>
            <AnimatedCounter start={0} end={150} duration={3000} />
            <p className="text-gray-300">New Users</p>
          </div>
          <HolographicDisplay />
          <div>
            <FuturisticProgressBar progress={75} duration={2000} />
            <p className="text-gray-300">Server Load</p>
          </div>
          <FloatingElements />
          <FuturisticButton onClick={() => alert("Button Clicked!")}>Click Me</FuturisticButton>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard;

// components/dashboard.tsx
import type React from "react"
import EnhancedDashboard from "./enhanced-dashboard"

const Dashboard = () => {
  return (
    <div>
      <EnhancedDashboard />
    </div>
  )
}

export default Dashboard;

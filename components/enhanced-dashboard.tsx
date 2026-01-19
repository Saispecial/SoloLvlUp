"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { PlayerProfile, Quest, Achievement } from "@/lib/types"
import { MobileDashboard } from "./mobile-dashboard"
import { motion } from "framer-motion"
import { Trophy, Zap, Target, Award, CheckCircle2, Flame, Brain, Heart, Dumbbell } from "lucide-react"
import { Card3D } from "./3d-card"
import { AnimatedCounter } from "./animated-counter"
import { HolographicDisplay } from "./holographic-display"
import { FuturisticProgressBar } from "./futuristic-progress-bar"
import { usePlayerStore } from "@/stores/player-store"

interface EnhancedDashboardProps {
  player: PlayerProfile
  quests: Quest[]
  achievements: Achievement[]
}

export function EnhancedDashboard({ player, quests, achievements }: EnhancedDashboardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    setMounted(true)
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", checkMobile)
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [isMobile])

  if (!mounted) return null

  // Use mobile-optimized dashboard for mobile devices
  if (isMobile) {
    return <MobileDashboard player={player} quests={quests} achievements={achievements} />
  }

  // Desktop dashboard - now we can safely use hooks
  return <EnhancedDashboardDesktop player={player} quests={quests} achievements={achievements} />
}

function EnhancedDashboardDesktop({ player, quests, achievements }: EnhancedDashboardProps) {
  const { completedQuests } = usePlayerStore()
  const activeQuests = quests
  const unlockedAchievements = achievements.filter((a) => a.unlocked)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="space-y-8 relative z-20" variants={containerVariants} initial="hidden" animate="visible">
      {/* Hero Section */}
      <motion.header className="text-center relative" variants={itemVariants}>
        <HolographicDisplay className="p-8 rounded-2xl mx-auto max-w-2xl">
          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center relative overflow-hidden"
          >
            <Trophy className="w-12 h-12 text-white relative z-10" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Welcome, {player.name}
          </h1>

          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="text-cyan-400 font-mono">Level</span>
            <AnimatedCounter value={player.level} className="text-2xl font-bold text-white" />
            <span className="text-gray-400">•</span>
            <span className="text-purple-400 font-mono">{player.rank} Hunter</span>
          </div>
        </HolographicDisplay>
      </motion.header>

      {/* XP Progress */}
      <motion.div variants={itemVariants} className="dashboard-card">
        <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-cyan-400/30">
          <FuturisticProgressBar
            value={player.xp}
            max={player.nextLevelXp}
            label="Experience Progress"
            color="cyan"
            animated={true}
            showPercentage={true}
            className="mb-4"
          />
          <div className="flex justify-between text-sm">
            <span className="text-cyan-400 font-mono">
              <AnimatedCounter value={player.xp} suffix=" XP" />
            </span>
            <span className="text-gray-400 font-mono">{player.nextLevelXp} XP</span>
          </div>
        </Card3D>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
        <StatCard3D
          icon={<Flame className="w-8 h-8" />}
          label="Streak"
          value={player.streak}
          suffix=" days"
          color="from-orange-400 to-red-500"
          glowColor="rgba(251, 146, 60, 0.5)"
          highlight={player.streak > 0}
        />
        <StatCard3D
          icon={<Zap className="w-8 h-8" />}
          label="Active Quests"
          value={activeQuests.length}
          color="from-yellow-400 to-orange-500"
          glowColor="rgba(251, 191, 36, 0.5)"
        />
        <StatCard3D
          icon={<CheckCircle2 className="w-8 h-8" />}
          label="Completed"
          value={completedQuests.length}
          color="from-green-400 to-emerald-500"
          glowColor="rgba(34, 197, 94, 0.5)"
        />
        <StatCard3D
          icon={<Target className="w-8 h-8" />}
          label="Skill Points"
          value={player.skillPoints}
          color="from-purple-400 to-pink-500"
          glowColor="rgba(168, 85, 247, 0.5)"
        />
      </motion.div>

      {/* Top Stats Display */}
      <motion.div variants={itemVariants} className="dashboard-card">
        <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-purple-400/30">
          <h3 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Character Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatDisplay
              icon={<Brain className="w-6 h-6 text-blue-400" />}
              label="IQ"
              value={player.stats.IQ}
              color="blue"
            />
            <StatDisplay
              icon={<Heart className="w-6 h-6 text-pink-400" />}
              label="EQ"
              value={player.stats.EQ}
              color="pink"
            />
            <StatDisplay
              icon={<Dumbbell className="w-6 h-6 text-green-400" />}
              label="Strength"
              value={player.stats.Strength}
              color="green"
            />
          </div>
        </Card3D>
      </motion.div>

      {/* Recent Achievements */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <div className="flex items-center justify-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Award className="w-8 h-8 text-cyan-400" />
            Recent Achievements
          </h2>
        </div>

        <div className="grid gap-4">
          {unlockedAchievements.slice(-3).map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="dashboard-card"
            >
              <Card3D
                className="p-4 rounded-lg bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-400/30"
                glowColor="rgba(34, 197, 94, 0.3)"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-400">{achievement.title}</h3>
                    <p className="text-sm text-gray-300">{achievement.description}</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              </Card3D>
            </motion.div>
          ))}

          {unlockedAchievements.length === 0 && (
            <HolographicDisplay className="p-8 rounded-xl text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">No achievements unlocked yet. Keep completing quests!</p>
            </HolographicDisplay>
          )}
        </div>
      </motion.section>

      {/* Active Quests Preview */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <div className="flex items-center justify-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Zap className="w-8 h-8 text-cyan-400" />
            Active Quests
          </h2>
        </div>

        <div className="grid gap-4">
          {activeQuests.slice(0, 3).map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="dashboard-card"
            >
              <Card3D
                className="p-4 rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-cyan-400/30"
                glowColor="rgba(6, 182, 212, 0.3)"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white">{quest.title}</h3>
                  <span className="text-cyan-400 font-mono">+{quest.xp} XP</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-400/30">
                    {quest.type}
                  </span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-400/30">
                    {quest.difficulty}
                  </span>
                </div>
              </Card3D>
            </motion.div>
          ))}

          {activeQuests.length === 0 && (
            <HolographicDisplay className="p-8 rounded-xl text-center">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">No active quests. Create some to start your adventure!</p>
            </HolographicDisplay>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}

// Helper Components
interface StatCard3DProps {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  color: string
  glowColor: string
  highlight?: boolean
}

function StatCard3D({ icon, label, value, suffix = "", color, glowColor, highlight }: StatCard3DProps) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}>
      <Card3D
        className={`p-6 rounded-xl bg-gradient-to-br ${color} border ${highlight ? "border-white/50" : "border-white/20"}`}
        glowColor={glowColor}
      >
        <div className="text-center">
          <div className="text-white mb-3 flex justify-center">{icon}</div>
          <p className="text-white/80 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
        </div>
      </Card3D>
    </motion.div>
  )
}

interface StatDisplayProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatDisplay({ icon, label, value, color }: StatDisplayProps) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <FuturisticProgressBar
        value={value}
        max={100}
        color={color as any}
        animated={true}
        showPercentage={false}
        className="mb-2"
      />
      <p className="text-white font-mono">
        <AnimatedCounter value={value} />
      </p>
    </div>
  )
}

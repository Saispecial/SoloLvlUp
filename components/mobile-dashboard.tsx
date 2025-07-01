"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Trophy, Zap, Target, Award, CheckCircle2, Flame, TrendingUp } from "lucide-react"
import type { PlayerProfile, Quest, Achievement } from "@/lib/types"
import { ResponsiveCard } from "./responsive-card"
import { AnimatedCounter } from "./animated-counter"

interface MobileDashboardProps {
  player: PlayerProfile
  quests: Quest[]
  achievements: Achievement[]
}

export function MobileDashboard({ player, quests, achievements }: MobileDashboardProps) {
  const completedQuests = quests.filter((q) => q.completed)
  const activeQuests = quests.filter((q) => !q.completed)
  const unlockedAchievements = achievements.filter((a) => a.unlocked)

  const todayCompleted = completedQuests.filter(
    (q) => q.completedAt && new Date(q.completedAt).toDateString() === new Date().toDateString(),
  )

  return (
    <div className="space-y-6 pb-24 pt-20">
      {/* Hero Section - Mobile Optimized */}
      <ResponsiveCard
        className="text-center bg-gradient-to-br from-themed-primary/20 to-themed-accent/20"
        mobileClassName="mx-4"
        padding="lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center"
        >
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
          Welcome, {player.name}
        </h1>

        <div className="flex items-center justify-center gap-2 text-base sm:text-lg">
          <span className="text-cyan-400 font-mono">Level</span>
          <AnimatedCounter value={player.level} className="text-xl sm:text-2xl font-bold text-white" />
          <span className="text-gray-400">•</span>
          <span className="text-purple-400 font-mono">{player.rank} Hunter</span>
        </div>
      </ResponsiveCard>

      {/* XP Progress - Mobile Optimized */}
      <ResponsiveCard mobileClassName="mx-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-themed-text">Experience Progress</span>
            <span className="text-sm font-mono text-themed-accent">
              <AnimatedCounter value={player.xp} /> / {player.nextLevelXp} XP
            </span>
          </div>

          <div className="w-full h-3 bg-themed-background rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(player.xp / player.nextLevelXp) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </ResponsiveCard>

      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <MobileStatCard
          icon={<Flame className="w-5 h-5" />}
          label="Streak"
          value={`${player.streak}`}
          suffix=" days"
          color="from-orange-400 to-red-500"
          highlight={player.streak > 0}
        />
        <MobileStatCard
          icon={<Zap className="w-5 h-5" />}
          label="Active"
          value={activeQuests.length}
          color="from-yellow-400 to-orange-500"
        />
        <MobileStatCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Completed"
          value={completedQuests.length}
          color="from-green-400 to-emerald-500"
        />
        <MobileStatCard
          icon={<Target className="w-5 h-5" />}
          label="Skill Points"
          value={player.skillPoints}
          color="from-purple-400 to-pink-500"
        />
      </div>

      {/* Today's Progress */}
      <ResponsiveCard mobileClassName="mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-themed-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-themed-accent" />
            Today's Progress
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              <AnimatedCounter value={todayCompleted.length} />
            </div>
            <div className="text-sm text-themed-text opacity-60">Quests Done</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              <AnimatedCounter value={todayCompleted.reduce((sum, q) => sum + q.xp, 0)} />
            </div>
            <div className="text-sm text-themed-text opacity-60">XP Earned</div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Recent Achievements - Mobile Optimized */}
      <ResponsiveCard mobileClassName="mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-themed-text flex items-center gap-2">
            <Award className="w-5 h-5 text-themed-accent" />
            Recent Achievements
          </h3>
        </div>

        <div className="space-y-3">
          {unlockedAchievements.slice(-2).map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-400/30"
            >
              <span className="text-2xl">{achievement.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-green-400 truncate">{achievement.title}</h4>
                <p className="text-sm text-gray-300 truncate">{achievement.description}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            </motion.div>
          ))}

          {unlockedAchievements.length === 0 && (
            <div className="text-center py-6">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-gray-400 text-sm">No achievements yet. Keep going!</p>
            </div>
          )}
        </div>
      </ResponsiveCard>

      {/* Active Quests Preview - Mobile Optimized */}
      <ResponsiveCard mobileClassName="mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-themed-text flex items-center gap-2">
            <Zap className="w-5 h-5 text-themed-accent" />
            Active Quests
          </h3>
        </div>

        <div className="space-y-3">
          {activeQuests.slice(0, 3).map((quest, index) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-themed-surface border border-themed-border"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-themed-text truncate flex-1">{quest.title}</h4>
                <span className="text-cyan-400 font-mono text-sm ml-2">+{quest.xp} XP</span>
              </div>
              <p className="text-sm text-themed-text opacity-60 line-clamp-2">{quest.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">{quest.type}</span>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">{quest.difficulty}</span>
              </div>
            </motion.div>
          ))}

          {activeQuests.length === 0 && (
            <div className="text-center py-6">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-gray-400 text-sm">No active quests. Create some!</p>
            </div>
          )}
        </div>
      </ResponsiveCard>
    </div>
  )
}

// Helper Component
interface MobileStatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  color: string
  highlight?: boolean
}

function MobileStatCard({ icon, label, value, suffix = "", color, highlight }: MobileStatCardProps) {
  return (
    <ResponsiveCard
      className={`text-center bg-gradient-to-br ${color} ${highlight ? "ring-2 ring-white/50" : ""}`}
      hover3D={false}
    >
      <div className="text-white mb-2 flex justify-center">{icon}</div>
      <p className="text-white/80 text-xs mb-1">{label}</p>
      <p className="text-lg font-bold text-white">
        <AnimatedCounter value={typeof value === "number" ? value : 0} suffix={suffix} />
        {typeof value === "string" ? value : ""}
      </p>
    </ResponsiveCard>
  )
}

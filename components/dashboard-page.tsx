"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Trophy, Zap, Star, Target, Award, CheckCircle2, Flame } from "lucide-react"
import type { PlayerProfile, Quest, Achievement } from "@/lib/types"

interface DashboardPageProps {
  player: PlayerProfile
  quests: Quest[]
  achievements: Achievement[]
}

export function DashboardPage({ player, quests, achievements }: DashboardPageProps) {
  const completedQuests = quests.filter((q) => q.completed)
  const activeQuests = quests.filter((q) => !q.completed)
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
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.header className="text-center" variants={itemVariants}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--primary)] flex items-center justify-center"
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2 text-[var(--text)]">Welcome, {player.name}</h1>
        <p className="text-[var(--text)] opacity-60">
          Level {player.level} • {player.rank} Hunter
        </p>
      </motion.header>

      <motion.div className="bg-[var(--surface)] rounded-lg p-6 border border-[var(--border)]" variants={itemVariants}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[var(--text)] opacity-60">Experience Progress</span>
          <span className="text-sm font-medium text-[var(--text)]">
            {player.xp} / {player.nextLevelXp} XP
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--background)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${(player.xp / player.nextLevelXp) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-2 gap-4" variants={containerVariants}>
        <StatCard
          icon={<Flame className="w-6 h-6" />}
          label="Streak"
          value={`${player.streak} day${player.streak !== 1 ? "s" : ""}`}
          highlight={player.streak > 0}
        />
        <StatCard icon={<Zap className="w-6 h-6" />} label="Active Quests" value={activeQuests.length} />
        <StatCard icon={<Star className="w-6 h-6" />} label="Completed" value={completedQuests.length} />
        <StatCard icon={<Target className="w-6 h-6" />} label="Skill Points" value={player.skillPoints} />
      </motion.div>

      <motion.section className="space-y-4" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text)]">Recent Achievements</h2>
          <Award className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div className="grid gap-3">
          {unlockedAchievements.slice(-3).map((achievement) => (
            <motion.div
              key={achievement.id}
              className="flex items-center gap-3 p-4 rounded-lg border bg-[var(--primary)]/10 border-[var(--primary)]/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl">{achievement.icon}</span>
              <div>
                <h3 className="font-medium text-[var(--text)]">{achievement.title}</h3>
                <p className="text-sm text-[var(--text)] opacity-60">{achievement.description}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
            </motion.div>
          ))}
          {unlockedAchievements.length === 0 && (
            <p className="text-[var(--text)] opacity-60 text-center py-4">
              No achievements unlocked yet. Keep completing quests!
            </p>
          )}
        </div>
      </motion.section>

      <motion.section className="space-y-4" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text)]">Active Quests</h2>
          <Zap className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div className="grid gap-3">
          {activeQuests.slice(0, 3).map((quest) => (
            <motion.div
              key={quest.id}
              className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[var(--text)]">{quest.title}</h3>
                <span className="text-sm text-[var(--accent)]">+{quest.xp} XP</span>
              </div>
              <p className="text-sm text-[var(--text)] opacity-60">{quest.description}</p>
            </motion.div>
          ))}
          {activeQuests.length === 0 && (
            <p className="text-[var(--text)] opacity-60 text-center py-4">
              No active quests. Create some to start your adventure!
            </p>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
}

function StatCard({ icon, label, value, highlight }: StatCardProps) {
  return (
    <motion.div
      className={`bg-[var(--surface)] rounded-lg p-4 border ${
        highlight ? "border-[var(--primary)]" : "border-[var(--border)]"
      }`}
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-3">
        <div className={highlight ? "text-[var(--primary)]" : "text-[var(--accent)]"}>{icon}</div>
        <div>
          <p className="text-sm text-[var(--text)] opacity-60">{label}</p>
          <p className={`font-semibold ${highlight ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

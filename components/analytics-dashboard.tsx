"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Brain,
  Heart,
  Dumbbell,
  Palette,
  Users,
  Zap,
  Award,
  Activity,
  LineChart,
  PieChart,
  BarChart,
  ActivityIcon,
  BookOpen,
  Sparkles,
} from "lucide-react"
import { usePlayerStore } from "@/stores/player-store"
import { AnimatedCounter } from "./animated-counter"
import { Card3D } from "./3d-card"
import { FuturisticProgressBar } from "./futuristic-progress-bar"
import type { Realm } from "@/lib/types"

interface AnalyticsDashboardProps {
  isMobile?: boolean
}

const realmIcons: Record<Realm, React.ReactNode> = {
  "Mind & Skill": <Brain className="w-5 h-5" />,
  "Emotional & Spiritual": <Heart className="w-5 h-5" />,
  "Body & Discipline": <Dumbbell className="w-5 h-5" />,
  "Creation & Mission": <Palette className="w-5 h-5" />,
  "Heart & Loyalty": <Users className="w-5 h-5" />,
}

const realmColors: Record<Realm, string> = {
  "Mind & Skill": "from-blue-400 to-cyan-500",
  "Emotional & Spiritual": "from-pink-400 to-purple-500",
  "Body & Discipline": "from-green-400 to-emerald-500",
  "Creation & Mission": "from-yellow-400 to-orange-500",
  "Heart & Loyalty": "from-red-400 to-pink-500",
}

const realmColorClasses: Record<Realm, string> = {
  "Mind & Skill": "text-blue-400",
  "Emotional & Spiritual": "text-pink-400",
  "Body & Discipline": "text-green-400",
  "Creation & Mission": "text-yellow-400",
  "Heart & Loyalty": "text-red-400",
}

export function AnalyticsDashboard({ isMobile = false }: AnalyticsDashboardProps) {
  const {
    detailedTracking,
    getPerformanceMetrics,
    getMoodTrends,
    getRealmPerformance,
    getWeeklyStats,
    getMonthlyProgress,
    player,
    quests,
    completedQuests,
    getDiaryEntries,
    reflections,
  } = usePlayerStore()

  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("7d")

  const performanceMetrics = getPerformanceMetrics()
  const moodTrends = getMoodTrends(timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 14)
  const realmPerformance = getRealmPerformance()
  const weeklyStats = getWeeklyStats()
  const monthlyProgress = getMonthlyProgress()
  const diaryEntries = getDiaryEntries()

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "mood", label: "Mood Trends", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "realms", label: "Realm Stats", icon: <Target className="w-4 h-4" /> },
    { id: "performance", label: "Performance", icon: <Activity className="w-4 h-4" /> },
    { id: "progress", label: "Progress", icon: <LineChart className="w-4 h-4" /> },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  // Generate real weekly data for charts (last 7 days)
  const getWeeklyActivityData = () => {
    const days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      days.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        dateString: date.toDateString(),
      })
    }
    return days.map(({ label, dateString }) => {
      const dayQuests = completedQuests.filter(
        (q) => q.completedAt && new Date(q.completedAt).toDateString() === dateString,
      )
      return {
        day: label,
        quests: dayQuests.length,
        xp: dayQuests.reduce((sum, q) => sum + q.xp, 0),
        // Optionally, you can add mood if you have it per day
      }
    })
  }

  const weeklyData = getWeeklyActivityData()

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Average"
          value={performanceMetrics.dailyAverage.questsCompleted.toFixed(1)}
          subtitle="Quests/Day"
          icon={<Target className="w-6 h-6" />}
          color="from-blue-400 to-cyan-500"
        />
        <MetricCard
          title="Weekly XP"
          value={weeklyStats.totalXP}
          subtitle="XP Earned"
          icon={<Zap className="w-6 h-6" />}
          color="from-yellow-400 to-orange-500"
        />
        <MetricCard
          title="Average Mood"
          value={weeklyStats.averageMood.toFixed(1)}
          subtitle="/10"
          icon={<Heart className="w-6 h-6" />}
          color="from-pink-400 to-purple-500"
        />
        <MetricCard
          title="Most Productive"
          value={weeklyStats.mostProductiveDay}
          subtitle="Day"
          icon={<Award className="w-6 h-6" />}
          color="from-green-400 to-emerald-500"
        />
      </div>

      {/* Weekly Chart */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-blue-400/30">
        <h3 className="text-lg font-semibold mb-6 text-blue-400 flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Weekly Activity
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((data, index) => (
              <div key={data.day} className="text-center">
                <div className="text-xs text-gray-400 mb-2">{data.day}</div>
                <div className="space-y-1">
                  <div className="h-16 bg-gradient-to-t from-blue-500/20 to-blue-500/40 rounded-t flex items-end justify-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-400 to-cyan-400 rounded-t"
                      style={{ height: `${(data.quests / 5) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-400 font-mono">{data.quests}</div>
                  <div className="text-xs text-gray-500">{data.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card3D>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-purple-400/30">
          <h3 className="text-lg font-semibold mb-4 text-purple-400 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Achievements
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Achievements Unlocked</span>
              <span className="text-sm font-mono text-purple-400">{monthlyProgress.achievementsUnlocked}</span>
            </div>
            <FuturisticProgressBar
              value={monthlyProgress.achievementsUnlocked}
              max={10}
              label=""
              color="purple"
              animated={true}
              showPercentage={false}
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Level Ups</span>
              <span className="text-sm font-mono text-purple-400">{monthlyProgress.levelUps}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Reflection Streak</span>
              <span className="text-sm font-mono text-purple-400">
                {(() => {
                  let consecutiveDays = 0
                  const today = new Date()

                  for (let i = 0; i < 365; i++) {
                    const checkDate = new Date(today)
                    checkDate.setDate(today.getDate() - i)
                    const dateString = checkDate.toDateString()

                    const hasReflection = reflections.some((r) => new Date(r.timestamp).toDateString() === dateString)

                    if (hasReflection) {
                      consecutiveDays++
                    } else if (i > 0) {
                      // Break on first missing day (but allow today to be missing)
                      break
                    }
                  }

                  return consecutiveDays
                })()}
              </span>
            </div>
          </div>
        </Card3D>

        <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-green-400/30">
          <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
            <ActivityIcon className="w-5 h-5" />
            Current Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Active Quests</span>
              <span className="text-sm font-mono text-green-400">{quests.filter((q) => !q.completed).length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Completed Quests</span>
              <span className="text-sm font-mono text-green-400">{completedQuests.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Current Streak</span>
              <span className="text-sm font-mono text-green-400">{player.streak} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">Total XP</span>
              <span className="text-sm font-mono text-green-400">{player.totalXp}</span>
            </div>
          </div>
        </Card3D>
      </div>
    </div>
  )

  const renderMoodTrends = () => (
    <div className="space-y-6">
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-pink-400/30">
        <h3 className="text-lg font-semibold mb-6 text-pink-400 flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          Mood & Motivation Trends
        </h3>

        {/* Mood Chart */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-300 mb-4">Motivation Level Over Time</h4>
          <div className="h-32 flex items-end justify-between gap-2">
            {moodTrends.slice(-7).map((trend, index) => (
              <div key={trend.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gradient-to-t from-pink-500/20 to-pink-500/40 rounded-t flex items-end justify-center">
                  <div
                    className="w-full bg-gradient-to-t from-pink-400 to-purple-400 rounded-t"
                    style={{ height: `${(trend.motivationLevel / 10) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood History */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-300">Recent Reflections</h4>
          {moodTrends.slice(-5).map((trend, index) => (
            <motion.div
              key={trend.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-300">{new Date(trend.date).toLocaleDateString()}</span>
                <span className="text-sm font-mono text-pink-400">
                  {trend.questsCompleted} quests, {trend.xpEarned} XP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Mood:</span>
                  <span className="ml-2 text-white">{trend.mood}</span>
                </div>
                <div>
                  <span className="text-gray-400">Emotional State:</span>
                  <span className="ml-2 text-white">{trend.emotionalState}</span>
                </div>
                <div>
                  <span className="text-gray-400">Motivation:</span>
                  <span className="ml-2 text-pink-400 font-mono">{trend.motivationLevel}/10</span>
                </div>
              </div>
            </motion.div>
          ))}

          {moodTrends.length === 0 && (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-gray-400">No mood data available. Start reflecting to see trends!</p>
            </div>
          )}
        </div>

        {/* Diary Entries Summary */}
        <div className="space-y-4 mt-8">
          <h4 className="text-md font-medium text-gray-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Diary Entries
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">Total Entries</span>
              </div>
              <span className="text-2xl font-bold text-white">{diaryEntries.length}</span>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Converted</span>
              </div>
              <span className="text-2xl font-bold text-white">
                {diaryEntries.filter((entry) => entry.convertedToReflection).length}
              </span>
            </div>
          </div>

          {diaryEntries.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-300">Recent Entries</h5>
              {diaryEntries.slice(0, 3).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-gray-800/30 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    {entry.convertedToReflection && <span className="text-xs text-green-400">✓ Converted</span>}
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{entry.content.substring(0, 100)}...</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card3D>
    </div>
  )

  const renderRealmStats = () => (
    <div className="space-y-6">
      {/* Realm Performance Overview */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-cyan-400/30">
        <h3 className="text-lg font-semibold mb-6 text-cyan-400 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Realm Performance Distribution
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(realmPerformance).map(([realm, stats]) => (
            <div key={realm} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${realmColors[realm as Realm]}`}>
                  {realmIcons[realm as Realm]}
                </div>
                <h4 className="font-semibold text-white truncate">{realm}</h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quests:</span>
                  <span className="font-mono text-white">{stats.questsCompleted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">XP:</span>
                  <span className="font-mono text-white">{stats.xpEarned}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Difficulty:</span>
                  <span className="font-mono text-white">{stats.averageDifficulty}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${realmColors[realm as Realm]}`}
                    style={{
                      width: `${(stats.questsCompleted / Math.max(...Object.values(realmPerformance).map((s) => s.questsCompleted))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card3D>

      {/* Realm Comparison Chart */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-purple-400/30">
        <h3 className="text-lg font-semibold mb-6 text-purple-400 flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Realm Comparison
        </h3>

        <div className="space-y-4">
          {Object.entries(realmPerformance).map(([realm, stats]) => (
            <div key={realm} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-300">{realm}</span>
                <span className="text-sm font-mono text-purple-400">{stats.questsCompleted} quests</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${realmColors[realm as Realm]}`}
                  style={{
                    width: `${(stats.questsCompleted / Math.max(...Object.values(realmPerformance).map((s) => s.questsCompleted))) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card3D>
    </div>
  )

  const renderPerformance = () => (
    <div className="space-y-6">
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-green-400/30">
        <h3 className="text-lg font-semibold mb-6 text-green-400 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Metrics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-300">Daily Averages</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Quests Completed</span>
                <span className="text-sm font-mono text-green-400">
                  {performanceMetrics.dailyAverage.questsCompleted.toFixed(1)}
                </span>
              </div>
              <FuturisticProgressBar
                value={performanceMetrics.dailyAverage.questsCompleted}
                max={5}
                label=""
                color="green"
                animated={true}
                showPercentage={false}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">XP Earned</span>
                <span className="text-sm font-mono text-green-400">
                  {performanceMetrics.dailyAverage.xpEarned.toFixed(1)}
                </span>
              </div>
              <FuturisticProgressBar
                value={performanceMetrics.dailyAverage.xpEarned}
                max={100}
                label=""
                color="green"
                animated={true}
                showPercentage={false}
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Streak Days</span>
                <span className="text-sm font-mono text-green-400">{performanceMetrics.dailyAverage.streakDays}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-300">Weekly Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Quests</span>
                <span className="text-sm font-mono text-green-400">{weeklyStats.totalQuests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total XP</span>
                <span className="text-sm font-mono text-green-400">{weeklyStats.totalXP}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Average Mood</span>
                <span className="text-sm font-mono text-green-400">{weeklyStats.averageMood.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Most Productive Day</span>
                <span className="text-sm font-mono text-green-400">{weeklyStats.mostProductiveDay}</span>
              </div>
            </div>
          </div>
        </div>
      </Card3D>

      {/* Performance Trends */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-blue-400/30">
        <h3 className="text-lg font-semibold mb-6 text-blue-400 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Performance Trends
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              <AnimatedCounter value={player.level} />
            </div>
            <div className="text-sm text-gray-400">Current Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              <AnimatedCounter value={player.streak} />
            </div>
            <div className="text-sm text-gray-400">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              <AnimatedCounter value={completedQuests.length} />
            </div>
            <div className="text-sm text-gray-400">Quests Completed</div>
          </div>
        </div>
      </Card3D>
    </div>
  )

  const renderProgress = () => (
    <div className="space-y-6">
      {/* Level Progress */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-yellow-400/30">
        <h3 className="text-lg font-semibold mb-6 text-yellow-400 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Level Progress
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Current Level</span>
            <span className="text-sm font-mono text-yellow-400">{player.level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Current XP</span>
            <span className="text-sm font-mono text-yellow-400">
              {player.xp} / {player.nextLevelXp}
            </span>
          </div>
          <FuturisticProgressBar
            value={player.xp}
            max={player.nextLevelXp}
            label="Level Progress"
            color="yellow"
            animated={true}
            showPercentage={true}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Total XP</span>
            <span className="text-sm font-mono text-yellow-400">{player.totalXp}</span>
          </div>
        </div>
      </Card3D>

      {/* Stats Progress */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-cyan-400/30">
        <h3 className="text-lg font-semibold mb-6 text-cyan-400 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Stats Progress
        </h3>

        <div className="space-y-4">
          {Object.entries(player.stats).map(([stat, value]) => (
            <div key={stat} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{stat}</span>
                <span className="text-sm font-mono text-cyan-400">{value}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                  style={{ width: `${(value / 100) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card3D>

      {/* Achievement Progress */}
      <Card3D className="p-6 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-purple-400/30">
        <h3 className="text-lg font-semibold mb-6 text-purple-400 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievement Progress
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-400/30">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              <AnimatedCounter value={monthlyProgress.achievementsUnlocked} />
            </div>
            <div className="text-sm text-gray-400">Achievements Unlocked</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-400/30">
            <div className="text-2xl font-bold text-green-400 mb-2">
              <AnimatedCounter value={player.streak} />
            </div>
            <div className="text-sm text-gray-400">Current Streak</div>
          </div>
        </div>
      </Card3D>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview()
      case "mood":
        return renderMoodTrends()
      case "realms":
        return renderRealmStats()
      case "performance":
        return renderPerformance()
      case "progress":
        return renderProgress()
      default:
        return renderOverview()
    }
  }

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* User Details */}
      <UserDetails player={player} />
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
          Advanced Analytics
        </h2>
        <p className="text-gray-400">Track your progress and discover insights about your journey</p>
      </motion.div>
      {/* Time Range Selector */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1">
          {["7d", "14d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range ? "bg-themed-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-themed-primary text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>{renderContent()}</motion.div>
    </motion.div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color: string
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  return (
    <Card3D className="p-4 rounded-xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>{icon}</div>
        <span className="text-sm text-gray-400">{subtitle}</span>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <p className="text-xl font-bold text-white">
          {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
        </p>
      </div>
    </Card3D>
  )
}

function UserDetails({ player }: { player: any }) {
  const [now, setNow] = React.useState(new Date())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-cyan-400/30 rounded-xl p-4 mb-2 shadow">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-cyan-400">Hunter Name:</span>
        <span className="text-lg font-mono text-white">{player?.name || "Unknown"}</span>
      </div>
      <div className="mt-2 md:mt-0 flex items-center gap-2">
        <span className="text-cyan-400 font-semibold">Accessed:</span>
        <span className="text-white font-mono">
          {now.toLocaleDateString()} {now.toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

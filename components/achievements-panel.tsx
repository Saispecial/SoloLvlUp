"use client"

import { Award, CheckCircle2, Calendar, Clock, Trophy, Zap, Star, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import type { Achievement, Quest } from "@/lib/types"

interface AchievementsPanelProps {
  achievements: Achievement[]
  completedQuests?: Quest[]
}

export function AchievementsPanel({ achievements, completedQuests = [] }: AchievementsPanelProps) {
  const [activeSection, setActiveSection] = useState<"achievements" | "completed-quests">("achievements")
  const [questFilter, setQuestFilter] = useState<"all" | "today" | "week" | "month">("all")

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  // Filter completed quests based on selected timeframe
  const getFilteredQuests = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return completedQuests
      .filter((quest) => {
        if (!quest.completedAt) return false
        const completedDate = new Date(quest.completedAt)

        switch (questFilter) {
          case "today":
            return completedDate >= today
          case "week":
            return completedDate >= weekAgo
          case "month":
            return completedDate >= monthAgo
          default:
            return true
        }
      })
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
  }

  const filteredQuests = getFilteredQuests()

  const difficultyColors = {
    Easy: "bg-green-500",
    Medium: "bg-yellow-500",
    Hard: "bg-red-500",
    "Life Achievement": "bg-purple-500",
  }

  const typeColors = {
    Daily: "bg-blue-500",
    Normal: "bg-gray-500",
    Weekly: "bg-green-500",
    Main: "bg-purple-500",
  }

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }

  const getTotalXpEarned = () => {
    return filteredQuests.reduce((total, quest) => total + quest.xp, 0)
  }

  const getQuestsByRealm = () => {
    const realmCounts: Record<string, number> = {}
    filteredQuests.forEach((quest) => {
      realmCounts[quest.realm] = (realmCounts[quest.realm] || 0) + 1
    })
    return realmCounts
  }

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex items-center justify-center">
        <div className="bg-themed-surface rounded-lg p-1 border border-themed-border">
          <button
            onClick={() => setActiveSection("achievements")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeSection === "achievements"
                ? "bg-themed-primary text-white"
                : "text-themed-text opacity-70 hover:opacity-100"
            }`}
          >
            <Award className="w-4 h-4" />
            Achievements
          </button>
          <button
            onClick={() => setActiveSection("completed-quests")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeSection === "completed-quests"
                ? "bg-themed-primary text-white"
                : "text-themed-text opacity-70 hover:opacity-100"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Completed Quests ({completedQuests.length})
          </button>
        </div>
      </div>

      {activeSection === "achievements" ? (
        /* Achievements Section */
        <div className="card-themed p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-themed-text flex items-center gap-2">
              <Award className="w-6 h-6 text-themed-accent" />
              Achievements
            </h2>
            <Badge variant="outline" className="border-themed-border text-themed-text">
              {unlockedCount}/{totalCount}
            </Badge>
          </div>

          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  achievement.unlocked ? "achievement-card unlocked" : "achievement-card border-themed-border"
                }`}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <h3
                    className={`font-medium ${achievement.unlocked ? "text-themed-text" : "text-themed-text opacity-60"}`}
                  >
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-themed-text opacity-60">{achievement.description}</p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-green-400 mt-1">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {achievement.unlocked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Completed Quests Section */
        <div className="space-y-6">
          {/* Quest Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-themed p-4 text-center">
              <Trophy className="w-8 h-8 text-themed-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-themed-text">{filteredQuests.length}</p>
              <p className="text-sm text-themed-text opacity-60">Quests Completed</p>
            </div>
            <div className="card-themed p-4 text-center">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-themed-text">{getTotalXpEarned()}</p>
              <p className="text-sm text-themed-text opacity-60">Total XP Earned</p>
            </div>
            <div className="card-themed p-4 text-center">
              <Star className="w-8 h-8 text-themed-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-themed-text">{Object.keys(getQuestsByRealm()).length}</p>
              <p className="text-sm text-themed-text opacity-60">Realms Explored</p>
            </div>
          </div>

          {/* Quest Filter */}
          <div className="card-themed p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-themed-text flex items-center gap-2">
                <Filter className="w-5 h-5 text-themed-accent" />
                Filter Completed Quests
              </h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "all", label: "All Time" },
                { id: "today", label: "Today" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setQuestFilter(filter.id as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    questFilter === filter.id
                      ? "bg-themed-primary text-white"
                      : "bg-themed-surface text-themed-text opacity-70 hover:opacity-100 border border-themed-border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Realm Distribution */}
          {filteredQuests.length > 0 && (
            <div className="card-themed p-4">
              <h3 className="text-lg font-semibold text-themed-text mb-4">Quest Distribution by Realm</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(getQuestsByRealm()).map(([realm, count]) => (
                  <div key={realm} className="bg-themed-surface p-3 rounded-lg border border-themed-border">
                    <p className="font-medium text-themed-text">{realm}</p>
                    <p className="text-sm text-themed-accent">
                      {count} quest{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Quests List */}
          <div className="card-themed p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-themed-text flex items-center gap-2">
                <Trophy className="w-6 h-6 text-themed-accent" />
                Completed Quests
                {questFilter !== "all" && (
                  <span className="text-sm opacity-60">
                    ({questFilter === "today" ? "Today" : questFilter === "week" ? "This Week" : "This Month"})
                  </span>
                )}
              </h2>
              <Badge variant="outline" className="border-themed-border text-themed-text">
                {filteredQuests.length} quest{filteredQuests.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {filteredQuests.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-themed-text opacity-40 mx-auto mb-4" />
                <p className="text-themed-text opacity-60">
                  {questFilter === "all"
                    ? "No completed quests yet. Start completing quests to see them here!"
                    : `No quests completed ${questFilter === "today" ? "today" : questFilter === "week" ? "this week" : "this month"}.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuests.map((quest) => {
                  const dateTime = formatDateTime(new Date(quest.completedAt!))
                  return (
                    <div
                      key={quest.id}
                      className="bg-themed-surface p-4 rounded-lg border border-themed-border hover:border-themed-accent/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-themed-text mb-1">{quest.title}</h3>
                          <p className="text-sm text-themed-text opacity-80 mb-2">{quest.description}</p>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${typeColors[quest.type]} text-white text-xs`}>{quest.type}</Badge>
                            <Badge className={`${difficultyColors[quest.difficulty]} text-white text-xs`}>
                              {quest.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-themed-border text-themed-text">
                              {quest.realm}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-lg font-bold text-yellow-500 mb-1">+{quest.xp} XP</div>
                          <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-themed-text opacity-60 pt-2 border-t border-themed-border">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{dateTime.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{dateTime.time}</span>
                          </div>
                        </div>

                        {quest.statBoosts && Object.values(quest.statBoosts).some((boost) => boost && boost > 0) && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-themed-accent" />
                            <span className="text-themed-accent">
                              Stat Boosts:{" "}
                              {Object.entries(quest.statBoosts)
                                .filter(([_, boost]) => boost && boost > 0)
                                .map(([stat, boost]) => `${stat} +${boost}`)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

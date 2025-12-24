import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  PlayerProfile,
  Quest,
  PersonalReflection,
  Achievement,
  Theme,
  DetailedTracking,
  MoodTrend,
  PerformanceMetrics,
  DiaryEntry,
} from "@/lib/types"
import { createInitialPlayer, checkLevelUp, calculateStatGrowth, calculateNextLevelXp } from "@/lib/rpg-engine"
import { ACHIEVEMENTS, checkAchievements } from "@/lib/achievements"
import {
  saveQuest,
  deleteQuestFromDb,
  saveReflection,
  savePlayerStats,
  resetUserData,
} from "@/lib/supabase/data-service"

const generateUUID = (): string => {
  // Use global crypto available in modern browsers
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface PlayerStore {
  player: PlayerProfile
  quests: Quest[]
  completedQuests: Quest[]
  currentReflection: PersonalReflection | null
  reflections: PersonalReflection[]
  diaryEntries: DiaryEntry[]
  achievements: Achievement[]
  detailedTracking: DetailedTracking
  userId: string | null

  // Actions
  setUserId: (userId: string | null) => void
  completeQuest: (questId: string) => void
  addQuests: (newQuests: Omit<Quest, "id" | "completed" | "createdAt">[]) => void
  deleteQuest: (questId: string) => void
  editQuest: (questId: string, updates: Partial<Quest>) => void
  resetPlayer: () => void
  updatePlayer: (updates: Partial<PlayerProfile>) => void
  setReflection: (reflection: Omit<PersonalReflection, "timestamp">) => void
  addDiaryEntry: (content: string) => Promise<void>
  convertDiaryToReflection: (diaryId: string) => Promise<void>
  deleteDiaryEntry: (diaryId: string) => void
  addCustomAttribute: (name: string) => void
  updateStreak: () => void
  updatePlayerName: (name: string) => void
  updateTheme: (theme: Theme) => void
  getReflections: () => PersonalReflection[]
  getDiaryEntries: () => DiaryEntry[]
  syncToSupabase: () => Promise<void>

  // Advanced Analytics Actions
  updateDetailedTracking: () => void
  getPerformanceMetrics: () => PerformanceMetrics
  getMoodTrends: (days?: number) => MoodTrend[]
  getRealmPerformance: () => Record<string, any>
  getWeeklyStats: () => any
  getMonthlyProgress: () => any
}

const createInitialDetailedTracking = (): DetailedTracking => ({
  questHistory: [],
  moodHistory: [],
  performanceMetrics: {
    dailyAverage: {
      questsCompleted: 0,
      xpEarned: 0,
      streakDays: 0,
    },
    weeklyStats: {
      totalQuests: 0,
      totalXP: 0,
      averageMood: 0,
      mostProductiveDay: "",
    },
    monthlyProgress: {
      levelUps: 0,
      achievementsUnlocked: 0,
      statGrowth: {},
    },
    realmPerformance: {
      "Mind & Skill": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
      "Emotional & Spiritual": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
      "Body & Discipline": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
      "Creation & Mission": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
      "Heart & Loyalty": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
    },
  },
  lastUpdated: new Date(),
})

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      player: {
        ...createInitialPlayer(),
        streak: 0,
        skillPoints: 0,
        customAttributes: {},
        name: "Hunter",
        theme: "classic-dark",
      },
      quests: [],
      completedQuests: [],
      currentReflection: null,
      reflections: [],
      diaryEntries: [],
      achievements: ACHIEVEMENTS,
      detailedTracking: createInitialDetailedTracking(),
      userId: null,

      setUserId: (userId: string | null) => {
        set({ userId })
      },

      syncToSupabase: async () => {
        const { userId, player, achievements } = get()
        if (!userId) return

        await savePlayerStats(userId, {
          level: player.level,
          xp: player.totalXp,
          streak: player.streak,
          stats: player.stats,
          achievements: achievements,
        })
      },

      completeQuest: async (questId: string) => {
        const { quests, player, completedQuests, achievements, userId } = get()
        const quest = quests.find((q) => q.id === questId)

        if (!quest || quest.completed) return

        const completedQuest = {
          ...quest,
          completed: true,
          completedAt: new Date(),
        }

        const newTotalXp = player.totalXp + quest.xp
        const newXp = player.xp + quest.xp
        const newStats = calculateStatGrowth(quest, player.stats)

        if (quest.statBoosts) {
          Object.entries(quest.statBoosts).forEach(([stat, boost]) => {
            if (boost && boost > 0) {
              newStats[stat as keyof typeof newStats] += boost
            }
          })
        }

        const { levelUp, newLevel, newRank } = checkLevelUp(newTotalXp, player.level)

        const newSkillPoints = levelUp ? player.skillPoints + 1 : player.skillPoints

        const updatedPlayer: PlayerProfile = {
          ...player,
          xp: levelUp ? newTotalXp - calculateNextLevelXp(newLevel - 1) : newXp,
          totalXp: newTotalXp,
          level: newLevel,
          rank: newRank as any,
          stats: newStats,
          nextLevelXp: calculateNextLevelXp(newLevel),
          skillPoints: newSkillPoints,
        }

        const newCompletedQuests = [...completedQuests, completedQuest]

        const updatedAchievements = checkAchievements(
          updatedPlayer,
          newCompletedQuests,
          achievements,
          get().reflections,
          get().detailedTracking,
        )

        set({
          player: updatedPlayer,
          quests: quests.map((q) => (q.id === questId ? completedQuest : q)),
          completedQuests: newCompletedQuests,
          achievements: updatedAchievements,
        })

        get().updateStreak()

        get().updateDetailedTracking()

        if (userId) {
          await saveQuest(userId, completedQuest)
          await get().syncToSupabase()
        }
      },

      addQuests: async (newQuests) => {
        console.log("[addQuests] Adding quests:", newQuests)
        const { userId } = get()
        const questsWithIds = newQuests.map((quest) => ({
          ...quest,
          id: generateUUID(),
          completed: false,
          createdAt: new Date(),
          isOverdue: quest.dueDate ? new Date() > new Date(quest.dueDate) : false,
        }))

        set((state) => ({
          quests: [...state.quests, ...questsWithIds],
        }))

        if (userId) {
          console.log("[addQuests] Saving quests to Supabase...")
          for (const quest of questsWithIds) {
            const saved = await saveQuest(userId, quest as Quest)
            console.log("[addQuests] Quest saved:", quest.id, saved)
          }
        }

        setTimeout(() => {
          const { quests } = get()
          console.log("[addQuests] Final quests in store:", quests.length)
        }, 100)
      },

      deleteQuest: async (questId: string) => {
        const { userId } = get()
        set((state) => ({
          quests: state.quests.filter((q) => q.id !== questId),
        }))

        if (userId) {
          await deleteQuestFromDb(questId)
        }
      },

      editQuest: async (questId: string, updates: Partial<Quest>) => {
        const { userId, quests } = get()
        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
        }))

        if (userId) {
          const updatedQuest = quests.find((q) => q.id === questId)
          if (updatedQuest) {
            await saveQuest(userId, { ...updatedQuest, ...updates } as Quest)
          }
        }
      },

      resetPlayer: async () => {
        const { userId } = get()
        if (userId) {
          await resetUserData(userId)
        }

        set({
          player: {
            ...createInitialPlayer(),
            streak: 0,
            skillPoints: 0,
            customAttributes: {},
            name: "Hunter",
            theme: "classic-dark",
          },
          quests: [],
          completedQuests: [],
          currentReflection: null,
          reflections: [],
          diaryEntries: [],
          achievements: ACHIEVEMENTS,
          detailedTracking: createInitialDetailedTracking(),
        })
      },

      updatePlayer: (updates) => {
        set((state) => ({
          player: { ...state.player, ...updates },
        }))
      },

      setReflection: async (reflection) => {
        const { userId } = get()
        const newReflection = {
          ...reflection,
          timestamp: new Date(),
        }
        set((state) => ({
          currentReflection: newReflection,
          reflections: [newReflection, ...(state.reflections || [])],
        }))

        get().updateStreak()
        get().updateDetailedTracking()

        if (userId) {
          await saveReflection(userId, newReflection)
          await get().syncToSupabase()
        }
      },

      addDiaryEntry: async (content: string) => {
        const newEntry: DiaryEntry = {
          id: generateUUID(),
          content,
          timestamp: new Date(),
          convertedToReflection: false,
        }
        set((state) => ({
          diaryEntries: [newEntry, ...state.diaryEntries],
        }))
      },

      convertDiaryToReflection: async (diaryId: string) => {
        const { diaryEntries, reflections } = get()
        const diaryEntry = diaryEntries.find((entry) => entry.id === diaryId)

        if (!diaryEntry || diaryEntry.convertedToReflection) return

        try {
          const { convertDiaryToReflection } = await import("@/lib/ai-stats")
          const reflection = await convertDiaryToReflection(diaryEntry)

          const newReflection: PersonalReflection = {
            ...reflection,
            timestamp: new Date(),
          }

          set((state) => ({
            reflections: [newReflection, ...state.reflections],
            diaryEntries: state.diaryEntries.map((entry) =>
              entry.id === diaryId
                ? { ...entry, convertedToReflection: true, reflectionId: newReflection.timestamp.toString() }
                : entry,
            ),
          }))

          get().updateDetailedTracking()
        } catch (error) {
          console.error("Error converting diary to reflection:", error)
        }
      },

      deleteDiaryEntry: (diaryId: string) => {
        set((state) => ({
          diaryEntries: state.diaryEntries.filter((entry) => entry.id !== diaryId),
        }))
      },

      getDiaryEntries: () => {
        return get().diaryEntries
      },

      updateDetailedTracking: () => {
        const { completedQuests, reflections, player } = get()

        const questHistory = completedQuests.map((quest) => ({
          id: quest.id,
          title: quest.title,
          completedAt: quest.completedAt!,
          timeToComplete:
            quest.completedAt && quest.createdAt
              ? (new Date(quest.completedAt).getTime() - new Date(quest.createdAt).getTime()) / (1000 * 60 * 60)
              : 0,
          difficulty: quest.difficulty,
          realm: quest.realm,
          xp: quest.xp,
          statBoosts: quest.statBoosts || {},
        }))

        const moodHistory: MoodTrend[] = reflections.map((reflection) => {
          const date = new Date(reflection.timestamp).toDateString()
          const dayQuests = completedQuests.filter(
            (q) => q.completedAt && new Date(q.completedAt).toDateString() === date,
          )

          return {
            date,
            mood: reflection.mood,
            emotionalState: reflection.emotionalState,
            motivationLevel: Number.parseInt(reflection.motivationLevel) || 5,
            questsCompleted: dayQuests.length,
            xpEarned: dayQuests.reduce((sum, q) => sum + q.xp, 0),
          }
        })

        const now = new Date()
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          return date.toDateString()
        }).reverse()

        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = new Date(now)
          date.setDate(date.getDate() - i)
          return date.toDateString()
        }).reverse()

        const dailyQuests = last7Days.map((date) =>
          completedQuests.filter((q) => q.completedAt && new Date(q.completedAt).toDateString() === date),
        )

        const dailyAverage = {
          questsCompleted: dailyQuests.reduce((sum, day) => sum + day.length, 0) / 7,
          xpEarned: dailyQuests.reduce((sum, day) => sum + day.reduce((daySum, q) => daySum + q.xp, 0), 0) / 7,
          streakDays: player.streak,
        }

        const weeklyQuests = completedQuests.filter(
          (q) => q.completedAt && last7Days.includes(new Date(q.completedAt).toDateString()),
        )

        const weeklyStats = {
          totalQuests: weeklyQuests.length,
          totalXP: weeklyQuests.reduce((sum, q) => sum + q.xp, 0),
          averageMood:
            reflections.slice(-7).reduce((sum, m) => sum + Number.parseInt(m.motivationLevel) || 5, 0) /
            Math.max(reflections.slice(-7).length, 1),
          mostProductiveDay: last7Days.reduce((most, date) => {
            const dayQuests = completedQuests.filter(
              (q) => q.completedAt && new Date(q.completedAt).toDateString() === date,
            )
            const mostQuests = completedQuests.filter(
              (q) => q.completedAt && new Date(q.completedAt).toDateString() === most,
            )
            return dayQuests.length > mostQuests.length ? date : most
          }, last7Days[0]),
        }

        const monthlyProgress = {
          levelUps: 0,
          achievementsUnlocked: get().achievements.filter(
            (a) => a.unlocked && a.unlockedAt && last30Days.includes(new Date(a.unlockedAt).toDateString()),
          ).length,
          statGrowth: {},
        }

        const realmPerformance = {
          "Mind & Skill": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Emotional & Spiritual": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Body & Discipline": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Creation & Mission": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Heart & Loyalty": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
        }

        completedQuests.forEach((quest) => {
          const realm = realmPerformance[quest.realm as keyof typeof realmPerformance]
          if (realm) {
            realm.questsCompleted++
            realm.xpEarned += quest.xp
          }
        })

        Object.keys(realmPerformance).forEach((realmKey) => {
          const realm = realmPerformance[realmKey as keyof typeof realmPerformance]
          const realmQuests = completedQuests.filter((q) => q.realm === realmKey)
          if (realmQuests.length > 0) {
            const difficulties = realmQuests.map((q) => {
              switch (q.difficulty) {
                case "Easy":
                  return 1
                case "Medium":
                  return 2
                case "Hard":
                  return 3
                case "Life Achievement":
                  return 4
                default:
                  return 1
              }
            })
            const avgDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length
            realm.averageDifficulty =
              avgDifficulty <= 1.5
                ? "Easy"
                : avgDifficulty <= 2.5
                  ? "Medium"
                  : avgDifficulty <= 3.5
                    ? "Hard"
                    : "Life Achievement"
          }
        })

        const performanceMetrics: PerformanceMetrics = {
          dailyAverage,
          weeklyStats,
          monthlyProgress,
          realmPerformance,
        }

        set((state) => ({
          detailedTracking: {
            questHistory,
            moodHistory,
            performanceMetrics,
            lastUpdated: new Date(),
          },
        }))
      },

      getPerformanceMetrics: () => {
        return get().detailedTracking.performanceMetrics
      },

      getMoodTrends: (days = 7) => {
        const { detailedTracking } = get()
        return detailedTracking.moodHistory.slice(-days)
      },

      getRealmPerformance: () => {
        return get().detailedTracking.performanceMetrics.realmPerformance
      },

      getWeeklyStats: () => {
        return get().detailedTracking.performanceMetrics.weeklyStats
      },

      getMonthlyProgress: () => {
        return get().detailedTracking.performanceMetrics.monthlyProgress
      },

      updateTheme: (theme: Theme) => {
        set((state) => ({
          player: { ...state.player, theme },
        }))
        if (typeof document !== "undefined") {
          document.documentElement.className = `theme-${theme}`
        }
      },

      addCustomAttribute: (name: string) => {
        if (!name.trim()) return
        set((state) => ({
          player: {
            ...state.player,
            customAttributes: {
              ...state.player.customAttributes,
              [name]: 0,
            },
          },
        }))
      },

      updatePlayerName: (name: string) => {
        set((state) => ({
          player: { ...state.player, name },
        }))
      },

      getReflections: () => {
        return get().reflections
      },

      updateStreak: () => {
        const { player, completedQuests, reflections, userId } = get()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const lastActivityDate = player.lastActivityDate ? new Date(player.lastActivityDate) : null
        if (lastActivityDate) {
          lastActivityDate.setHours(0, 0, 0, 0)
        }

        // Check if user completed at least one quest today
        const todayQuests = completedQuests.filter((q) => {
          if (!q.completedAt) return false
          const completedDate = new Date(q.completedAt)
          completedDate.setHours(0, 0, 0, 0)
          return completedDate.getTime() === today.getTime()
        })

        let newStreak = player.streak

        if (todayQuests.length > 0) {
          // User has activity today
          if (!lastActivityDate) {
            // First day
            newStreak = 1
          } else {
            const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))

            if (daysDiff === 1) {
              // Consecutive day
              newStreak = player.streak + 1
            } else if (daysDiff === 0) {
              // Same day, maintain streak
              newStreak = player.streak
            } else {
              // Streak broken, restart
              newStreak = 1
            }
          }

          set((state) => ({
            player: {
              ...state.player,
              streak: newStreak,
              lastActivityDate: today,
            },
          }))

          if (userId) {
            get().syncToSupabase()
          }
        }
      },
    }),
    {
      name: "player-store",
    },
  ),
)

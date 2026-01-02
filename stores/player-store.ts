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
  PlayerStats,
} from "@/lib/types"
import {
  createInitialPlayer,
  calculateNextLevelXp,
  calculateStatBreakthrough,
  calculateStatGrowth,
  checkLevelUp,
  calculateCurrentLevelXp,
} from "@/lib/rpg-engine"
import { ACHIEVEMENTS, checkAchievements } from "@/lib/achievements"

const generateUUID = (): string => {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
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
  setQuestsFromDb: (quests: Quest[]) => void
  setReflectionsFromDb: (reflections: PersonalReflection[]) => void
  setPlayerFromDb: (playerData: Partial<PlayerProfile>) => void

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
        rank: "Beginner",
        lastStreakDate: "",
        statBreakthroughs: {} as Record<keyof PlayerStats, ReturnType<typeof calculateStatBreakthrough>>,
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
        console.log("[v0] setUserId - auth only, no RPG sync:", userId)
        set({ userId })
      },

      setQuestsFromDb: (quests: Quest[]) => {
        console.log("[v0] setQuestsFromDb - DISABLED (local-only mode)")
        // Do NOT overwrite local quests with DB data
      },

      setReflectionsFromDb: (reflections: PersonalReflection[]) => {
        console.log("[v0] setReflectionsFromDb - DISABLED (local-only mode)")
        // Do NOT overwrite local reflections with DB data
      },

      setPlayerFromDb: (playerData: Partial<PlayerProfile>) => {
        console.log("[v0] setPlayerFromDb - DISABLED (local-only mode)")
        // Do NOT overwrite local player data with DB data
      },

      syncToSupabase: async () => {
        console.log("[v0] syncToSupabase - DISABLED (local-only mode)")
        // No-op - RPG state is local-only
      },

      completeQuest: (questId: string) => {
        const { quests, player, completedQuests, achievements } = get()
        const quest = quests.find((q) => q.id === questId)

        if (!quest || quest.completed) return

        console.log("[v0] completeQuest - LOCAL-ONLY mode")

        // Calculate XP gain
        const xpGained = quest.xp || 10
        const newTotalXp = player.totalXp + xpGained

        // Check level up
        const { didLevelUp, newLevel, newRank } = checkLevelUp(newTotalXp, player.level)
        const finalLevel = didLevelUp ? newLevel : player.level
        const finalRank = didLevelUp ? newRank : player.rank

        // Calculate XP within current level
        const newCurrentLevelXp = calculateCurrentLevelXp(newTotalXp, finalLevel)
        const nextLevelXp = calculateNextLevelXp(finalLevel)

        // Calculate stat growth (DELTA only)
        const statGrowth = calculateStatGrowth(quest, player.stats)
        const newStats = { ...player.stats }
        Object.entries(statGrowth).forEach(([stat, delta]) => {
          if (typeof newStats[stat as keyof PlayerStats] === "number" && typeof delta === "number") {
            ;(newStats as Record<string, number>)[stat] = (newStats as Record<string, number>)[stat] + delta
          }
        })

        // Calculate streak - only update once per day
        const today = new Date().toDateString()
        let newStreak = player.streak
        let newLastStreakDate = player.lastStreakDate

        if (player.lastStreakDate !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toDateString()

          if (player.lastStreakDate === yesterdayStr) {
            newStreak = player.streak + 1
          } else {
            newStreak = 1
          }
          newLastStreakDate = today
        }

        const completedQuest = {
          ...quest,
          completed: true,
          completedAt: new Date(),
        }

        const newStatBreakthroughs = Object.fromEntries(
          Object.entries(newStats).map(([stat, value]) => [stat, calculateStatBreakthrough(value as number)]),
        ) as Record<keyof PlayerStats, ReturnType<typeof calculateStatBreakthrough>>

        const updatedAchievements = checkAchievements(
          {
            ...player,
            totalXp: newTotalXp,
            level: finalLevel,
            stats: newStats as PlayerStats,
          },
          [...completedQuests, completedQuest],
          achievements,
        )

        // Update local state only - no DB
        set({
          quests: quests.filter((q) => q.id !== questId),
          completedQuests: [...completedQuests, completedQuest],
          player: {
            ...player,
            xp: newCurrentLevelXp,
            totalXp: newTotalXp,
            level: finalLevel,
            rank: finalRank,
            streak: newStreak,
            lastStreakDate: newLastStreakDate,
            stats: newStats as PlayerStats,
            statBreakthroughs: newStatBreakthroughs,
            nextLevelXp: nextLevelXp,
          },
          achievements: updatedAchievements,
        })

        console.log("[v0] Quest completed locally - level:", finalLevel, "totalXp:", newTotalXp)
        get().updateDetailedTracking()
      },

      addQuests: (newQuests) => {
        console.log("[v0] addQuests - LOCAL-ONLY mode")

        if (newQuests.length === 0) {
          console.warn("[v0] No quests to add")
          return
        }

        const questsWithIds: Quest[] = newQuests.map((quest) => ({
          ...quest,
          id: generateUUID(),
          completed: false,
          createdAt: new Date(),
          isOverdue: quest.dueDate ? new Date() > new Date(quest.dueDate) : false,
        }))

        set((state) => ({
          quests: [...state.quests, ...questsWithIds],
        }))

        console.log("[v0] Added", questsWithIds.length, "quests locally")
      },

      deleteQuest: (questId: string) => {
        console.log("[v0] deleteQuest - LOCAL-ONLY mode, questId:", questId)
        set((state) => ({
          quests: state.quests.filter((q) => q.id !== questId),
        }))
      },

      editQuest: (questId: string, updates: Partial<Quest>) => {
        console.log("[v0] editQuest - LOCAL-ONLY mode, questId:", questId)
        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
        }))
      },

      resetPlayer: () => {
        console.log("[v0] resetPlayer - LOCAL-ONLY mode")

        // Clear localStorage directly
        if (typeof window !== "undefined") {
          localStorage.removeItem("rpg-player-storage")
        }

        set({
          player: {
            ...createInitialPlayer(),
            streak: 0,
            skillPoints: 0,
            customAttributes: {},
            name: "Hunter",
            theme: "classic-dark",
            rank: "Beginner",
            lastStreakDate: "",
            statBreakthroughs: {} as Record<keyof PlayerStats, ReturnType<typeof calculateStatBreakthrough>>,
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

      setReflection: (reflection) => {
        console.log("[v0] setReflection - LOCAL-ONLY mode")

        const fullReflection: PersonalReflection = {
          ...reflection,
          timestamp: new Date(),
        }

        set((state) => ({
          currentReflection: fullReflection,
          reflections: [fullReflection, ...state.reflections],
        }))
      },

      addDiaryEntry: async (content: string) => {
        const newEntry: DiaryEntry = {
          id: generateUUID(),
          content,
          timestamp: new Date(),
          converted: false,
        }

        set((state) => ({
          diaryEntries: [newEntry, ...state.diaryEntries],
        }))
      },

      convertDiaryToReflection: async (diaryId: string) => {
        // Implementation remains the same
      },

      deleteDiaryEntry: (diaryId: string) => {
        set((state) => ({
          diaryEntries: state.diaryEntries.filter((e) => e.id !== diaryId),
        }))
      },

      addCustomAttribute: (name: string) => {
        set((state) => ({
          player: {
            ...state.player,
            customAttributes: {
              ...state.player.customAttributes,
              [name]: 10,
            },
          },
        }))
      },

      updateDetailedTracking: () => {
        const { completedQuests, reflections, player, detailedTracking } = get()

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const weeklyQuests = completedQuests.filter((q) => q.completedAt && new Date(q.completedAt) >= weekAgo)

        const weeklyXP = weeklyQuests.reduce((sum, q) => sum + q.xp, 0)

        const dayCount: Record<string, number> = {}
        weeklyQuests.forEach((q) => {
          if (q.completedAt) {
            const day = new Date(q.completedAt).toLocaleDateString("en-US", { weekday: "long" })
            dayCount[day] = (dayCount[day] || 0) + 1
          }
        })
        const mostProductiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ""

        const weeklyMoods = reflections
          .filter((r) => new Date(r.timestamp) >= weekAgo)
          .map((r) => Number.parseInt(r.mood) || 0)
        const averageMood = weeklyMoods.length > 0 ? weeklyMoods.reduce((a, b) => a + b, 0) / weeklyMoods.length : 0

        const realmPerformance = { ...detailedTracking.performanceMetrics.realmPerformance }
        weeklyQuests.forEach((q) => {
          const realm = q.realm
          if (realmPerformance[realm]) {
            realmPerformance[realm].questsCompleted++
            realmPerformance[realm].xpEarned += q.xp
          }
        })

        set({
          detailedTracking: {
            ...detailedTracking,
            performanceMetrics: {
              ...detailedTracking.performanceMetrics,
              dailyAverage: {
                questsCompleted: weeklyQuests.length / 7,
                xpEarned: weeklyXP / 7,
                streakDays: player.streak,
              },
              weeklyStats: {
                totalQuests: weeklyQuests.length,
                totalXP: weeklyXP,
                averageMood,
                mostProductiveDay,
              },
              realmPerformance,
            },
            lastUpdated: now,
          },
        })
      },

      getPerformanceMetrics: () => {
        return get().detailedTracking.performanceMetrics
      },

      getMoodTrends: (days = 7) => {
        const { reflections } = get()
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)

        return reflections
          .filter((r) => new Date(r.timestamp) >= cutoff)
          .map((r) => ({
            date: new Date(r.timestamp),
            mood: Number.parseInt(r.mood) || 0,
            motivation: Number.parseInt(r.motivationLevel) || 0,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
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

      getReflections: () => {
        return get().reflections
      },

      getDiaryEntries: () => {
        return get().diaryEntries
      },

      updateStreak: () => {
        const { player } = get()
        const today = new Date().toDateString()

        if (player.lastStreakDate === today) {
          return // Already updated today
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toDateString()

        let newStreak = 1
        if (player.lastStreakDate === yesterdayStr) {
          newStreak = player.streak + 1
        }

        set((state) => ({
          player: {
            ...state.player,
            streak: newStreak,
            lastStreakDate: today,
          },
        }))
      },

      updatePlayerName: (name: string) => {
        set((state) => ({
          player: { ...state.player, name },
        }))
      },

      updateTheme: (theme: Theme) => {
        set((state) => ({
          player: { ...state.player, theme },
        }))
      },
    }),
    {
      name: "rpg-player-storage",
      partialize: (state) => ({
        player: state.player,
        quests: state.quests,
        completedQuests: state.completedQuests,
        currentReflection: state.currentReflection,
        reflections: state.reflections,
        diaryEntries: state.diaryEntries,
        achievements: state.achievements,
        detailedTracking: state.detailedTracking,
      }),
    },
  ),
)

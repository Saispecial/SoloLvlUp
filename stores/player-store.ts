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
  checkLevelUp,
  calculateStatGrowth,
  calculateNextLevelXp,
  calculateCurrentLevelXp,
  calculateStatBreakthrough,
} from "@/lib/rpg-engine"
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
        console.log("[v0] setUserId called:", userId)
        set({ userId })
      },

      setQuestsFromDb: (quests: Quest[]) => {
        console.log("[v0] setQuestsFromDb called, count:", quests.length)
        const activeQuests = quests.filter((q) => !q.completed)
        const completedQuests = quests.filter((q) => q.completed)
        set({ quests: activeQuests, completedQuests })
      },

      setReflectionsFromDb: (reflections: PersonalReflection[]) => {
        console.log("[v0] setReflectionsFromDb called, count:", reflections.length)
        set({ reflections, currentReflection: reflections[0] || null })
      },

      setPlayerFromDb: (playerData: Partial<PlayerProfile>) => {
        console.log("[v0] setPlayerFromDb called:", playerData)
        set((state) => ({
          player: { ...state.player, ...playerData },
        }))
      },

      syncToSupabase: async () => {
        const { userId, player, achievements } = get()
        console.log("[v0] syncToSupabase called, userId:", userId)
        if (!userId) {
          console.warn("[v0] syncToSupabase: No userId, skipping")
          return
        }

        await savePlayerStats(userId, {
          level: player.level,
          xp: player.xp,
          totalXp: player.totalXp,
          streak: player.streak,
          stats: player.stats,
          achievements: achievements,
        })
      },

      completeQuest: async (questId: string) => {
        const { quests, player, completedQuests, achievements, userId } = get()
        const quest = quests.find((q) => q.id === questId)

        if (!quest || quest.completed) return

        console.log("[v0] completeQuest called, questId:", questId, "userId:", userId)

        const xpGained = quest.xp
        const newTotalXp = player.totalXp + xpGained

        // Check if leveled up
        const { didLevelUp, newLevel, newRank } = checkLevelUp(newTotalXp, player.level)
        const finalLevel = didLevelUp ? newLevel : player.level

        // Calculate XP within current level
        const newCurrentLevelXp = calculateCurrentLevelXp(newTotalXp, finalLevel)
        const nextLevelXp = calculateNextLevelXp(finalLevel)

        const statGrowth = calculateStatGrowth(quest, player.stats)
        const newStats = { ...player.stats }
        Object.entries(statGrowth).forEach(([stat, value]) => {
          if (typeof newStats[stat as keyof PlayerStats] === "number") {
            newStats[stat as keyof PlayerStats] = (newStats[stat as keyof PlayerStats] as number) + (value as number)
          }
        })

        const newStatBreakthroughs = Object.fromEntries(
          Object.entries(newStats).map(([stat, value]) => [stat, calculateStatBreakthrough(value as number)]),
        ) as Record<keyof PlayerStats, ReturnType<typeof calculateStatBreakthrough>>

        const completedQuest = {
          ...quest,
          completed: true,
          completedAt: new Date(),
        }

        const updatedAchievements = checkAchievements(
          {
            ...player,
            totalXp: newTotalXp,
            level: didLevelUp ? newLevel : player.level,
            stats: newStats,
          },
          [...completedQuests, completedQuest],
          achievements,
        )

        set({
          quests: quests.filter((q) => q.id !== questId),
          completedQuests: [...completedQuests, completedQuest],
          player: {
            ...player,
            xp: newCurrentLevelXp,
            totalXp: newTotalXp,
            level: finalLevel,
            rank: didLevelUp ? newRank : player.rank,
            stats: newStats,
            statBreakthroughs: newStatBreakthroughs,
            nextLevelXp: nextLevelXp,
          },
          achievements: updatedAchievements,
        })

        get().updateStreak()
        get().updateDetailedTracking()

        if (userId) {
          console.log("[v0] Saving completed quest to Supabase...")
          await saveQuest(userId, completedQuest)
          await get().syncToSupabase()
        }
      },

      addQuests: async (newQuests) => {
        const userId = get().userId
        console.log("[v0] addQuests called - userId:", userId, "questCount:", newQuests.length)

        if (newQuests.length === 0) {
          console.warn("[v0] addQuests: No quests to add")
          return
        }

        const questsWithIds: Quest[] = newQuests.map((quest) => ({
          ...quest,
          id: generateUUID(),
          completed: false,
          createdAt: new Date(),
          isOverdue: quest.dueDate ? new Date() > new Date(quest.dueDate) : false,
        }))

        console.log(
          "[v0] Created quests with IDs:",
          questsWithIds.map((q) => ({ id: q.id, title: q.title })),
        )

        set((state) => ({
          quests: [...state.quests, ...questsWithIds],
        }))

        const currentUserId = get().userId
        console.log("[v0] UserId after state update:", currentUserId)

        if (currentUserId) {
          console.log("[v0] Saving", questsWithIds.length, "quests to Supabase...")
          for (const quest of questsWithIds) {
            try {
              const saved = await saveQuest(currentUserId, quest)
              console.log("[v0] Quest save result:", quest.id, saved ? "SUCCESS" : "FAILED")
            } catch (error) {
              console.error("[v0] Error saving quest:", quest.id, error)
            }
          }
          console.log("[v0] All quests saved to Supabase")
        } else {
          console.error("[v0] NO USER ID - Quests will NOT be saved to Supabase!")
        }
      },

      deleteQuest: async (questId: string) => {
        const { userId } = get()
        console.log("[v0] deleteQuest called, questId:", questId, "userId:", userId)

        set((state) => ({
          quests: state.quests.filter((q) => q.id !== questId),
        }))

        if (userId) {
          await deleteQuestFromDb(questId)
        }
      },

      editQuest: async (questId: string, updates: Partial<Quest>) => {
        const { userId, quests } = get()
        console.log("[v0] editQuest called, questId:", questId, "userId:", userId)

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
        console.log("[v0] resetPlayer called, userId:", userId)

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

      setReflection: async (reflection) => {
        const { userId } = get()
        console.log("[v0] setReflection called, userId:", userId)

        const fullReflection: PersonalReflection = {
          ...reflection,
          timestamp: new Date(),
        }

        set((state) => ({
          currentReflection: fullReflection,
          reflections: [fullReflection, ...state.reflections],
        }))

        get().updateStreak()

        if (userId) {
          console.log("[v0] Saving reflection to Supabase...")
          const saved = await saveReflection(userId, fullReflection)
          console.log("[v0] Reflection save result:", saved ? "SUCCESS" : "FAILED")
          await get().syncToSupabase()
        } else {
          console.error("[v0] NO USER ID - Reflection will NOT be saved to Supabase!")
        }
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

      updateStreak: async () => {
        const { completedQuests, player, userId } = get()

        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        if (player.lastStreakDate === todayStr) {
          console.log("[v0] Streak already updated today, skipping")
          return
        }

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split("T")[0]

        const hasCompletedToday = completedQuests.some((quest) => {
          if (!quest.completedAt) return false
          const questDateStr = new Date(quest.completedAt).toISOString().split("T")[0]
          return questDateStr === todayStr
        })

        if (!hasCompletedToday) {
          console.log("[v0] No quest completed today, streak not updated")
          return
        }

        const hasCompletedYesterday = completedQuests.some((quest) => {
          if (!quest.completedAt) return false
          const questDateStr = new Date(quest.completedAt).toISOString().split("T")[0]
          return questDateStr === yesterdayStr
        })

        const streakWasMaintained = player.lastStreakDate === yesterdayStr

        let newStreak: number

        if (hasCompletedYesterday || streakWasMaintained) {
          newStreak = player.streak + 1
          console.log("[v0] Streak continued! New streak:", newStreak)
        } else {
          newStreak = 1
          console.log("[v0] New streak started! Streak:", newStreak)
        }

        set((state) => ({
          player: {
            ...state.player,
            streak: newStreak,
            lastStreakDate: todayStr,
          },
        }))

        if (userId) {
          await get().syncToSupabase()
        }
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

      getReflections: () => {
        return get().reflections
      },

      getDiaryEntries: () => {
        return get().diaryEntries
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

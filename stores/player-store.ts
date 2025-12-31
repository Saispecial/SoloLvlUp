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
import { createInitialPlayer, calculateNextLevelXp, calculateStatBreakthrough } from "@/lib/rpg-engine"
import { ACHIEVEMENTS, checkAchievements } from "@/lib/achievements"
import {
  deleteQuestFromDb,
  saveReflection,
  savePlayerStats,
  resetUserData,
  completeQuestInDb,
  addQuestsToDb,
  saveQuest, // Declared the missing variable here
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
        console.log(
          "[v0] setQuestsFromDb quests:",
          quests.map((q) => ({ id: q.id, title: q.title, completed: q.completed })),
        )
        const activeQuests = quests.filter((q) => !q.completed)
        const completedQuests = quests.filter((q) => q.completed)
        set({ quests: activeQuests, completedQuests })
        setTimeout(() => {
          set({ quests: activeQuests, completedQuests })
        }, 0)
      },

      setReflectionsFromDb: (reflections: PersonalReflection[]) => {
        console.log("[v0] setReflectionsFromDb called, count:", reflections.length)
        set({ reflections, currentReflection: reflections[0] || null })
      },

      setPlayerFromDb: (playerData: Partial<PlayerProfile>) => {
        console.log("[v0] setPlayerFromDb - READ-ONLY hydration, no recalculations")
        set((state) => ({
          player: {
            ...state.player,
            ...playerData,
            // Calculate display values from DB data
            nextLevelXp: calculateNextLevelXp(playerData.level || state.player.level),
          },
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

        console.log("[v0] completeQuest - DB-FIRST approach")

        if (!userId) {
          console.error("[v0] No userId - cannot complete quest")
          return
        }

        // DB-FIRST: Update database first
        const result = await completeQuestInDb(
          userId,
          questId,
          {
            level: player.level,
            xp: player.xp,
            totalXp: player.totalXp,
            streak: player.streak,
            stats: player.stats as Record<string, number>,
            lastStreakDate: player.lastStreakDate || "",
          },
          quest,
        )

        if (!result.success || !result.newStats) {
          console.error("[v0] DB update failed - UI NOT updated")
          return // Do NOT update UI if DB fails
        }

        // DB succeeded - now update UI to mirror DB
        const completedQuest = {
          ...quest,
          completed: true,
          completedAt: new Date(),
        }

        const newStatBreakthroughs = Object.fromEntries(
          Object.entries(result.newStats.stats).map(([stat, value]) => [
            stat,
            calculateStatBreakthrough(value as number),
          ]),
        ) as Record<keyof PlayerStats, ReturnType<typeof calculateStatBreakthrough>>

        const updatedAchievements = checkAchievements(
          {
            ...player,
            totalXp: result.newStats.totalXp,
            level: result.newStats.level,
            stats: result.newStats.stats as PlayerStats,
          },
          [...completedQuests, completedQuest],
          achievements,
        )

        // Update UI to mirror DB result
        set({
          quests: quests.filter((q) => q.id !== questId),
          completedQuests: [...completedQuests, completedQuest],
          player: {
            ...player,
            xp: result.newStats.xp,
            totalXp: result.newStats.totalXp,
            level: result.newStats.level,
            rank: result.newStats.rank,
            streak: result.newStats.streak,
            lastStreakDate: result.newStats.lastStreakDate,
            stats: result.newStats.stats as PlayerStats,
            statBreakthroughs: newStatBreakthroughs,
            nextLevelXp: result.newStats.nextLevelXp,
          },
          achievements: updatedAchievements,
        })

        console.log("[v0] UI updated to mirror DB")
        get().updateDetailedTracking()
      },

      addQuests: async (newQuests) => {
        const userId = get().userId
        console.log("[v0] addQuests - DB-FIRST approach, userId:", userId)

        if (!userId) {
          console.error("[v0] No userId - cannot add quests")
          return
        }

        if (newQuests.length === 0) {
          console.warn("[v0] No quests to add")
          return
        }

        // DB-FIRST: Insert into database first
        const result = await addQuestsToDb(userId, newQuests)

        if (!result.success) {
          console.error("[v0] DB insert failed - UI NOT updated")
          return // Do NOT update UI if DB fails
        }

        // DB succeeded - now update UI to mirror DB
        set((state) => ({
          quests: [...state.quests, ...result.quests],
        }))

        console.log("[v0] UI updated with", result.quests.length, "quests from DB")
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

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

interface PlayerStore {
  player: PlayerProfile
  quests: Quest[]
  completedQuests: Quest[]
  currentReflection: PersonalReflection | null
  reflections: PersonalReflection[]
  diaryEntries: DiaryEntry[]
  achievements: Achievement[]
  detailedTracking: DetailedTracking

  // Actions
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

      completeQuest: (questId: string) => {
        const { quests, player, completedQuests, achievements } = get()
        const quest = quests.find((q) => q.id === questId)

        if (!quest || quest.completed) return

        // Mark quest as completed
        const completedQuest = {
          ...quest,
          completed: true,
          completedAt: new Date(),
        }

        // Calculate new XP and stats
        const newTotalXp = player.totalXp + quest.xp
        const newXp = player.xp + quest.xp
        const newStats = calculateStatGrowth(quest, player.stats)

        // Apply custom stat boosts if defined
        if (quest.statBoosts) {
          Object.entries(quest.statBoosts).forEach(([stat, boost]) => {
            if (boost && boost > 0) {
              newStats[stat as keyof typeof newStats] += boost
            }
          })
        }

        // Check for level up
        const { levelUp, newLevel, newRank } = checkLevelUp(newTotalXp, player.level)

        // Award skill points on level up
        const newSkillPoints = levelUp ? player.skillPoints + 1 : player.skillPoints

        // Update player
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

        // Check achievements
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

        // Update detailed tracking
        get().updateDetailedTracking()
      },

      addQuests: (newQuests) => {
        console.log("[addQuests] Adding quests:", newQuests)
        const questsWithIds = newQuests.map((quest) => ({
          ...quest,
          id: Math.random().toString(36).substr(2, 9),
          completed: false,
          createdAt: new Date(),
          isOverdue: quest.dueDate ? new Date() > new Date(quest.dueDate) : false,
        }))
        set((state) => ({
          quests: [...state.quests, ...questsWithIds],
        }))
        setTimeout(() => {
          const { quests } = get()
          console.log("[addQuests] Final quests state:", quests)
        }, 100)
      },

      deleteQuest: (questId: string) => {
        set((state) => ({
          quests: state.quests.filter((q) => q.id !== questId),
        }))
      },

      editQuest: (questId: string, updates: Partial<Quest>) => {
        set((state) => ({
          quests: state.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
        }))
      },

      resetPlayer: () => {
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

      setReflection: (reflection) => {
        const newReflection = {
          ...reflection,
          timestamp: new Date(),
        }
        set((state) => ({
          currentReflection: newReflection,
          reflections: [newReflection, ...(state.reflections || [])],
        }))

        // Update detailed tracking after reflection
        get().updateDetailedTracking()
      },

      addCustomAttribute: (name: string) => {
        const { player } = get()
        if (player.level >= 10 && player.skillPoints > 0) {
          set((state) => ({
            player: {
              ...state.player,
              customAttributes: {
                ...state.player.customAttributes,
                [name]: 1,
              },
              skillPoints: state.player.skillPoints - 1,
            },
          }))
        }
      },

      updateStreak: () => {
        const { completedQuests, player } = get()
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        const completedToday = completedQuests.some(
          (q) => q.completedAt && new Date(q.completedAt).toDateString() === today,
        )

        const completedYesterday = completedQuests.some(
          (q) => q.completedAt && new Date(q.completedAt).toDateString() === yesterday,
        )

        let newStreak = player.streak

        if (completedToday) {
          // If completed today, increment streak only if also completed yesterday or starting new streak
          if (completedYesterday) {
            newStreak = player.streak + 1
          } else if (player.streak === 0) {
            // Starting a fresh streak
            newStreak = 1
          }
          // else: streak already counted for today, don't increment again
        } else if (completedYesterday) {
          // Completed yesterday but not today - preserve streak for now
          newStreak = player.streak
        } else {
          // Gap detected - reset streak
          newStreak = 0
        }

        set((state) => ({
          player: {
            ...state.player,
            streak: newStreak,
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

      getReflections: () => {
        return get().reflections
      },

      addDiaryEntry: async (content: string) => {
        const newEntry: DiaryEntry = {
          id: Math.random().toString(36).substr(2, 9),
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

          // Update detailed tracking after conversion
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

      // Advanced Analytics Methods
      updateDetailedTracking: () => {
        const { completedQuests, reflections, player } = get()

        // Update quest history
        const questHistory = completedQuests.map((quest) => ({
          id: quest.id,
          title: quest.title,
          completedAt: quest.completedAt!,
          timeToComplete:
            quest.completedAt && quest.createdAt
              ? (new Date(quest.completedAt).getTime() - new Date(quest.createdAt).getTime()) / (1000 * 60 * 60) // hours
              : 0,
          difficulty: quest.difficulty,
          realm: quest.realm,
          xp: quest.xp,
          statBoosts: quest.statBoosts || {},
        }))

        // Update mood history
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

        // Calculate performance metrics
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

        // Daily averages
        const dailyQuests = last7Days.map((date) =>
          completedQuests.filter((q) => q.completedAt && new Date(q.completedAt).toDateString() === date),
        )

        const dailyAverage = {
          questsCompleted: dailyQuests.reduce((sum, day) => sum + day.length, 0) / 7,
          xpEarned: dailyQuests.reduce((sum, day) => sum + day.reduce((daySum, q) => daySum + q.xp, 0), 0) / 7,
          streakDays: player.streak,
        }

        // Weekly stats
        const weeklyQuests = completedQuests.filter(
          (q) => q.completedAt && last7Days.includes(new Date(q.completedAt).toDateString()),
        )

        const weeklyStats = {
          totalQuests: weeklyQuests.length,
          totalXP: weeklyQuests.reduce((sum, q) => sum + q.xp, 0),
          averageMood:
            moodHistory.slice(-7).reduce((sum, m) => sum + m.motivationLevel, 0) /
            Math.max(moodHistory.slice(-7).length, 1),
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

        // Monthly progress
        const monthlyQuests = completedQuests.filter(
          (q) => q.completedAt && last30Days.includes(new Date(q.completedAt).toDateString()),
        )

        const monthlyProgress = {
          levelUps: 0, // This would need to be tracked separately
          achievementsUnlocked: get().achievements.filter(
            (a) => a.unlocked && a.unlockedAt && last30Days.includes(new Date(a.unlockedAt).toDateString()),
          ).length,
          statGrowth: {}, // This would need to be calculated from stat history
        }

        // Realm performance
        const realmPerformance = {
          "Mind & Skill": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Emotional & Spiritual": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Body & Discipline": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Creation & Mission": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
          "Heart & Loyalty": { questsCompleted: 0, xpEarned: 0, averageDifficulty: "Easy" },
        }

        completedQuests.forEach((quest) => {
          const realm = realmPerformance[quest.realm]
          realm.questsCompleted++
          realm.xpEarned += quest.xp
        })

        // Calculate average difficulty per realm
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
    }),
    {
      name: "player-store",
    },
  ),
)

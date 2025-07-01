import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PlayerProfile, Quest, PersonalReflection, Achievement, Theme } from "@/lib/types"
import { createInitialPlayer, checkLevelUp, calculateStatGrowth, calculateNextLevelXp } from "@/lib/rpg-engine"
import { ACHIEVEMENTS, checkAchievements } from "@/lib/achievements"

interface PlayerStore {
  player: PlayerProfile
  quests: Quest[]
  completedQuests: Quest[]
  currentReflection: PersonalReflection | null
  reflections: PersonalReflection[]
  achievements: Achievement[]

  // Actions
  completeQuest: (questId: string) => void
  addQuests: (newQuests: Omit<Quest, "id" | "completed" | "createdAt">[]) => void
  deleteQuest: (questId: string) => void
  editQuest: (questId: string, updates: Partial<Quest>) => void
  resetPlayer: () => void
  updatePlayer: (updates: Partial<PlayerProfile>) => void
  setReflection: (reflection: Omit<PersonalReflection, "timestamp">) => void
  addCustomAttribute: (name: string) => void
  updateStreak: () => void
  updatePlayerName: (name: string) => void
  updateTheme: (theme: Theme) => void
  getReflections: () => PersonalReflection[]
}

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
      achievements: ACHIEVEMENTS,

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
        const updatedAchievements = checkAchievements(updatedPlayer, newCompletedQuests, achievements)

        set({
          player: updatedPlayer,
          quests: quests.map((q) => (q.id === questId ? completedQuest : q)),
          completedQuests: newCompletedQuests,
          achievements: updatedAchievements,
        })
      },

      addQuests: (newQuests) => {
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
          achievements: ACHIEVEMENTS,
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
        const { completedQuests } = get()
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()

        const completedToday = completedQuests.some(
          (q) => q.completedAt && new Date(q.completedAt).toDateString() === today,
        )

        const completedYesterday = completedQuests.some(
          (q) => q.completedAt && new Date(q.completedAt).toDateString() === yesterday,
        )

        set((state) => ({
          player: {
            ...state.player,
            streak: completedToday ? (completedYesterday ? state.player.streak + 1 : 1) : 0,
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
        // Apply theme to document
        document.documentElement.className = `theme-${theme}`
      },

      getReflections: () => {
        return get().reflections || []
      },
    }),
    {
      name: "sololevelup-storage",
    },
  ),
)

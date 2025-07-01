import type { Achievement, PlayerProfile, Quest } from "./types"

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_quest",
    title: "First Steps",
    description: "Complete your first quest",
    icon: "🎯",
    unlocked: false,
    requirement: { type: "quests_completed", value: 1 },
  },
  {
    id: "level_5",
    title: "Rising Hunter",
    description: "Reach level 5",
    icon: "⭐",
    unlocked: false,
    requirement: { type: "level", value: 5 },
  },
  {
    id: "level_10",
    title: "Skilled Adventurer",
    description: "Reach level 10",
    icon: "🌟",
    unlocked: false,
    requirement: { type: "level", value: 10 },
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    unlocked: false,
    requirement: { type: "streak", value: 7 },
  },
  {
    id: "streak_30",
    title: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "💎",
    unlocked: false,
    requirement: { type: "streak", value: 30 },
  },
  {
    id: "quest_master",
    title: "Quest Master",
    description: "Complete 50 quests",
    icon: "👑",
    unlocked: false,
    requirement: { type: "quests_completed", value: 50 },
  },
  {
    id: "iq_master",
    title: "Genius Mind",
    description: "Reach 50 IQ",
    icon: "🧠",
    unlocked: false,
    requirement: { type: "stat_threshold", value: 50, stat: "IQ" },
  },
  {
    id: "strength_master",
    title: "Physical Beast",
    description: "Reach 50 Strength",
    icon: "💪",
    unlocked: false,
    requirement: { type: "stat_threshold", value: 50, stat: "Strength" },
  },
  {
    id: "xp_1000",
    title: "Experience Collector",
    description: "Earn 1000 total XP",
    icon: "⚡",
    unlocked: false,
    requirement: { type: "total_xp", value: 1000 },
  },
]

export function checkAchievements(
  player: PlayerProfile,
  completedQuests: Quest[],
  achievements: Achievement[],
): Achievement[] {
  return achievements.map((achievement) => {
    if (achievement.unlocked) return achievement

    let shouldUnlock = false
    const req = achievement.requirement

    switch (req.type) {
      case "level":
        shouldUnlock = player.level >= req.value
        break
      case "quests_completed":
        shouldUnlock = completedQuests.length >= req.value
        break
      case "streak":
        shouldUnlock = player.streak >= req.value
        break
      case "stat_threshold":
        if (req.stat) {
          shouldUnlock = player.stats[req.stat] >= req.value
        }
        break
      case "total_xp":
        shouldUnlock = player.totalXp >= req.value
        break
    }

    if (shouldUnlock) {
      return {
        ...achievement,
        unlocked: true,
        unlockedAt: new Date(),
      }
    }

    return achievement
  })
}

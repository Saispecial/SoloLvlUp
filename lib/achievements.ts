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
  // New Advanced Achievements
  {
    id: "reflection_streak_7",
    title: "Mindful Master",
    description: "Complete 7 days of reflections",
    icon: "🧘",
    unlocked: false,
    requirement: { type: "reflection_streak", value: 7 },
  },
  {
    id: "reflection_streak_30",
    title: "Zen Master",
    description: "Complete 30 days of reflections",
    icon: "🕉️",
    unlocked: false,
    requirement: { type: "reflection_streak", value: 30 },
  },
  {
    id: "perfect_week",
    title: "Perfect Week",
    description: "Complete all daily quests for 7 consecutive days",
    icon: "✨",
    unlocked: false,
    requirement: { type: "perfect_week", value: 7 },
  },
  {
    id: "realm_master_mind",
    title: "Mind Realm Master",
    description: "Complete 25 Mind & Skill quests",
    icon: "🧠",
    unlocked: false,
    requirement: { type: "realm_master", value: 25, realm: "Mind & Skill" },
  },
  {
    id: "realm_master_emotional",
    title: "Emotional Realm Master",
    description: "Complete 25 Emotional & Spiritual quests",
    icon: "💖",
    unlocked: false,
    requirement: { type: "realm_master", value: 25, realm: "Emotional & Spiritual" },
  },
  {
    id: "realm_master_body",
    title: "Body Realm Master",
    description: "Complete 25 Body & Discipline quests",
    icon: "💪",
    unlocked: false,
    requirement: { type: "realm_master", value: 25, realm: "Body & Discipline" },
  },
  {
    id: "realm_master_creation",
    title: "Creation Realm Master",
    description: "Complete 25 Creation & Mission quests",
    icon: "🎨",
    unlocked: false,
    requirement: { type: "realm_master", value: 25, realm: "Creation & Mission" },
  },
  {
    id: "realm_master_heart",
    title: "Heart Realm Master",
    description: "Complete 25 Heart & Loyalty quests",
    icon: "❤️",
    unlocked: false,
    requirement: { type: "realm_master", value: 25, realm: "Heart & Loyalty" },
  },
  {
    id: "speed_runner",
    title: "Speed Runner",
    description: "Complete 10 quests within 1 hour of creation",
    icon: "⚡",
    unlocked: false,
    requirement: { type: "speed_runner", value: 10 },
  },
  {
    id: "consistency_king",
    title: "Consistency King",
    description: "Complete at least 3 quests every day for 14 days",
    icon: "👑",
    unlocked: false,
    requirement: { type: "consistency_king", value: 14 },
  },
  {
    id: "xp_5000",
    title: "XP Legend",
    description: "Earn 5000 total XP",
    icon: "🏆",
    unlocked: false,
    requirement: { type: "total_xp", value: 5000 },
  },
  {
    id: "level_25",
    title: "Elite Hunter",
    description: "Reach level 25",
    icon: "🔱",
    unlocked: false,
    requirement: { type: "level", value: 25 },
  },
  {
    id: "level_50",
    title: "Legendary Hunter",
    description: "Reach level 50",
    icon: "⚜️",
    unlocked: false,
    requirement: { type: "level", value: 50 },
  },
]

export function checkAchievements(
  player: PlayerProfile,
  completedQuests: Quest[],
  achievements: Achievement[],
  reflections: any[] = [],
  detailedTracking?: any,
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
      case "reflection_streak":
        shouldUnlock = checkReflectionStreak(reflections, req.value)
        break
      case "perfect_week":
        shouldUnlock = checkPerfectWeek(completedQuests, req.value)
        break
      case "realm_master":
        if (req.realm) {
          shouldUnlock = completedQuests.filter(q => q.realm === req.realm).length >= req.value
        }
        break
      case "speed_runner":
        shouldUnlock = checkSpeedRunner(completedQuests, req.value)
        break
      case "consistency_king":
        shouldUnlock = checkConsistencyKing(completedQuests, req.value)
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

function checkReflectionStreak(reflections: any[], requiredDays: number): boolean {
  if (reflections.length < requiredDays) return false
  
  const sortedReflections = reflections
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, requiredDays)
  
  const dates = sortedReflections.map(r => new Date(r.timestamp).toDateString())
  const uniqueDates = [...new Set(dates)]
  
  return uniqueDates.length >= requiredDays
}

function checkPerfectWeek(completedQuests: Quest[], requiredDays: number): boolean {
  const now = new Date()
  const last7Days = Array.from({ length: requiredDays }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    return date.toDateString()
  })

  return last7Days.every(date => {
    const dayQuests = completedQuests.filter(q => 
      q.completedAt && new Date(q.completedAt).toDateString() === date
    )
    return dayQuests.some(q => q.type === "Daily")
  })
}

function checkSpeedRunner(completedQuests: Quest[], requiredCount: number): boolean {
  const speedQuests = completedQuests.filter(quest => {
    if (!quest.completedAt || !quest.createdAt) return false
    const timeDiff = new Date(quest.completedAt).getTime() - new Date(quest.createdAt).getTime()
    return timeDiff <= 60 * 60 * 1000 // 1 hour in milliseconds
  })
  
  return speedQuests.length >= requiredCount
}

function checkConsistencyKing(completedQuests: Quest[], requiredDays: number): boolean {
  const now = new Date()
  const lastDays = Array.from({ length: requiredDays }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    return date.toDateString()
  })

  return lastDays.every(date => {
    const dayQuests = completedQuests.filter(q => 
      q.completedAt && new Date(q.completedAt).toDateString() === date
    )
    return dayQuests.length >= 3
  })
}

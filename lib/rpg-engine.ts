import type { PlayerProfile, PlayerStats, Quest } from "./types"

export const RANK_ORDER = ["E", "D", "C", "B", "A", "S", "S+"] as const

export function calculateNextLevelXp(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function checkLevelUp(
  currentXp: number,
  level: number,
): { levelUp: boolean; newLevel: number; newRank: string } {
  let newLevel = level
  let totalXpNeeded = 0

  while (true) {
    const xpForNextLevel = calculateNextLevelXp(newLevel)
    if (currentXp >= totalXpNeeded + xpForNextLevel) {
      totalXpNeeded += xpForNextLevel
      newLevel++
    } else {
      break
    }
  }

  const levelUp = newLevel > level
  const newRank = calculateRank(newLevel)

  return { levelUp, newLevel, newRank }
}

export function calculateRank(level: number): string {
  if (level >= 50) return "S+"
  if (level >= 40) return "S"
  if (level >= 30) return "A"
  if (level >= 20) return "B"
  if (level >= 10) return "C"
  if (level >= 5) return "D"
  return "E"
}

export function calculateStatGrowth(quest: Quest, currentStats: PlayerStats): PlayerStats {
  const newStats = { ...currentStats }
  const growthAmount = Math.floor(quest.xp / 10) || 1

  switch (quest.realm) {
    case "Mind & Skill":
      if (Math.random() > 0.5) {
        newStats.IQ += growthAmount
      } else {
        newStats["Technical Attribute"] += growthAmount
      }
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        newStats["Problem Solving"] += growthAmount
      }
      break

    case "Emotional & Spiritual":
      newStats.EQ += growthAmount
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        newStats.Aptitude += Math.floor(growthAmount / 2)
      }
      break

    case "Body & Discipline":
      newStats.Strength += growthAmount
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        newStats["Problem Solving"] += Math.floor(growthAmount / 2)
      }
      break

    case "Creation & Mission":
      newStats.Aptitude += growthAmount
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        newStats["Technical Attribute"] += Math.floor(growthAmount / 2)
      }
      break

    case "Heart & Loyalty":
      if (Math.random() > 0.5) {
        newStats.EQ += growthAmount
      } else {
        newStats.Strength += growthAmount
      }
      break
  }

  return newStats
}

export function createInitialPlayer(): PlayerProfile {
  return {
    level: 1,
    rank: "E",
    xp: 0,
    totalXp: 0,
    stats: {
      IQ: 10,
      EQ: 10,
      Strength: 10,
      "Technical Attribute": 10,
      Aptitude: 10,
      "Problem Solving": 10,
    },
    nextLevelXp: calculateNextLevelXp(1),
    streak: 0,
    skillPoints: 0,
    customAttributes: {},
    name: "Hunter",
    theme: "classic-dark",
  }
}

import type { PlayerProfile, PlayerStats, Quest, StatBreakthrough } from "./types"

export const RANK_ORDER = ["E", "D", "C", "B", "A", "S", "S+"] as const

export const STAT_TIER_NAMES = ["Base", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Legend"]
export const STAT_TIER_COLORS = [
  "text-gray-400",
  "text-orange-400",
  "text-gray-300",
  "text-yellow-400",
  "text-cyan-400",
  "text-blue-400",
  "text-purple-400",
  "text-pink-400",
]

export function calculateNextLevelXp(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function calculateTotalXpForLevel(level: number): number {
  let totalXp = 0
  for (let i = 1; i < level; i++) {
    totalXp += calculateNextLevelXp(i)
  }
  return totalXp
}

export function calculateCurrentLevelXp(totalXp: number, level: number): number {
  // Calculate XP needed to reach current level
  const xpAtCurrentLevel = calculateTotalXpForLevel(level)
  // Calculate XP for next level
  const xpForNextLevel = calculateTotalXpForLevel(level + 1)

  // If totalXp is less than what's needed for current level, return totalXp
  // This handles edge cases where data might be inconsistent
  if (totalXp < xpAtCurrentLevel) {
    return totalXp
  }

  // Return XP progress within current level
  return totalXp - xpAtCurrentLevel
}

export function checkLevelUp(
  currentXp: number,
  currentLevel: number,
): { didLevelUp: boolean; newLevel: number; newRank: string } {
  let newLevel = currentLevel
  let xpNeeded = calculateTotalXpForLevel(newLevel + 1)

  // Check if player has enough XP to level up (possibly multiple times)
  while (currentXp >= xpNeeded) {
    newLevel++
    xpNeeded = calculateTotalXpForLevel(newLevel + 1)
  }

  const didLevelUp = newLevel > currentLevel
  const newRank = calculateRank(newLevel)

  return { didLevelUp, newLevel, newRank }
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

export function calculateStatGrowth(quest: Quest, currentStats: PlayerStats): Partial<PlayerStats> {
  const statDeltas: Partial<PlayerStats> = {}
  const growthAmount = Math.floor(quest.xp / 10) || 1

  switch (quest.realm) {
    case "Mind & Skill":
      if (Math.random() > 0.5) {
        statDeltas.IQ = growthAmount
      } else {
        statDeltas["Technical Attribute"] = growthAmount
      }
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        statDeltas["Problem Solving"] = (statDeltas["Problem Solving"] || 0) + growthAmount
      }
      break

    case "Emotional & Spiritual":
      statDeltas.EQ = growthAmount
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        statDeltas.Aptitude = Math.floor(growthAmount / 2)
      }
      break

    case "Body & Discipline":
      statDeltas.Strength = growthAmount
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        statDeltas["Problem Solving"] = Math.floor(growthAmount / 2)
      }
      break

    case "Creation & Mission":
      statDeltas.Aptitude = growthAmount
      if (quest.difficulty === "Hard" || quest.difficulty === "Life Achievement") {
        statDeltas["Technical Attribute"] = Math.floor(growthAmount / 2)
      }
      break

    case "Heart & Loyalty":
      if (Math.random() > 0.5) {
        statDeltas.EQ = growthAmount
      } else {
        statDeltas.Strength = growthAmount
      }
      break
  }

  return statDeltas
}

export function calculateStatBreakthrough(statValue: number): StatBreakthrough {
  const tier = Math.floor(statValue / 100)
  const displayValue = statValue % 100
  return {
    tier,
    displayValue,
    totalValue: statValue,
  }
}

export function getStatTierInfo(breakthrough: StatBreakthrough): {
  tierName: string
  tierColor: string
  nextTierAt: number
} {
  const tierIndex = Math.min(breakthrough.tier, STAT_TIER_NAMES.length - 1)
  return {
    tierName: STAT_TIER_NAMES[tierIndex],
    tierColor: STAT_TIER_COLORS[tierIndex],
    nextTierAt: (breakthrough.tier + 1) * 100,
  }
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

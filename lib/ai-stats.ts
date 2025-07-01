import type { PlayerStats } from "./types"

export const getSuggestedStatsFromAI = async (title: string, description: string): Promise<Partial<PlayerStats>> => {
  console.log("Analyzing quest for stat suggestions:", title, description)

  const lowerTitle = title.toLowerCase()
  const lowerDescription = description.toLowerCase()
  const combinedText = `${lowerTitle} ${lowerDescription}`

  const suggestedStats: Partial<PlayerStats> = {
    IQ: 0,
    EQ: 0,
    Strength: 0,
    "Technical Attribute": 0,
    Aptitude: 0,
    "Problem Solving": 0,
  }

  const MAX_POINTS_PER_STAT = 7

  // Enhanced keyword definitions with more context-aware weights
  const keywords: Record<keyof PlayerStats, { words: string[]; weight: number; context?: string[] }[]> = {
    IQ: [
      {
        words: [
          "learn",
          "study",
          "research",
          "knowledge",
          "understand",
          "think",
          "logic",
          "reason",
          "analyze",
          "concentration",
          "memory",
          "focus",
          "mindfulness",
        ],
        weight: 1,
        context: ["deep", "thorough", "comprehensive", "advanced"],
      },
      {
        words: [
          "chess",
          "maths",
          "mathematics",
          "critical thinking",
          "deep learning",
          "neuroscience",
          "philosophy",
          "psychology",
        ],
        weight: 2,
        context: ["master", "expert", "advanced"],
      },
    ],
    Aptitude: [
      {
        words: [
          "practice",
          "skill",
          "improve",
          "master",
          "develop",
          "habit",
          "train",
          "refine",
          "perfect",
          "polish",
          "maths",
        ],
        weight: 1,
        context: ["daily", "regular", "consistent"],
      },
      {
        words: ["expert", "proficient", "advanced", "professional"],
        weight: 2,
        context: ["become", "achieve", "reach"],
      },
    ],
    "Problem Solving": [
      {
        words: [
          "debug",
          "fix",
          "solve",
          "troubleshoot",
          "optimize",
          "diagnose",
          "resolve",
          "issue",
          "bug",
          "challenge",
          "obstacle",
          "difficulty",
        ],
        weight: 1,
        context: ["complex", "difficult", "challenging"],
      },
      {
        words: ["algorithm", "pattern", "strategy", "methodology", "approach"],
        weight: 2,
        context: ["develop", "implement", "create"],
      },
    ],
    "Technical Attribute": [
      {
        words: [
          "code",
          "build",
          "develop",
          "implement",
          "test",
          "algorithm",
          "data structure",
          "system",
          "application",
        ],
        weight: 1,
        context: ["create", "build", "develop"],
      },
      {
        words: [
          "react",
          "typescript",
          "javascript",
          "python",
          "docker",
          "aws",
          "sql",
          "api",
          "css",
          "html",
          "node",
          "server",
          "database",
          "machine learning",
          "chatgpt",
          "ai",
          "cloud",
          "devops",
          "kubernetes",
        ],
        weight: 2,
        context: ["master", "learn", "implement"],
      },
    ],
    EQ: [
      {
        words: [
          "communicate",
          "empathy",
          "understand",
          "listen",
          "relationship",
          "team",
          "collaborate",
          "social",
          "emotional",
          "feelings",
        ],
        weight: 1,
        context: ["better", "improve", "develop"],
      },
      {
        words: ["leadership", "mentor", "coach", "support", "help others"],
        weight: 2,
        context: ["become", "practice", "develop"],
      },
    ],
    Strength: [
      {
        words: [
          "exercise",
          "workout",
          "gym",
          "walk",
          "stretch",
          "meditate",
          "sleep",
          "healthy",
          "nutrition",
          "diet",
          "cardio",
          "activity",
          "movement",
          "wellness",
          "fitness",
        ],
        weight: 1,
        context: ["regular", "daily", "consistent"],
      },
      {
        words: [
          "run",
          "yoga",
          "pilates",
          "strength",
          "endurance",
          "pushups",
          "squats",
          "lift weights",
          "cycling",
          "swimming",
          "hiit",
          "crossfit",
          "marathon",
        ],
        weight: 2,
        context: ["complete", "achieve", "master"],
      },
    ],
  }

  // Enhanced keyword processing with context awareness
  const processText = (text: string, isTitle: boolean) => {
    for (const [stat, keywordGroups] of Object.entries(keywords)) {
      for (const group of keywordGroups) {
        for (const keyword of group.words) {
          if (text.includes(keyword)) {
            let baseScore = group.weight * (isTitle ? 1.5 : 1)

            // Check for context words
            if (group.context) {
              const contextMatch = group.context.some(
                (context) => text.includes(context) && text.indexOf(context) < text.indexOf(keyword) + 20,
              )
              if (contextMatch) baseScore *= 1.2
            }

            // Check for intensity modifiers
            const intensityModifiers = ["very", "extremely", "highly", "intensely"]
            const hasIntensity = intensityModifiers.some(
              (mod) => text.includes(mod) && text.indexOf(mod) < text.indexOf(keyword) + 10,
            )
            if (hasIntensity) baseScore *= 1.3

            suggestedStats[stat as keyof PlayerStats] = (suggestedStats[stat as keyof PlayerStats] || 0) + baseScore
          }
        }
      }
    }
  }

  // Process title and description
  processText(lowerTitle, true)
  processText(lowerDescription, false)

  // Enhanced number extraction for health stats
  const healthKeywords = keywords.Strength.flatMap((group) => group.words)
  const numberRegex = /(\d+(\.\d+)?)\s*(?:([a-zA-Z]+)|(?:([a-zA-Z]+)\s+([a-zA-Z]+)))/g
  let match
  let totalHealthScoreFromNumbers = 0

  while ((match = numberRegex.exec(combinedText)) !== null) {
    const number = Number.parseFloat(match[1])
    const unitOrExercise = (match[3] || `${match[4]} ${match[5]}`).toLowerCase()

    if (healthKeywords.some((hk) => unitOrExercise.includes(hk) || hk.includes(unitOrExercise))) {
      let score = 0

      // Enhanced scoring based on exercise type and intensity
      if (unitOrExercise.includes("km") || unitOrExercise.includes("mile")) {
        score = number >= 10 ? 3 : number >= 5 ? 2 : 1
      } else if (unitOrExercise.includes("min") || unitOrExercise.includes("hour")) {
        score = number >= 60 ? 3 : number >= 30 ? 2 : 1
      } else if (unitOrExercise.includes("rep") || unitOrExercise.includes("set")) {
        score = number >= 50 ? 3 : number >= 25 ? 2 : 1
      } else {
        // Generic scoring for other exercises
        score = number >= 100 ? 3 : number >= 50 ? 2 : 1
      }

      // Adjust score based on exercise intensity
      const intensityWords = ["sprint", "fast", "intense", "heavy", "max"]
      if (intensityWords.some((word) => combinedText.includes(word))) {
        score = Math.min(score + 1, 3)
      }

      totalHealthScoreFromNumbers += score
    }
  }

  if (totalHealthScoreFromNumbers > 0) {
    suggestedStats.Strength = (suggestedStats.Strength || 0) + totalHealthScoreFromNumbers
  }

  // Cap points per stat
  for (const stat in suggestedStats) {
    suggestedStats[stat as keyof PlayerStats] = Math.min(
      suggestedStats[stat as keyof PlayerStats] || 0,
      MAX_POINTS_PER_STAT,
    )
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  console.log("AI Suggested Stats (Enhanced Context):", suggestedStats)
  return suggestedStats
}

export interface PlayerStats {
  IQ: number
  EQ: number
  Strength: number
  "Technical Attribute": number
  Aptitude: number
  "Problem Solving": number
}

export interface PlayerProfile {
  level: number
  rank: "E" | "D" | "C" | "B" | "A" | "S" | "S+"
  xp: number
  totalXp: number
  stats: PlayerStats
  nextLevelXp: number
  streak: number
  skillPoints: number
  customAttributes: Record<string, number>
  name: string
  theme: Theme
}

export type QuestType = "Daily" | "Normal" | "Weekly" | "Main"
export type QuestDifficulty = "Easy" | "Medium" | "Hard" | "Life Achievement"
export type Realm =
  | "Mind & Skill"
  | "Emotional & Spiritual"
  | "Body & Discipline"
  | "Creation & Mission"
  | "Heart & Loyalty"

export type Theme =
  | "classic-dark"
  | "cyberpunk-neon"
  | "deep-space"
  | "inferno-red"
  | "emerald-forest"
  | "royal-purple"
  | "crimson-dawn"
  | "ocean-breeze"
  | "sunset-orange"
  | "golden-dawn"
  | "neon-yellow"
  | "dark-forest"
  | "deep-cyan"

export interface Quest {
  id: string
  title: string
  description: string
  type: QuestType
  difficulty: QuestDifficulty
  xp: number
  realm: Realm
  completed: boolean
  createdAt: Date
  completedAt?: Date
  dueDate?: Date
  recurring?: boolean
  isOverdue?: boolean
  statBoosts?: Partial<PlayerStats>
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  requirement: {
    type: "level" | "quests_completed" | "streak" | "stat_threshold" | "total_xp"
    value: number
    stat?: keyof PlayerStats
  }
}

export interface PersonalReflection {
  mood: string
  emotionalState: string
  currentChallenges: string
  motivationLevel: string
  timestamp: Date
}

export interface GeminiResponse {
  quests: Omit<Quest, "id" | "completed" | "createdAt">[]
  suggestions: {
    focusArea: string
    motivation: string
    emotionalGuidance: string
  }
}

export interface StatSuggestionResponse {
  suggestedStats: Partial<PlayerStats>
  reasoning: string
}

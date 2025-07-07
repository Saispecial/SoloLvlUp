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
  | "aurora-borealis"
  | "midnight-storm"
  | "cosmic-purple"
  | "neon-pink"
  | "golden-sunset"

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
    type: "level" | "quests_completed" | "streak" | "stat_threshold" | "total_xp" | "reflection_streak" | "perfect_week" | "realm_master" | "speed_runner" | "consistency_king"
    value: number
    stat?: keyof PlayerStats
    realm?: Realm
  }
}

export interface PersonalReflection {
  mood: string
  emotionalState: string
  currentChallenges: string
  motivationLevel: string
  timestamp: Date
  diaryContent?: string
  source: "manual" | "diary"
}

export interface DiaryEntry {
  id: string
  content: string
  timestamp: Date
  convertedToReflection?: boolean
  reflectionId?: string
}

// Advanced Analytics Types
export interface MoodTrend {
  date: string
  mood: string
  emotionalState: string
  motivationLevel: number
  questsCompleted: number
  xpEarned: number
}

export interface PerformanceMetrics {
  dailyAverage: {
    questsCompleted: number
    xpEarned: number
    streakDays: number
  }
  weeklyStats: {
    totalQuests: number
    totalXP: number
    averageMood: number
    mostProductiveDay: string
  }
  monthlyProgress: {
    levelUps: number
    achievementsUnlocked: number
    statGrowth: Partial<PlayerStats>
  }
  realmPerformance: Record<Realm, {
    questsCompleted: number
    xpEarned: number
    averageDifficulty: string
  }>
}

export interface DetailedTracking {
  questHistory: {
    id: string
    title: string
    completedAt: Date
    timeToComplete: number // in hours
    difficulty: QuestDifficulty
    realm: Realm
    xp: number
    statBoosts: Partial<PlayerStats>
  }[]
  moodHistory: MoodTrend[]
  performanceMetrics: PerformanceMetrics
  lastUpdated: Date
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

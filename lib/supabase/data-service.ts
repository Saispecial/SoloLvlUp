import { createClient } from "./client"
import type { Quest, PersonalReflection, Achievement } from "@/lib/types"

const supabase = createClient()

// Get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id || null
}

// Profile functions
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("[v0] Error fetching profile:", error)
    return null
  }
  return data
}

export async function updateProfile(userId: string, displayName: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: displayName, updated_at: new Date().toISOString() })

  if (error) console.error("[v0] Error updating profile:", error)
  return !error
}

// Player Stats functions
export async function getPlayerStats(userId: string) {
  const { data, error } = await supabase.from("player_stats").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("[v0] Error fetching player stats:", error)
    return null
  }
  return data
}

export async function savePlayerStats(
  userId: string,
  stats: {
    level: number
    xp: number
    streak: number
    stats: Record<string, number>
    achievements: Achievement[]
  },
) {
  console.log("[v0] savePlayerStats called for user:", userId)
  const { error } = await supabase.from("player_stats").upsert(
    {
      user_id: userId,
      level: stats.level,
      xp: stats.xp,
      streak: stats.streak,
      stats: stats.stats,
      achievements: stats.achievements,
      last_activity_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (error) {
    console.error("[v0] Error saving player stats:", error)
    return false
  }
  console.log("[v0] Player stats saved successfully")
  return true
}

// Quest functions
export async function getQuests(userId: string) {
  console.log("[v0] getQuests called for user:", userId)
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quests:", error)
    return []
  }

  console.log("[v0] Fetched quests from database:", data?.length || 0)

  // Map database fields to app fields
  return data.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description || "",
    xp: q.xp_reward,
    type: q.type,
    difficulty: q.difficulty,
    realm: q.realm,
    completed: q.completed,
    dueDate: q.due_date ? new Date(q.due_date) : undefined,
    recurring: q.recurring,
    statBoosts: q.stat_boosts || {},
    createdAt: new Date(q.created_at),
    completedAt: q.completed_at ? new Date(q.completed_at) : undefined,
  }))
}

function mapQuestType(type: string): string {
  const typeMap: Record<string, string> = {
    Daily: "daily",
    daily: "daily",
    Weekly: "weekly",
    weekly: "weekly",
    Main: "main",
    main: "main",
    Side: "side",
    side: "side",
    Normal: "side", // Map Normal to side
    normal: "side",
  }
  return typeMap[type] || "daily"
}

function mapQuestRealm(realm: string): string {
  const realmMap: Record<string, string> = {
    "Physical Vitality": "Physical Vitality",
    "Mind & Skill": "Mind & Skill",
    "Social & Emotional": "Social & Emotional",
    "Spiritual Growth": "Spiritual Growth",
    // Map app realms to database realms
    "Body & Discipline": "Physical Vitality",
    "Emotional & Spiritual": "Spiritual Growth",
    "Creation & Mission": "Mind & Skill",
    "Heart & Loyalty": "Social & Emotional",
  }
  return realmMap[realm] || "Mind & Skill"
}

function mapQuestDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    Easy: "easy",
    easy: "easy",
    Medium: "medium",
    medium: "medium",
    Hard: "hard",
    hard: "hard",
    Extreme: "extreme",
    extreme: "extreme",
    Normal: "medium", // Map Normal to medium
    normal: "medium",
  }
  return difficultyMap[difficulty] || "easy"
}

export async function saveQuest(userId: string, quest: Quest): Promise<boolean> {
  console.log("[v0] saveQuest called - userId:", userId, "questId:", quest.id, "title:", quest.title)

  if (!userId) {
    console.error("[v0] saveQuest: No userId provided!")
    return false
  }

  if (!quest.id) {
    console.error("[v0] saveQuest: No quest.id provided!")
    return false
  }

  const questData = {
    id: quest.id,
    user_id: userId,
    title: quest.title,
    description: quest.description || "",
    xp_reward: quest.xp || 10,
    type: mapQuestType(quest.type || "daily"),
    difficulty: mapQuestDifficulty(quest.difficulty || "Easy"),
    realm: mapQuestRealm(quest.realm || "Mind & Skill"),
    completed: quest.completed || false,
    due_date: quest.dueDate ? new Date(quest.dueDate).toISOString() : null,
    recurring: quest.recurring || false,
    stat_boosts: quest.statBoosts || {},
    completed_at: quest.completedAt ? new Date(quest.completedAt).toISOString() : null,
    created_at: quest.createdAt ? new Date(quest.createdAt).toISOString() : new Date().toISOString(),
  }

  console.log("[v0] Saving quest data:", JSON.stringify(questData))

  const { data, error } = await supabase.from("quests").upsert(questData, { onConflict: "id" }).select()

  if (error) {
    console.error("[v0] Error saving quest:", error.message, error.details, error.hint)
    return false
  }

  console.log("[v0] Quest saved successfully:", quest.id, data)
  return true
}

export async function deleteQuestFromDb(questId: string) {
  console.log("[v0] deleteQuestFromDb called for quest:", questId)
  const { error } = await supabase.from("quests").delete().eq("id", questId)

  if (error) {
    console.error("[v0] Error deleting quest:", error)
    return false
  }
  console.log("[v0] Quest deleted successfully:", questId)
  return true
}

// Reflection functions
export async function getReflections(userId: string) {
  console.log("[v0] getReflections called for user:", userId)
  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching reflections:", error)
    return []
  }

  console.log("[v0] Fetched reflections from database:", data?.length || 0)

  return data.map((r) => ({
    mood: r.mood?.toString() || "",
    emotionalState: r.content || "",
    currentChallenges: r.challenges || "",
    motivationLevel: r.motivation_level?.toString() || "5",
    gratitude: r.gratitude || "",
    timestamp: new Date(r.created_at),
  }))
}

export async function saveReflection(userId: string, reflection: PersonalReflection): Promise<boolean> {
  console.log("[v0] saveReflection called - userId:", userId)

  if (!userId) {
    console.error("[v0] saveReflection: No userId provided!")
    return false
  }

  const reflectionData = {
    user_id: userId,
    mood: Number.parseInt(reflection.mood) || 5,
    content: reflection.emotionalState || "",
    challenges: reflection.currentChallenges || "",
    motivation_level: Number.parseInt(reflection.motivationLevel) || 5,
    gratitude: reflection.gratitude || "",
    created_at: reflection.timestamp ? new Date(reflection.timestamp).toISOString() : new Date().toISOString(),
  }

  console.log("[v0] Saving reflection data:", JSON.stringify(reflectionData))

  const { data, error } = await supabase.from("reflections").insert(reflectionData).select()

  if (error) {
    console.error("[v0] Error saving reflection:", error.message, error.details, error.hint)
    return false
  }

  console.log("[v0] Reflection saved successfully:", data)
  return true
}

// Load all user data
export async function loadUserData(userId: string) {
  console.log("[v0] loadUserData called for user:", userId)
  const [profile, stats, quests, reflections] = await Promise.all([
    getProfile(userId),
    getPlayerStats(userId),
    getQuests(userId),
    getReflections(userId),
  ])

  console.log(
    "[v0] Loaded data - profile:",
    !!profile,
    "stats:",
    !!stats,
    "quests:",
    quests.length,
    "reflections:",
    reflections.length,
  )

  return { profile, stats, quests, reflections }
}

// Initialize new user
export async function initializeNewUser(userId: string, displayName: string) {
  console.log("[v0] initializeNewUser called for user:", userId, "name:", displayName)

  // Create profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: displayName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    console.error("[v0] Error creating profile:", profileError)
  }

  // Create initial stats with correct stat names and default value of 10
  const { error: statsError } = await supabase.from("player_stats").upsert(
    {
      user_id: userId,
      level: 1,
      xp: 0,
      streak: 0,
      stats: {
        IQ: 10,
        EQ: 10,
        Strength: 10,
        "Technical Attribute": 10,
        Aptitude: 10,
        "Problem Solving": 10,
      },
      achievements: [],
      last_activity_date: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  )

  if (statsError) {
    console.error("[v0] Error creating player stats:", statsError)
  }

  console.log("[v0] New user initialized successfully")
}

// Reset user data
export async function resetUserData(userId: string) {
  console.log("[v0] resetUserData called for user:", userId)

  // Delete all quests
  const { error: questsError } = await supabase.from("quests").delete().eq("user_id", userId)

  if (questsError) {
    console.error("[v0] Error deleting quests:", questsError)
  }

  // Delete all reflections
  const { error: reflectionsError } = await supabase.from("reflections").delete().eq("user_id", userId)

  if (reflectionsError) {
    console.error("[v0] Error deleting reflections:", reflectionsError)
  }

  // Reset player stats using UPDATE instead of UPSERT to avoid RLS issues
  const { error: statsError } = await supabase
    .from("player_stats")
    .update({
      level: 1,
      xp: 0,
      streak: 0,
      stats: {
        IQ: 10,
        EQ: 10,
        Strength: 10,
        "Technical Attribute": 10,
        Aptitude: 10,
        "Problem Solving": 10,
      },
      achievements: [],
      last_activity_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (statsError) {
    console.error("[v0] Error resetting player stats:", statsError)
  }

  console.log("[v0] User data reset complete")
}

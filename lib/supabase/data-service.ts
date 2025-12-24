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
    console.error("Error fetching profile:", error)
    return null
  }
  return data
}

export async function updateProfile(userId: string, displayName: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, display_name: displayName, updated_at: new Date().toISOString() })

  if (error) console.error("Error updating profile:", error)
  return !error
}

// Player Stats functions
export async function getPlayerStats(userId: string) {
  const { data, error } = await supabase.from("player_stats").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching player stats:", error)
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

  if (error) console.error("Error saving player stats:", error)
  return !error
}

// Quest functions
export async function getQuests(userId: string) {
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quests:", error)
    return []
  }

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

export async function saveQuest(userId: string, quest: Quest) {
  const { error } = await supabase.from("quests").upsert(
    {
      id: quest.id,
      user_id: userId,
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xp,
      type: quest.type || "daily",
      difficulty: quest.difficulty?.toLowerCase() || "easy",
      realm: quest.realm || "Mind & Skill",
      completed: quest.completed,
      due_date: quest.dueDate ? new Date(quest.dueDate).toISOString() : null,
      recurring: quest.recurring || false,
      stat_boosts: quest.statBoosts || {},
      completed_at: quest.completedAt ? new Date(quest.completedAt).toISOString() : null,
    },
    { onConflict: "id" },
  )

  if (error) console.error("Error saving quest:", error)
  return !error
}

export async function deleteQuestFromDb(questId: string) {
  const { error } = await supabase.from("quests").delete().eq("id", questId)

  if (error) console.error("Error deleting quest:", error)
  return !error
}

// Reflection functions
export async function getReflections(userId: string) {
  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reflections:", error)
    return []
  }

  return data.map((r) => ({
    mood: r.mood?.toString() || "",
    emotionalState: r.content || "",
    currentChallenges: "",
    motivationLevel: r.motivation?.toString() || "5",
    timestamp: new Date(r.created_at),
  }))
}

export async function saveReflection(userId: string, reflection: PersonalReflection) {
  const { error } = await supabase.from("reflections").insert({
    user_id: userId,
    content: reflection.emotionalState,
    mood: Number.parseInt(reflection.mood) || 3,
    motivation: Number.parseInt(reflection.motivationLevel) || 5,
  })

  if (error) console.error("Error saving reflection:", error)
  return !error
}

// Load all user data from Supabase
export async function loadUserData(userId: string) {
  const [profile, stats, quests, reflections] = await Promise.all([
    getProfile(userId),
    getPlayerStats(userId),
    getQuests(userId),
    getReflections(userId),
  ])

  return {
    profile,
    stats,
    quests,
    reflections,
  }
}

// Initialize new user data
export async function initializeNewUser(userId: string, displayName: string) {
  // Create profile
  await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: displayName,
    },
    { onConflict: "id" },
  )

  // Create initial player stats
  await supabase.from("player_stats").upsert(
    {
      user_id: userId,
      level: 1,
      xp: 0,
      streak: 0,
      stats: {
        iq: 0,
        eq: 0,
        strength: 0,
        charisma: 0,
        wisdom: 0,
        luck: 0,
        technical_attribute: 0,
        aptitude: 0,
        problem_solving: 0,
      },
      achievements: [],
    },
    { onConflict: "user_id" },
  )
}

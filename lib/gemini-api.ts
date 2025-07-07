import type { GeminiResponse, PlayerProfile, PersonalReflection } from "./types"

export async function generateQuests(
  playerProfile: PlayerProfile,
  reflection?: PersonalReflection,
  diaryEntries?: any[],
): Promise<GeminiResponse> {
  try {
    const res = await fetch("/api/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player: playerProfile, reflection, diaryEntries }),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }

    return (await res.json()) as GeminiResponse
  } catch (error) {
    console.error("Error generating quests:", error)
    // Same local fallback as before
    return {
      quests: [
        {
          title: "Complete a coding challenge",
          description: "Solve one data structure or algorithm problem",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Mind & Skill",
        },
        {
          title: "Practice mindfulness",
          description: "Meditate for 10 minutes",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Emotional & Spiritual",
        },
        {
          title: "Physical exercise",
          description: "Do 30 minutes of physical activity",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Body & Discipline",
        },
      ],
      suggestions: {
        focusArea: "Mind & Skill",
        motivation: "Keep pushing your limits! Every quest completed makes you stronger.",
        emotionalGuidance: "Take time to reflect on your progress and celebrate small wins.",
      },
    }
  }
}

export async function getGeminiInsight(prompt: string, playerProfile?: PlayerProfile): Promise<string> {
  try {
    const body = playerProfile ? { prompt, player: playerProfile } : { prompt }
    const res = await fetch("/api/gemini-nlp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`)
    }
    const data = await res.json()
    return data.reply || "No insight available."
  } catch (error) {
    console.error("Error getting Gemini insight:", error)
    return "Sorry, I couldn't get a real-time insight right now."
  }
}

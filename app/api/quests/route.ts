import { type NextRequest, NextResponse } from "next/server"
import type { GeminiResponse, PlayerProfile, PersonalReflection } from "@/lib/types"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
const MAX_RETRIES = 3
const BACKOFF_MS = 500

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { player: PlayerProfile; reflection?: PersonalReflection; diaryEntries?: any[] }
    console.log("Received request body:", JSON.stringify(body, null, 2))

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const payload = {
      contents: [
        {
          parts: [{ text: buildPrompt(body.player, body.reflection, body.diaryEntries) }],
        },
      ],
    }

    let attempt = 0
    while (attempt < MAX_RETRIES) {
      const googleRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // success
      if (googleRes.ok) {
        const data = (await googleRes.json()) as any
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        const parsed: GeminiResponse = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { quests: [], suggestions: { focusArea: "", motivation: "", emotionalGuidance: "" } }
        return NextResponse.json(parsed)
      }

      // retry only on 503
      if (googleRes.status !== 503) {
        return NextResponse.json({ error: "Gemini API error" }, { status: googleRes.status })
      }

      // exponential back-off
      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)))
      attempt++
    }

    return NextResponse.json(
      {
        quests: [
          {
            title: "Take a mindful break",
            description: "Step away from your current task and take 10 deep breaths to center yourself",
            type: "Daily",
            difficulty: "Easy",
            xp: 10,
            realm: "Emotional & Spiritual",
          },
          {
            title: "Write in a journal",
            description: "Spend 15 minutes writing about your thoughts and feelings to process your emotions",
            type: "Daily",
            difficulty: "Easy",
            xp: 10,
            realm: "Emotional & Spiritual",
          },
          {
            title: "Do light exercise",
            description: "Take a 20-minute walk or do some gentle stretching to boost your energy",
            type: "Daily",
            difficulty: "Easy",
            xp: 10,
            realm: "Body & Discipline",
          },
          {
            title: "Connect with someone",
            description: "Reach out to a friend or family member for a meaningful conversation",
            type: "Normal",
            difficulty: "Medium",
            xp: 25,
            realm: "Heart & Loyalty",
          },
          {
            title: "Learn something new",
            description: "Spend 30 minutes learning a skill that interests you or helps with your goals",
            type: "Normal",
            difficulty: "Medium",
            xp: 25,
            realm: "Mind & Skill",
          },
          {
            title: "Weekly self-care routine",
            description: "Establish a weekly routine that nurtures your mental and physical well-being",
            type: "Weekly",
            difficulty: "Medium",
            xp: 50,
            realm: "Emotional & Spiritual",
          },
          {
            title: "Complete a meaningful project",
            description: "Work on or finish a project that aligns with your values and long-term goals",
            type: "Main",
            difficulty: "Life Achievement",
            xp: 100,
            realm: "Creation & Mission",
          },
        ],
        suggestions: {
          focusArea: "Emotional & Spiritual",
          motivation: "Remember that every small step forward is progress. You're stronger than you think!",
          emotionalGuidance: "Take time to process your feelings and be gentle with yourself during challenging times.",
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in quest generation API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

function buildPrompt(player: PlayerProfile, reflection?: PersonalReflection, diaryEntries?: any[]) {
  const reflectionContext = reflection
    ? `
PERSONAL REFLECTION CONTEXT:
Current Mood: ${reflection.mood}
Emotional State: ${reflection.emotionalState}
Current Challenges: ${reflection.currentChallenges}
Motivation Level: ${reflection.motivationLevel}
${reflection.diaryContent ? `Diary Content: ${reflection.diaryContent}` : ""}

Based on this reflection, generate quests that specifically address their emotional needs and current life situation.
`
    : ""

  const diaryContext = diaryEntries && diaryEntries.length > 0
    ? `
DIARY ENTRIES CONTEXT (Recent emotional patterns):
${diaryEntries.slice(0, 3).map((entry, index) => `
Entry ${index + 1} (${new Date(entry.timestamp).toLocaleDateString()}):
"${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}"
`).join('\n')}

Consider these diary entries to understand their emotional journey and provide more personalized quests.
`
    : ""

  return `
You are an AI RPG Quest Master for SoloLvlUp, a real-life gamification system. Generate personalized quests for a player with the following profile:

Level: ${player.level}
Rank: ${player.rank}
Total XP: ${player.totalXp}
Stats: ${JSON.stringify(player.stats, null, 2)}

${reflectionContext}
${diaryContext}

Generate quests across these 5 realms that respond to their inner world and external challenges:
1. Mind & Skill (boosts IQ, Technical Attribute, Problem Solving) - Coding, studying, learning
2. Emotional & Spiritual (boosts EQ) - Meditation, reflection, healing emotional burdens
3. Body & Discipline (boosts Strength) - Exercise, physical challenges, building discipline
4. Creation & Mission (boosts Aptitude) - Creative projects, pursuing goals, staying consistent
5. Heart & Loyalty (boosts EQ, Strength) - Relationships, community, supporting others

${
  reflection
    ? `
QUEST GENERATION GUIDELINES BASED ON REFLECTION:
- If they're stressed/overwhelmed: Focus on calming, grounding activities
- If they're motivated/excited: Channel energy into productive challenges
- If they're emotionally drained: Prioritize self-care and gentle healing
- If they're facing exams/deadlines: Balance study with stress relief
- If they're feeling isolated: Include social connection quests
- If they're lacking direction: Focus on goal-setting and purpose

The quests should promote:
- Healing emotional burdens
- Pushing through difficulty with discipline
- Staying consistent with their mission
- Encouraging creativity and reflection
- Physical or mental strengthening
`
    : ""
}

Quest Types to generate:
- Daily: 3 small, achievable daily tasks (10-25 XP each)
- Normal: 2 medium-term goals (25-50 XP each)
- Weekly: 1 consistent weekly habit (50 XP)
- Main: 1 major life goal or achievement (100+ XP)

Difficulty levels and XP rewards:
- Easy: 10 XP (simple daily tasks)
- Medium: 25 XP (moderate challenges)
- Hard: 50 XP (significant challenges)
- Life Achievement: 100 XP (major milestones)

Generate exactly 7 quests total: 3 Daily + 2 Normal + 1 Weekly + 1 Main

Return ONLY a valid JSON response in this exact format:
{
  "quests": [
    {
      "title": "Specific actionable quest title",
      "description": "Detailed description of exactly what to do and how to complete it",
      "type": "Daily",
      "difficulty": "Easy",
      "xp": 10,
      "realm": "Mind & Skill"
    }
  ],
  "suggestions": {
    "focusArea": "The stat area the player should focus on most based on their current stats and reflection",
    "motivation": "Personalized motivational message based on their level, progress, and emotional state",
    "emotionalGuidance": "Specific guidance to help them navigate their current emotional situation"
  }
}

Make the quests specific, actionable, and emotionally responsive to their reflection. Higher level players should get more challenging quests.
`
}

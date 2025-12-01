import { type NextRequest, NextResponse } from "next/server"
import type { GeminiResponse, PlayerProfile } from "@/lib/types"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
const MAX_RETRIES = 3
const BACKOFF_MS = 500

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { player: PlayerProfile }
    console.log("Generating Arise Quests for player level:", body.player.level)

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const payload = {
      contents: [
        {
          parts: [{ text: buildAriseQuestsPrompt(body.player) }],
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

      if (googleRes.ok) {
        const data = (await googleRes.json()) as any
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"
        const jsonMatch = raw.match(/\{[\s\S]*\}/)
        const parsed: GeminiResponse = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { quests: [], suggestions: { focusArea: "", motivation: "", emotionalGuidance: "" } }
        return NextResponse.json(parsed)
      }

      if (googleRes.status !== 503) {
        return NextResponse.json({ error: "Gemini API error" }, { status: googleRes.status })
      }

      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)))
      attempt++
    }

    // Fallback quests for general self-improvement
    return NextResponse.json({
      quests: [
        {
          title: "Morning Hydration Ritual",
          description: "Drink a full glass of water first thing in the morning to hydrate and energize your body",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Body & Discipline",
        },
        {
          title: "Practice Gratitude",
          description: "Write down 3 things you're grateful for today to cultivate a positive mindset",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Emotional & Spiritual",
        },
        {
          title: "Read for Growth",
          description: "Spend 20 minutes reading an article, book, or educational content to expand your knowledge",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Mind & Skill",
        },
        {
          title: "Evening Reflection",
          description: "Spend 10 minutes reflecting on what went well today and what you learned",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Emotional & Spiritual",
        },
        {
          title: "Physical Activity Challenge",
          description: "Do 30 minutes of physical activity - walking, stretching, dancing, or any movement you enjoy",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Body & Discipline",
        },
        {
          title: "Learn a New Skill",
          description: "Dedicate 30 minutes to learning something new that interests you or improves your abilities",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Mind & Skill",
        },
        {
          title: "Connect with Someone",
          description: "Reach out to a friend, family member, or colleague for a genuine conversation",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Heart & Loyalty",
        },
      ],
      suggestions: {
        focusArea: "Overall Personal Development",
        motivation: "Each small action compounds over time. You're building the habits of a champion!",
        emotionalGuidance: "Focus on consistency rather than perfection. Progress comes from showing up every day.",
      },
    })
  } catch (error) {
    console.error("Error in Arise Quests generation:", error)
    return NextResponse.json({ error: "Failed to generate Arise Quests" }, { status: 500 })
  }
}

function buildAriseQuestsPrompt(player: PlayerProfile) {
  return `
You are an AI RPG Quest Master for SoloLvlUp, a real-life gamification system. Generate GENERIC daily self-improvement quests for any adult or teenager that will help them become better, more productive, and more well-rounded.

Player Level: ${player.level}
Player Rank: ${player.rank}

These "Arise Quests" should NOT be based on personal reflection or specific life situations. Instead, generate universal quests that ANY normal person can do to improve their everyday life and stats.

IMPORTANT GUIDELINES:
- Do NOT generate specific or technical quests (no coding, no specialized skills)
- Generate ONLY universal, accessible activities that any adult or teenager can do
- Focus on habits that build character, discipline, health, and wisdom
- Avoid anything that requires special skills, equipment, or circumstances
- Exclude "Technical Attribute" from stat improvements - focus on all other stats instead
- Create quests that are motivating, achievable, and progressively challenging

Generate quests across these realms:
1. Mind & Skill (boosts IQ, Problem Solving) - Learning, reading, thinking challenges
2. Emotional & Spiritual (boosts EQ) - Mindfulness, gratitude, emotional awareness
3. Body & Discipline (boosts Strength) - Exercise, physical activity, health habits
4. Creation & Mission (boosts Aptitude) - Creative expression, personal projects, pursuits
5. Heart & Loyalty (boosts EQ, Strength) - Connections, helping others, relationships

Quest Types to generate:
- Daily: 5-7 small, achievable daily tasks (10-25 XP each) - These should be universal habits everyone can build
- Normal: 1-2 medium-term goals (25-50 XP each)
- Weekly: 1 consistent weekly habit (50 XP)

Generate exactly 7 quests total

Difficulty levels and XP:
- Easy: 10 XP (simple daily habits)
- Medium: 25 XP (moderate self-improvement)
- Hard: 50 XP (significant personal growth)

Return ONLY a valid JSON response in this exact format:
{
  "quests": [
    {
      "title": "Universal quest title",
      "description": "Actionable description anyone can do",
      "type": "Daily",
      "difficulty": "Easy",
      "xp": 10,
      "realm": "Mind & Skill"
    }
  ],
  "suggestions": {
    "focusArea": "Overall Growth",
    "motivation": "Motivational message about daily improvement",
    "emotionalGuidance": "Encouragement to maintain consistency and enjoy the journey"
  }
}

Make quests actionable, inspiring, and universally applicable to help any person level up their life.
`
}

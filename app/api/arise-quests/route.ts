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

    return NextResponse.json({
      quests: [
        {
          title: "Morning Hydration + Stretch Combo",
          description:
            "Chug a full glass of water and do a 5-minute stretch right when you wake up - start the day with that main character energy",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Body & Discipline",
        },
        {
          title: "Gratitude Lock-In",
          description:
            "Write down 3 things you're grateful for today - build that abundance mindset and positive mental state",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Emotional & Spiritual",
        },
        {
          title: "Level Up Your Knowledge",
          description:
            "Read 20 pages of a book, listen to a podcast episode, or watch an educational video - feed your brain quality content",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Mind & Skill",
        },
        {
          title: "Evening Reflection Session",
          description:
            "Spend 10 minutes journaling about what went well today and what you learned - process like a champion",
          type: "Daily",
          difficulty: "Easy",
          xp: 10,
          realm: "Emotional & Spiritual",
        },
        {
          title: "Move Your Body",
          description:
            "Hit 30 minutes of physical activity - gym, run, dance, yoga, sports, whatever gets you moving. Consistency is king.",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Body & Discipline",
        },
        {
          title: "Build Your Skills",
          description:
            "Dedicate 30 minutes to learning something new or leveling up an existing skill - invest in your future self",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Mind & Skill",
        },
        {
          title: "Connect IRL",
          description:
            "Have a real conversation with someone you care about - text doesn't count, make the call or meet up",
          type: "Daily",
          difficulty: "Medium",
          xp: 25,
          realm: "Heart & Loyalty",
        },
      ],
      suggestions: {
        focusArea: "Building Your Best Life",
        motivation:
          "Every small win compounds. You're not just surviving, you're actively leveling up. Lock in and watch what happens.",
        emotionalGuidance:
          "Consistency > perfection. You don't need to be perfect, you just need to show up. Stack those small wins daily.",
      },
    })
  } catch (error) {
    console.error("Error in Arise Quests generation:", error)
    return NextResponse.json({ error: "Failed to generate Arise Quests" }, { status: 500 })
  }
}

function buildAriseQuestsPrompt(player: PlayerProfile) {
  return `
You are an AI Quest Master for SoloLvlUp, a real-life RPG for ambitious 18-25 year olds who want to level up their lives. Generate HYPE, actionable daily quests that feel like main character energy.

Player Level: ${player.level}
Player Rank: ${player.rank}

These "Arise Quests" are designed for young adults navigating the chaos of early adulthood - college, first jobs, side hustles, relationships, mental health, and personal growth. Generate universal quests that ANY 18-25 year old can do to improve their life, build momentum, and unlock their potential.

IMPORTANT GUIDELINES:
- Write with ENERGY and authenticity - this is for Gen Z/young millennials who want real growth
- Do NOT generate overly specific quests (no coding, no specialized skills required)
- Generate ONLY universal, accessible activities that any 18-25 year old can do TODAY
- Focus on habits that build confidence, discipline, health, knowledge, and connections
- Avoid anything requiring special skills, expensive equipment, or specific circumstances
- Exclude "Technical Attribute" from stat improvements - focus on all other stats
- Make quests feel achievable but meaningful - no cringe corporate wellness vibes
- Use language that resonates: "lock in", "level up", "main character energy", "beast mode", etc.

Generate quests across these realms (keep these exact names):
1. Mind & Skill (boosts IQ, Problem Solving) - Learning, reading, skill-building, mental challenges
2. Emotional & Spiritual (boosts EQ) - Mindfulness, self-awareness, emotional intelligence, reflection
3. Body & Discipline (boosts Strength) - Fitness, nutrition, sleep, physical health, building discipline
4. Creation & Mission (boosts Aptitude) - Creative projects, side hustles, passion pursuits, building something
5. Heart & Loyalty (boosts EQ, Strength) - Friendships, relationships, helping others, community

Quest Types to generate:
- Daily: 5-7 small wins you can stack every day (10-25 XP each) - Morning routines, productive habits, self-care
- Normal: 1-2 medium-term goals that take real effort (25-50 XP each) - Weekly challenges, skill development
- Weekly: 1 consistent weekly habit to build momentum (50 XP)

Generate exactly 7 quests total that will make a 18-25 year old think "damn, I can actually do this today"

Difficulty levels and XP (KEEP THESE EXACT):
- Easy: 10 XP (quick daily habits, under 15 minutes)
- Medium: 25 XP (moderate effort, 15-45 minutes)
- Hard: 50 XP (significant commitment, weekly consistency)

Quest Examples for Inspiration (DO NOT COPY, create NEW ones):
- "Lock in with a 10-minute morning routine" (Body & Discipline, Easy, 10 XP)
- "Read 20 pages of a book that will level up your knowledge" (Mind & Skill, Easy, 10 XP)
- "Hit the gym or do a 20-minute home workout - consistency is king" (Body & Discipline, Medium, 25 XP)
- "Journal for 10 minutes - process your thoughts like a champion" (Emotional & Spiritual, Easy, 10 XP)
- "Work on a side project or creative pursuit for 30 minutes" (Creation & Mission, Medium, 25 XP)
- "Call or meet up with someone you care about - real connection matters" (Heart & Loyalty, Medium, 25 XP)
- "Complete a 7-day meditation or gratitude practice streak" (Emotional & Spiritual, Hard, 50 XP)

Return ONLY a valid JSON response in this exact format:
{
  "quests": [
    {
      "title": "Quest title with energy",
      "description": "Clear, actionable description that makes you want to do it right now",
      "type": "Daily",
      "difficulty": "Easy",
      "xp": 10,
      "realm": "Mind & Skill"
    }
  ],
  "suggestions": {
    "focusArea": "Main focus area for growth",
    "motivation": "Hype message that makes them want to lock in and level up",
    "emotionalGuidance": "Real talk encouragement - consistency beats perfection, small wins compound"
  }
}

Make quests feel REAL, ACHIEVABLE, and MOTIVATING for someone in their early 20s building their life.
`
}

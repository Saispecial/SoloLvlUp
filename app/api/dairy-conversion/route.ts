import { type NextRequest, NextResponse } from "next/server"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
const MAX_RETRIES = 3
const BACKOFF_MS = 500

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { diaryContent: string }
    console.log("Received diary conversion request")

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const payload = {
      contents: [
        {
          parts: [{ text: buildDiaryConversionPrompt(body.diaryContent) }],
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
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : getFallbackReflection()
        return NextResponse.json(parsed)
      }

      if (googleRes.status !== 503) {
        return NextResponse.json({ error: "Gemini API error" }, { status: googleRes.status })
      }

      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)))
      attempt++
    }

    return NextResponse.json(getFallbackReflection(), { status: 200 })
  } catch (error) {
    console.error("Error in diary conversion API:", error)
    return NextResponse.json(getFallbackReflection(), { status: 200 })
  }
}

function buildDiaryConversionPrompt(diaryContent: string) {
  return `
You are an AI emotional intelligence specialist for SoloLvlUp, a personal growth RPG system. Your task is to analyze a diary entry and convert it into a structured personal reflection format.

DIARY ENTRY:
${diaryContent}

Analyze this diary entry and extract the following emotional and psychological insights:

1. MOOD: What is the overall emotional tone? (e.g., "excited", "anxious", "peaceful", "frustrated", "hopeful", "overwhelmed", "confident", "uncertain")

2. EMOTIONAL STATE: What deeper emotional patterns are present? (e.g., "feeling overwhelmed but determined", "balanced and content", "stressed but optimistic", "confident and motivated", "anxious but hopeful")

3. CURRENT CHALLENGES: What obstacles or difficulties are they facing? (e.g., "work deadlines and stress", "relationship issues", "health concerns", "financial pressure", "lack of direction", "imposter syndrome")

4. MOTIVATION LEVEL: On a scale of 1-10, how motivated do they seem? (1 = completely unmotivated, 10 = highly motivated)

Consider:
- Emotional vocabulary and tone
- Stress indicators
- Positive vs negative language
- Energy levels mentioned
- Goals and aspirations expressed
- Frustrations or obstacles described
- Self-reflection depth

Return ONLY a valid JSON response in this exact format:
{
  "mood": "specific mood word",
  "emotionalState": "detailed emotional description",
  "currentChallenges": "specific challenges they're facing",
  "motivationLevel": "number 1-10 as string"
}

Be empathetic and accurate in your analysis. This will be used to generate personalized quests and emotional guidance.
`
}

function getFallbackReflection() {
  return {
    mood: "neutral",
    emotionalState: "balanced",
    currentChallenges: "general life challenges",
    motivationLevel: "5",
  }
}

import { type NextRequest, NextResponse } from "next/server"

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
const MAX_RETRIES = 3
const BACKOFF_MS = 500

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { text: string }
    console.log("Received emotional analysis request")

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    const payload = {
      contents: [
        {
          parts: [{ text: buildEmotionalAnalysisPrompt(body.text) }],
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
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : getFallbackAnalysis()
        return NextResponse.json(parsed)
      }

      if (googleRes.status !== 503) {
        return NextResponse.json({ error: "Gemini API error" }, { status: googleRes.status })
      }

      await new Promise((r) => setTimeout(r, BACKOFF_MS * (attempt + 1)))
      attempt++
    }

    return NextResponse.json(getFallbackAnalysis(), { status: 200 })
  } catch (error) {
    console.error("Error in emotional analysis API:", error)
    return NextResponse.json(getFallbackAnalysis(), { status: 200 })
  }
}

function buildEmotionalAnalysisPrompt(text: string) {
  return `
You are an AI emotional intelligence specialist for SoloLvlUp. Analyze the emotional tone and sentiment of the following text:

TEXT TO ANALYZE:
${text}

Provide a comprehensive emotional analysis including:

1. EMOTIONAL TONE: A brief description of the overall emotional tone (e.g., "confident and optimistic", "anxious and uncertain", "peaceful and content")

2. SENTIMENT: Overall sentiment classification ("positive", "negative", or "neutral")

3. KEY EMOTIONS: Array of specific emotions detected (e.g., ["excitement", "anxiety", "hope", "frustration"])

4. STRESS LEVEL: A number from 1-10 indicating perceived stress level (1 = very relaxed, 10 = extremely stressed)

Consider:
- Emotional vocabulary used
- Sentence structure and tone
- Stress indicators
- Positive vs negative language patterns
- Energy levels expressed
- Confidence indicators
- Anxiety or worry signals

Return ONLY a valid JSON response in this exact format:
{
  "emotionalTone": "description of emotional tone",
  "sentiment": "positive|negative|neutral",
  "keyEmotions": ["emotion1", "emotion2", "emotion3"],
  "stressLevel": number
}

Be accurate and empathetic in your analysis.
`
}

function getFallbackAnalysis() {
  return {
    emotionalTone: "neutral",
    sentiment: "neutral",
    keyEmotions: [],
    stressLevel: 5,
  }
}
